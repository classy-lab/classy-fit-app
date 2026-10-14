import { useCallback, useContext, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import Feather from '@expo/vector-icons/Feather'
import { showMessage } from 'react-native-flash-message'
import { AppColors } from '../../styles/colors'
import { UserContext } from '../../context/UserContext'

const normalizeToken = (value) => String(value ?? '').trim()

const refreshAccessTokenWithRefresh = async ({
  refreshToken,
  webServer,
  setTokens,
}) => {
  const effectiveRefreshToken = normalizeToken(refreshToken)
  if (!effectiveRefreshToken) {
    return null
  }

  const refreshResponse = await fetch(`${webServer}/api/v1/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      token: effectiveRefreshToken,
    }),
  })

  if (!refreshResponse.ok) {
    return null
  }

  const refreshObj = await refreshResponse.json()
  if (!refreshObj?.access_token || !refreshObj?.refresh_token) {
    return null
  }

  const nextTokens = {
    access_token: refreshObj.access_token,
    refresh_token: refreshObj.refresh_token,
  }

  setTokens((prev) => ({
    ...(prev ?? {}),
    access_token: nextTokens.access_token,
    refresh_token: nextTokens.refresh_token,
  }))

  return nextTokens.access_token
}

const performAuthenticatedRequestWithRefresh = async ({
  endpoint,
  init = {} as RequestInit,
  accessToken,
  refreshToken,
  webServer,
  setTokens,
}) => {
  const requestAccessToken = normalizeToken(accessToken)
  if (!requestAccessToken) {
    return null
  }

  const requestWithToken = async (token) => {
    const headers = new Headers(init.headers ?? undefined)
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json')
    }
    headers.set('Authorization', `Bearer ${token}`)

    return fetch(endpoint, {
      ...init,
      headers,
    })
  }

  const response = await requestWithToken(requestAccessToken)
  if (response.ok) {
    return response
  }

  if (response.status !== 401) {
    return response
  }

  const refreshedAccessToken = await refreshAccessTokenWithRefresh({
    refreshToken,
    webServer,
    setTokens,
  })

  if (!refreshedAccessToken) {
    return response
  }

  return requestWithToken(refreshedAccessToken)
}

type RefreshTokens = {
  access_token?: string
  refresh_token?: string
}

type UserContextValue = {
  user?: {
    role?: string | null
  } | null
  tokens?: RefreshTokens | null
  setTokens: (value: RefreshTokens | null | ((prev: RefreshTokens | null) => RefreshTokens | null)) => void
  webServer: string
}

type MembershipPlanStatus = 'active' | 'inactive' | string

type MembershipPlan = {
  uid: number
  gym_id: number
  name: string
  description: string | null
  duration_months: number
  price: number | string
  currency_code: string
  status: MembershipPlanStatus
  created_at: string | null
  updated_at: string | null
}

type MembershipPlanListResponse = {
  status?: string
  data?: MembershipPlan[]
  message?: string
}

type MembershipPlanManagementNavigation = {
  goBack: () => void
  navigate: (
    screen: 'AddMembershipPlanScreen' | 'EditMembershipPlanScreen',
    params?: { planUid?: number }
  ) => void
}

type LoadOptions = {
  isRefresh?: boolean
}

const durationOrder: Record<number, number> = {
  1: 0,
  3: 1,
  6: 2,
  12: 3,
}

const durationLabels: Record<number, string> = {
  1: '1 Month',
  3: '3 Months',
  6: '6 Months',
  12: '12 Months',
}

const sortMembershipPlans = (plans: MembershipPlan[]) => {
  return [...plans].sort((left, right) => {
    const leftDuration = Number(left?.duration_months ?? 0)
    const rightDuration = Number(right?.duration_months ?? 0)
    const leftRank = durationOrder[leftDuration] ?? 100 + leftDuration
    const rightRank = durationOrder[rightDuration] ?? 100 + rightDuration

    if (leftRank !== rightRank) {
      return leftRank - rightRank
    }

    return String(left?.name ?? '').localeCompare(String(right?.name ?? ''))
  })
}

const formatDurationLabel = (durationMonths?: number | string | null) => {
  const duration = Number(durationMonths ?? 0)
  if (durationLabels[duration]) {
    return durationLabels[duration]
  }

  if (duration > 0) {
    return `${duration} Months`
  }

  return 'Unknown duration'
}

const formatPlanPrice = (plan: MembershipPlan) => {
  const price = Number(plan?.price ?? 0)
  const currency = String(plan?.currency_code ?? '').trim().toUpperCase()

  return `${price.toFixed(2)} ${currency}`.trim()
}

const renderStatusLabel = (status?: MembershipPlanStatus) => {
  const normalized = String(status ?? 'active').trim().toLowerCase()
  if (!normalized) {
    return 'Unknown'
  }

  return normalized.charAt(0).toUpperCase() + normalized.slice(1)
}

const MembershipPlanManagementScreen = ({ navigation }: { navigation: MembershipPlanManagementNavigation }) => {
  const { user, tokens, setTokens, webServer } = useContext(UserContext) as UserContextValue
  const [plans, setPlans] = useState<MembershipPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [busyPlanUid, setBusyPlanUid] = useState<number | null>(null)

  const isOwner = String(user?.role ?? '').trim().toLowerCase() === 'owner'

  const performAuthenticatedRequest = async (
    endpoint: string,
    init = {} as RequestInit
  ): Promise<Response | null> => {
    return performAuthenticatedRequestWithRefresh({
      endpoint,
      init,
      accessToken: tokens?.access_token ?? null,
      refreshToken: tokens?.refresh_token ?? null,
      webServer,
      setTokens,
    })
  }

  const loadPlans = useCallback(
    async ({ isRefresh = false }: LoadOptions = {}) => {
      if (!tokens?.access_token) {
        setErrorMessage('Please sign in again to view membership plans.')
        setPlans([])
        setLoading(false)
        setRefreshing(false)
        return
      }

      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      setErrorMessage('')

      try {
        const response = await performAuthenticatedRequest(`${webServer}/api/v1/membership-plans`)
        if (!response) {
          setErrorMessage('Please sign in again to view membership plans.')
          setPlans([])
          return
        }

        const responseText = await response.text()
        let responseBody: MembershipPlanListResponse = {}
        if (responseText) {
          try {
            responseBody = JSON.parse(responseText)
          } catch {
            responseBody = { message: responseText }
          }
        }

        if (response.status !== 200) {
          const message = responseBody?.message || 'Unable to load membership plans.'
          setErrorMessage(message)
          setPlans([])
          showMessage({
            message: 'Membership plans unavailable',
            description: message,
            type: 'danger',
          })
          return
        }

        const sortedPlans = Array.isArray(responseBody?.data) ? sortMembershipPlans(responseBody.data) : []
        setPlans(sortedPlans)
      } catch {
        const message = 'Failed to load membership plans.'
        setErrorMessage(message)
        setPlans([])
        showMessage({
          message: 'Membership plans unavailable',
          description: message,
          type: 'danger',
        })
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [tokens?.access_token, webServer, setTokens]
  )

  useFocusEffect(
    useCallback(() => {
      void loadPlans()
    }, [loadPlans])
  )

  const onRefresh = () => {
    void loadPlans({ isRefresh: true })
  }

  const handleAddPlan = () => {
    navigation.navigate('AddMembershipPlanScreen')
  }

  const handleEditPlan = (planUid: number) => {
    navigation.navigate('EditMembershipPlanScreen', { planUid })
  }

  const buildPlanPayload = (plan: MembershipPlan, nextStatus: MembershipPlanStatus) => ({
    name: String(plan?.name ?? '').trim(),
    description: plan?.description ? String(plan.description).trim() : '',
    duration_months: Number(plan?.duration_months ?? 0),
    price: Number(plan?.price ?? 0),
    currency_code: String(plan?.currency_code ?? '').trim().toUpperCase(),
    status: String(nextStatus ?? plan?.status ?? 'active').trim().toLowerCase(),
  })

  const updatePlanStatus = async (plan: MembershipPlan, nextStatus: MembershipPlanStatus) => {
    const planUid = Number(plan?.uid ?? 0)
    if (!planUid || busyPlanUid !== null) {
      return
    }

    setBusyPlanUid(planUid)

    try {
      const response = await performAuthenticatedRequest(`${webServer}/api/v1/membership-plans/${planUid}`, {
        method: 'PUT',
        body: JSON.stringify(buildPlanPayload(plan, nextStatus)),
      })

      if (!response) {
        showMessage({
          message: 'Update failed',
          description: 'Please sign in again to manage membership plans.',
          type: 'danger',
        })
        return
      }

      const responseText = await response.text()
      let responseBody: { message?: string } = {}
      if (responseText) {
        try {
          responseBody = JSON.parse(responseText)
        } catch {
          responseBody = { message: responseText }
        }
      }

      if (response.status === 200) {
        showMessage({
          message: 'Membership plan updated',
          description: responseBody?.message || 'The membership plan was updated successfully.',
          type: 'success',
        })
        await loadPlans({ isRefresh: true })
        return
      }

      if (response.status === 401 || response.status === 403) {
        const message = responseBody?.message || 'You do not have permission to update this plan.'
        showMessage({
          message: 'Permission denied',
          description: message,
          type: 'danger',
        })
        return
      }

      const message = responseBody?.message || 'Unable to update membership plan.'
      showMessage({
        message: 'Update failed',
        description: message,
        type: 'danger',
      })
    } catch {
      showMessage({
        message: 'Update failed',
        description: 'Unable to update membership plan.',
        type: 'danger',
      })
    } finally {
      setBusyPlanUid((current) => (current === planUid ? null : current))
    }
  }

  const confirmToggleStatus = (plan: MembershipPlan) => {
    const currentStatus = String(plan?.status ?? '').trim().toLowerCase()
    const nextStatus = currentStatus === 'inactive' ? 'active' : 'inactive'
    const verb = nextStatus === 'active' ? 'Reactivate' : 'Deactivate'

    Alert.alert(
      `${verb} membership plan?`,
      nextStatus === 'active'
        ? 'This will make the plan visible again to members.'
        : 'This will hide the plan from members without deleting it.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: verb,
          style: 'default',
          onPress: () => {
            void updatePlanStatus(plan, nextStatus)
          },
        },
      ]
    )
  }

  const deletePlan = async (plan: MembershipPlan) => {
    const planUid = Number(plan?.uid ?? 0)
    if (!planUid || busyPlanUid !== null) {
      return
    }

    setBusyPlanUid(planUid)

    try {
      const response = await performAuthenticatedRequest(`${webServer}/api/v1/membership-plans/${planUid}`, {
        method: 'DELETE',
      })

      if (!response) {
        showMessage({
          message: 'Delete failed',
          description: 'Please sign in again to delete membership plans.',
          type: 'danger',
        })
        return
      }

      const responseText = await response.text()
      let responseBody: { message?: string } = {}
      if (responseText) {
        try {
          responseBody = JSON.parse(responseText)
        } catch {
          responseBody = { message: responseText }
        }
      }

      if (response.status === 200) {
        showMessage({
          message: 'Membership plan deleted',
          description: responseBody?.message || 'The membership plan was deleted successfully.',
          type: 'success',
        })
        await loadPlans({ isRefresh: true })
        return
      }

      if (response.status === 409) {
        showMessage({
          message: 'Delete blocked',
          description:
            responseBody?.message ||
            'This membership plan has historical memberships and cannot be deleted. Deactivate it instead.',
          type: 'danger',
        })
        return
      }

      if (response.status === 401 || response.status === 403) {
        const message = responseBody?.message || 'You do not have permission to delete this plan.'
        showMessage({
          message: 'Permission denied',
          description: message,
          type: 'danger',
        })
        return
      }

      const message = responseBody?.message || 'Unable to delete membership plan.'
      showMessage({
        message: 'Delete failed',
        description: message,
        type: 'danger',
      })
    } catch {
      showMessage({
        message: 'Delete failed',
        description: 'Unable to delete membership plan.',
        type: 'danger',
      })
    } finally {
      setBusyPlanUid((current) => (current === planUid ? null : current))
    }
  }

  const confirmDeletePlan = (plan: MembershipPlan) => {
    Alert.alert(
      'Delete membership plan?',
      'This will permanently delete the plan if it has no historical memberships.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void deletePlan(plan)
          },
        },
      ],
      { cancelable: true }
    )
  }

  if (!isOwner) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.navs}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Feather name="arrow-left" color={AppColors.blue} size={36} />
          </TouchableOpacity>
          <Text style={styles.title}>Membership Plans</Text>
          <View style={styles.spacer} />
        </View>

        <View style={styles.centerState}>
          <Text style={styles.emptyTitle}>Owner access required</Text>
          <Text style={styles.stateText}>This screen is only available to gym owners.</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.navs}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" color={AppColors.blue} size={36} />
        </TouchableOpacity>
        <Text style={styles.title}>Membership Plans</Text>
        <View style={styles.spacer} />
      </View>

      <View style={styles.actionsBar}>
        <TouchableOpacity style={styles.addButton} activeOpacity={0.85} onPress={handleAddPlan}>
          <Feather name="plus" color={AppColors.white} size={18} />
          <Text style={styles.addButtonText}>Add Membership Plan</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={AppColors.blue} />}
      >
        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color={AppColors.blue} />
            <Text style={styles.stateText}>Loading membership plans...</Text>
          </View>
        ) : errorMessage ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Unable to load membership plans</Text>
            <Text style={styles.errorText}>{errorMessage}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => loadPlans()}>
              <Text style={styles.retryBtnText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : plans.length === 0 ? (
          <View style={styles.centerState}>
            <Text style={styles.emptyTitle}>No membership plans yet</Text>
            <Text style={styles.stateText}>Create your first plan to start offering memberships.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {plans.map((plan) => {
              const planUid = Number(plan?.uid ?? 0)
              const status = String(plan?.status ?? 'active').trim().toLowerCase()
              const isBusy = busyPlanUid === planUid
              const description = String(plan?.description ?? '').trim()
              const durationLabel = formatDurationLabel(plan?.duration_months)
              const priceLabel = formatPlanPrice(plan)

              return (
                <View key={planUid || `${plan?.name}-${plan?.created_at ?? 'plan'}`} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderText}>
                      <Text style={styles.cardTitle}>{plan?.name || 'Untitled plan'}</Text>
                      <Text style={styles.cardSubtitle}>{durationLabel}</Text>
                    </View>
                    <View style={[styles.statusPill, status === 'inactive' ? styles.statusInactive : styles.statusActive]}>
                      <Text style={styles.statusText}>{renderStatusLabel(status)}</Text>
                    </View>
                  </View>

                  {description ? (
                    <Text style={styles.description} numberOfLines={3}>
                      {description}
                    </Text>
                  ) : null}

                  <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                      <Text style={styles.metaLabel}>Price</Text>
                      <Text style={styles.metaValue}>{priceLabel}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Text style={styles.metaLabel}>Currency</Text>
                      <Text style={styles.metaValue}>{String(plan?.currency_code ?? '').trim().toUpperCase() || '—'}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Text style={styles.metaLabel}>Duration</Text>
                      <Text style={styles.metaValue}>{durationLabel}</Text>
                    </View>
                  </View>

                  <View style={styles.cardActions}>
                    <TouchableOpacity style={styles.editButton} onPress={() => handleEditPlan(planUid)}>
                      <Feather name="edit-2" color={AppColors.blue} size={16} />
                      <Text style={styles.editButtonText}>Edit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.statusButton, isBusy ? styles.buttonDisabled : null]}
                      onPress={() => confirmToggleStatus(plan)}
                      disabled={isBusy}
                    >
                      {isBusy ? (
                        <ActivityIndicator size="small" color={AppColors.white} />
                      ) : (
                        <>
                          <Feather name={status === 'inactive' ? 'refresh-cw' : 'pause-circle'} color={AppColors.white} size={16} />
                          <Text style={styles.statusButtonText}>{status === 'inactive' ? 'Reactivate' : 'Deactivate'}</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={[styles.deleteButton, isBusy ? styles.buttonDisabled : null]}
                    onPress={() => confirmDeletePlan(plan)}
                    disabled={isBusy}
                  >
                    {isBusy ? (
                      <ActivityIndicator size="small" color={AppColors.white} />
                    ) : (
                      <>
                        <Feather name="trash-2" color={AppColors.white} size={16} />
                        <Text style={styles.deleteButtonText}>Delete</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

export default MembershipPlanManagementScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.white,
  },
  navs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 6,
  },
  backBtn: {
    paddingRight: 8,
    paddingVertical: 4,
  },
  title: {
    color: AppColors.blue,
    fontSize: 26,
    flex: 1,
    textAlign: 'center',
  },
  spacer: {
    width: 44,
  },
  actionsBar: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  addButton: {
    backgroundColor: AppColors.blue,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addButtonText: {
    color: AppColors.white,
    fontSize: 15,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 28,
  },
  centerState: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 16,
  },
  emptyTitle: {
    fontSize: 20,
    color: AppColors.blue,
    textAlign: 'center',
  },
  stateText: {
    marginTop: 12,
    fontSize: 16,
    color: AppColors.grey3,
    textAlign: 'center',
    lineHeight: 22,
  },
  errorCard: {
    backgroundColor: AppColors.white,
    borderColor: AppColors.grey,
    borderWidth: 1,
    borderRadius: 18,
    padding: 20,
    marginVertical: 20,
  },
  errorTitle: {
    fontSize: 16,
    color: AppColors.blue,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: AppColors.grey3,
    marginBottom: 12,
    lineHeight: 20,
  },
  retryBtn: {
    backgroundColor: AppColors.blue,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  retryBtnText: {
    color: AppColors.white,
    fontSize: 14,
  },
  list: {
    gap: 14,
  },
  card: {
    backgroundColor: AppColors.white,
    borderRadius: 18,
    padding: 18,
    borderColor: AppColors.grey,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 12,
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    color: AppColors.blue,
    marginBottom: 4,
    lineHeight: 24,
  },
  cardSubtitle: {
    fontSize: 13,
    color: AppColors.white,
    backgroundColor: AppColors.blue,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusActive: {
    backgroundColor: AppColors.blue,
  },
  statusInactive: {
    backgroundColor: AppColors.grey3,
  },
  statusText: {
    color: AppColors.white,
    fontSize: 12,
  },
  description: {
    color: AppColors.primary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
  },
  metaItem: {
    flexBasis: '31%',
    backgroundColor: AppColors.grey,
    borderRadius: 14,
    padding: 12,
  },
  metaLabel: {
    color: AppColors.grey3,
    fontSize: 12,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  metaValue: {
    color: AppColors.blue,
    fontSize: 14,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
  },
  editButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: AppColors.blue,
    borderRadius: 999,
    paddingVertical: 11,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 48,
  },
  editButtonText: {
    color: AppColors.blue,
    fontSize: 15,
  },
  statusButton: {
    flex: 1,
    backgroundColor: AppColors.blue,
    borderRadius: 999,
    paddingVertical: 11,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 48,
  },
  statusButtonText: {
    color: AppColors.white,
    fontSize: 15,
  },
  deleteButton: {
    marginTop: 12,
    backgroundColor: AppColors.red,
    borderRadius: 999,
    paddingVertical: 11,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 48,
  },
  deleteButtonText: {
    color: AppColors.white,
    fontSize: 15,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
})