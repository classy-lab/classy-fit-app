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

type RefreshTokens = {
  access_token?: string
  refresh_token?: string
}

type UserContextValue = {
  user?: {
    gym_id?: number | string
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

type MembershipPlansResponse = {
  status?: string
  data?: MembershipPlan[]
  message?: string
}

type MembershipPlansNavigation = {
  goBack: () => void
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

const MembershipPlansScreen = ({ navigation }: { navigation: MembershipPlansNavigation }) => {
  const { user, tokens, setTokens, webServer } = useContext(UserContext) as UserContextValue
  const [plans, setPlans] = useState<MembershipPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const refreshAccessToken = async (): Promise<string | null> => {
    if (!tokens?.refresh_token) {
      return null
    }

    const refreshResponse = await fetch(`${webServer}/api/v1/refresh`, {
      method: 'POST',
      body: JSON.stringify({
        token: tokens.refresh_token,
      }),
    })

    if (refreshResponse.status !== 200) {
      return null
    }

    const refreshObj = await refreshResponse.json()
    if (!refreshObj?.access_token || !refreshObj?.refresh_token) {
      return null
    }

    setTokens((prev) => ({
      ...prev,
      access_token: refreshObj.access_token,
      refresh_token: refreshObj.refresh_token,
    }))

    return refreshObj.access_token
  }

  const performAuthenticatedRequest = async (
    endpoint: string,
    init: RequestInit = {}
  ): Promise<Response | null> => {
    if (!tokens?.access_token) {
      return null
    }

    const requestWithToken = async (accessToken: string) => {
      return fetch(endpoint, {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...(init.headers ?? {}),
          Authorization: `Bearer ${accessToken}`,
        },
      })
    }

    let accessToken = tokens.access_token
    let response = await requestWithToken(accessToken)

    if (response.status === 401 || response.status === 403) {
      const refreshedAccessToken = await refreshAccessToken()
      if (!refreshedAccessToken) {
        return response
      }

      accessToken = refreshedAccessToken
      response = await requestWithToken(accessToken)
    }

    return response
  }

  const loadPlans = useCallback(
    async ({ isRefresh = false }: { isRefresh?: boolean } = {}) => {
      if (!user?.gym_id || !tokens?.access_token) {
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
        let responseBody: MembershipPlansResponse = {}
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
    [tokens?.access_token, user?.gym_id, webServer, setTokens]
  )

  useFocusEffect(
    useCallback(() => {
      void loadPlans()
    }, [loadPlans])
  )

  const onRefresh = () => {
    void loadPlans({ isRefresh: true })
  }

  const choosePlan = (plan: MembershipPlan) => {
    Alert.alert(
      'Membership plans coming soon',
      `Choosing ${plan?.name || 'this plan'} will be available in a future update.`,
      [{ text: 'OK', style: 'default' }]
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
            <Text style={styles.emptyTitle}>No membership plans available</Text>
            <Text style={styles.stateText}>Check back later for plans at your gym.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {sortMembershipPlans(plans).map((plan) => {
              const planUid = Number(plan?.uid ?? 0)
              const description = String(plan?.description ?? '').trim()
              const durationLabel = formatDurationLabel(plan?.duration_months)
              const priceLabel = formatPlanPrice(plan)

              return (
                <View key={planUid || `${plan?.name}-${plan?.created_at ?? 'plan'}`} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderText}>
                      <Text style={styles.durationPill}>{durationLabel}</Text>
                      <Text style={styles.cardTitle}>{plan?.name || 'Untitled plan'}</Text>
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
                      <Text style={styles.metaLabel}>Duration</Text>
                      <Text style={styles.metaValue}>{durationLabel}</Text>
                    </View>
                  </View>

                  <TouchableOpacity style={styles.chooseButton} onPress={() => choosePlan(plan)}>
                    <Feather name="check-circle" color={AppColors.white} size={16} />
                    <Text style={styles.chooseButtonText}>Choose Plan</Text>
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

export default MembershipPlansScreen

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
    fontSize: 24,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  spacer: {
    width: 44,
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
    fontWeight: '700',
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
    fontWeight: '700',
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
    fontWeight: '700',
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
  durationPill: {
    fontSize: 13,
    fontWeight: '700',
    color: AppColors.white,
    backgroundColor: AppColors.blue,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: AppColors.blue,
    lineHeight: 24,
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
    flexBasis: '48%',
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
    fontWeight: '700',
  },
  chooseButton: {
    marginTop: 18,
    backgroundColor: AppColors.blue,
    borderRadius: 999,
    paddingVertical: 13,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  chooseButtonText: {
    color: AppColors.white,
    fontSize: 15,
    fontWeight: '700',
  },
})
