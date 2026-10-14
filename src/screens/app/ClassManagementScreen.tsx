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
import { showMessage } from 'react-native-flash-message'
import { Feather } from '@expo/vector-icons'
import { AppColors } from '../../styles/colors'
import { UserContext } from '../../context/UserContext'

type ClassStatus = 'active' | 'inactive' | string

type ManagedClass = {
  uid: number
  gym_id: number
  name: string
  description: string | null
  duration_minutes: number
  capacity: number
  price: number
  currency_code: string
  status: ClassStatus
  created_at: string | null
  updated_at: string | null
}

const normalizeToken = (value) => String(value ?? '').trim()

const tokenRefreshMessagePattern = /\b(?:token\s+has\s+expired|expired\s+(?:access\s+)?token|invalid\s+(?:access\s+)?token|token\s+is\s+invalid|jwt\s+expired|access\s+token\s+expired|authentication\s+token\s+expired)\b/i

const extractResponseText = async (response: Response): Promise<string> => {
  try {
    return await response.clone().text()
  } catch {
    return ''
  }
}

const extractMessageCandidates = (responseText: string): string[] => {
  const trimmed = String(responseText ?? '').trim()
  if (!trimmed) {
    return []
  }

  try {
    const parsed = JSON.parse(trimmed) as unknown
    if (typeof parsed === 'string') {
      return [parsed]
    }

    if (parsed && typeof parsed === 'object') {
      const payload = parsed as Record<string, unknown>
      const candidates: string[] = []

      if (typeof payload.message === 'string') candidates.push(payload.message)
      if (typeof payload.error === 'string') candidates.push(payload.error)
      if (Array.isArray(payload.errors)) {
        for (const error of payload.errors) {
          if (typeof error === 'string') candidates.push(error)
        }
      }

      if (candidates.length > 0) {
        return candidates
      }
    }
  } catch {
    // Fall through to the raw text below.
  }

  return [trimmed]
}

const shouldRefreshAuthResponse = async (response: Response): Promise<boolean> => {
  if (!response || response.ok) {
    return false
  }

  if (response.status === 401) {
    return true
  }

  if (response.status !== 400 && response.status !== 403) {
    return false
  }

  const responseText = await extractResponseText(response)
  const candidates = extractMessageCandidates(responseText)
  return candidates.some((candidate) => tokenRefreshMessagePattern.test(candidate))
}

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

  if (!(await shouldRefreshAuthResponse(response))) {
    return response
  }

  console.log('Access token expired, requesting new one - performAuthenticatedRequestWithRefresh()')
  const refreshedAccessToken = await refreshAccessTokenWithRefresh({
    refreshToken,
    webServer,
    setTokens,
  })

  if (!refreshedAccessToken) {
    return null
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

type ClassManagementNavigation = {
  goBack: () => void
  navigate: (screen: 'AddClassScreen' | 'EditClassScreen', params?: { classUid?: number }) => void
}

type LoadOptions = {
  isRefresh?: boolean
}

const ClassManagementScreen = ({ navigation }: { navigation: ClassManagementNavigation }) => {
  const { user, tokens, setTokens, webServer } = useContext(UserContext) as UserContextValue
  const [classes, setClasses] = useState<ManagedClass[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [deletingClassUids, setDeletingClassUids] = useState<Record<number, boolean>>({})
  const [activeTab, setActiveTab] = useState<'active' | 'inactive'>('active')

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

  const loadClasses = useCallback(async ({ isRefresh = false }: LoadOptions = {}) => {
    if (!tokens?.access_token) {
      setErrorMessage('Please sign in again to view classes.')
      setClasses([])
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
      const response = await performAuthenticatedRequest(`${webServer}/api/v1/classes`)
      if (!response) {
        setErrorMessage('Please sign in again to view classes.')
        setClasses([])
        return
      }

      const responseText = await response.text()
      let responseBody: { message?: string; data?: ManagedClass[] } = {}
      if (responseText) {
        try {
          responseBody = JSON.parse(responseText)
        } catch {
          responseBody = { message: responseText }
        }
      }

      if (response.status !== 200) {
        const message = responseBody?.message || 'Unable to load classes.'
        setErrorMessage(message)
        setClasses([])
        showMessage({
          message: 'Classes unavailable',
          description: message,
          type: 'danger',
        })
        return
      }

      setClasses(Array.isArray(responseBody?.data) ? responseBody.data : [])
    } catch {
      const message = 'Failed to load classes.'
      setErrorMessage(message)
      setClasses([])
      showMessage({
        message: 'Classes unavailable',
        description: message,
        type: 'danger',
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [tokens?.access_token, webServer])

  useFocusEffect(
    useCallback(() => {
      void loadClasses()
    }, [loadClasses])
  )

  const onRefresh = () => {
    void loadClasses({ isRefresh: true })
  }

  const renderPrice = (classItem: ManagedClass) => {
    const price = Number(classItem?.price ?? 0)
    if (price <= 0) {
      return 'Free'
    }

    const currency = String(classItem?.currency_code ?? '').trim().toUpperCase()
    return `${price.toFixed(2)} ${currency}`.trim()
  }

  const renderStatusLabel = (status: ClassStatus) => {
    const normalized = String(status ?? '').trim().toLowerCase()
    if (!normalized) {
      return 'Unknown'
    }

    return normalized.charAt(0).toUpperCase() + normalized.slice(1)
  }

  const activeClasses = classes.filter((classItem) => String(classItem?.status ?? '').trim().toLowerCase() === 'active')
  const inactiveClasses = classes.filter((classItem) => String(classItem?.status ?? '').trim().toLowerCase() === 'inactive')
  const visibleClasses = activeTab === 'active' ? activeClasses : inactiveClasses
  const activeClassesLabel = activeTab === 'active' ? 'Active' : 'Inactive'

  const formatCreatedAt = (value: string | null) => {
    if (!value) {
      return 'Unknown'
    }

    const normalized = String(value).includes('T') ? String(value) : String(value).replace(' ', 'T')
    const date = new Date(normalized)
    if (Number.isNaN(date.getTime())) {
      return 'Unknown'
    }

    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date)
  }

  const handleAddClass = () => {
    navigation.navigate('AddClassScreen')
  }

  const handleEditClass = (classUid: number) => {
    navigation.navigate('EditClassScreen', { classUid })
  }

  const deleteClass = async (classUid: number) => {
    if (deletingClassUids[classUid]) {
      return
    }

    setDeletingClassUids((prev) => ({
      ...prev,
      [classUid]: true,
    }))

    try {
      const response = await performAuthenticatedRequest(`${webServer}/api/v1/classes/${classUid}`, {
        method: 'DELETE',
      })

      if (!response) {
        showMessage({
          message: 'Delete failed',
          description: 'Please sign in again to delete classes.',
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
        setClasses((prev) => prev.filter((classItem) => classItem.uid !== classUid))
        showMessage({
          message: 'Class deleted',
          description: responseBody?.message || 'The class was deleted successfully.',
          type: 'success',
        })
        return
      }

      if (response.status === 409) {
        const backendMessage = responseBody?.message || 'This class cannot be deleted.'
        const message = backendMessage.toLowerCase().includes('deactivate')
          ? backendMessage
          : `${backendMessage} Deactivate the class instead.`

        showMessage({
          message: 'Delete not allowed',
          description: message,
          type: 'danger',
        })
        return
      }

      if (response.status === 401 || response.status === 403) {
        const message = responseBody?.message || 'Your session expired. Please sign in again.'
        setErrorMessage(message)
        showMessage({
          message: 'Delete failed',
          description: message,
          type: 'danger',
        })
        return
      }

      const message = responseBody?.message || 'Unable to delete class.'
      showMessage({
        message: 'Delete failed',
        description: message,
        type: 'danger',
      })
    } catch {
      showMessage({
        message: 'Delete failed',
        description: 'Unable to delete class.',
        type: 'danger',
      })
    } finally {
      setDeletingClassUids((prev) => {
        const next = { ...prev }
        delete next[classUid]
        return next
      })
    }
  }

  const confirmDeleteClass = (classItem: ManagedClass) => {
    Alert.alert(
      'Delete Class',
      'Are you sure you want to delete this class? Classes with sessions or bookings cannot be deleted and should be deactivated instead.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void deleteClass(classItem.uid)
          },
        },
      ]
    )
  }

  if (!isOwner) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.navs}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Feather name="arrow-left" color={AppColors.blue} size={36} />
          </TouchableOpacity>
          <Text style={styles.title}>Class Management</Text>
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
        <Text style={styles.title}>Class Management</Text>
        <View style={styles.spacer} />
      </View>

      <View style={styles.actionsBar}>
        <TouchableOpacity style={styles.addButton} onPress={handleAddClass}>
          <Feather name="plus" color={AppColors.white} size={18} />
          <Text style={styles.addButtonText}>Add Class</Text>
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
            <Text style={styles.stateText}>Loading classes...</Text>
          </View>
        ) : errorMessage ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Unable to load classes</Text>
            <Text style={styles.errorText}>{errorMessage}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => loadClasses()}>
              <Text style={styles.retryBtnText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : classes.length === 0 ? (
          <View style={styles.centerState}>
            <Text style={styles.emptyTitle}>No classes yet</Text>
            <Text style={styles.stateText}>Create a class in the backend to see it here.</Text>
          </View>
        ) : (
          <>
            <View style={styles.filterBar}>
              <TouchableOpacity
                style={[styles.filterButton, activeTab === 'active' && styles.filterButtonActive]}
                onPress={() => setActiveTab('active')}
              >
                <Text style={[styles.filterButtonText, activeTab === 'active' && styles.filterButtonTextActive]}>
                  Active ({activeClasses.length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterButton, activeTab === 'inactive' && styles.filterButtonActive]}
                onPress={() => setActiveTab('inactive')}
              >
                <Text style={[styles.filterButtonText, activeTab === 'inactive' && styles.filterButtonTextActive]}>
                  Inactive ({inactiveClasses.length})
                </Text>
              </TouchableOpacity>
            </View>

            {visibleClasses.length > 0 ? (
              <View style={styles.list}>
                <Text style={styles.sectionTitle}>{activeClassesLabel} classes</Text>
                {visibleClasses.map((classItem) => {
                  const classUid = Number(classItem?.uid ?? 0)
                  const duration = Number(classItem?.duration_minutes ?? 0)
                  const capacity = Number(classItem?.capacity ?? 0)
                  const priceLabel = renderPrice(classItem)
                  const status = String(classItem?.status ?? '').trim().toLowerCase()
                  const isDeleting = deletingClassUids[classUid] === true

                  return (
                    <View key={classUid || `${classItem?.name}-${classItem?.created_at}`} style={styles.card}>
                      <View style={styles.cardHeader}>
                        <View style={styles.cardHeaderText}>
                          <Text style={styles.cardTitle}>{classItem?.name || 'Untitled class'}</Text>
                          <Text style={styles.cardSubtitle}>{priceLabel}</Text>
                        </View>
                        <View style={[styles.statusPill, status === 'active' ? styles.statusActive : styles.statusInactive]}>
                          <Text style={styles.statusText}>{renderStatusLabel(status)}</Text>
                        </View>
                      </View>

                      {classItem?.description ? (
                        <Text style={styles.description} numberOfLines={3}>
                          {classItem.description}
                        </Text>
                      ) : null}

                      <View style={styles.metaRow}>
                        <View style={styles.metaItem}>
                          <Text style={styles.metaLabel}>Duration</Text>
                          <Text style={styles.metaValue}>{duration > 0 ? `${duration} min` : '—'}</Text>
                        </View>
                        <View style={styles.metaItem}>
                          <Text style={styles.metaLabel}>Capacity</Text>
                          <Text style={styles.metaValue}>{capacity > 0 ? capacity : '—'}</Text>
                        </View>
                        <View style={styles.metaItem}>
                          <Text style={styles.metaLabel}>Created</Text>
                          <Text style={styles.metaValue}>{formatCreatedAt(classItem?.created_at)}</Text>
                        </View>
                      </View>

                      <View style={styles.cardActions}>
                        <TouchableOpacity style={styles.editButton} onPress={() => handleEditClass(classUid)}>
                          <Feather name="edit-2" color={AppColors.blue} size={16} />
                          <Text style={styles.editButtonText}>Edit</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.deleteButton, isDeleting ? styles.deleteButtonDisabled : null]}
                          onPress={() => confirmDeleteClass(classItem)}
                          disabled={isDeleting}
                        >
                          {isDeleting ? (
                            <ActivityIndicator size="small" color={AppColors.white} />
                          ) : (
                            <Feather name="trash-2" color={AppColors.white} size={16} />
                          )}
                          <Text style={styles.deleteButtonText}>Delete</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )
                })}
              </View>
            ) : (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>{activeClassesLabel} classes</Text>
                <Text style={styles.stateText}>
                  {activeTab === 'active'
                    ? 'No active classes right now. Activate a class to show it here.'
                    : 'No inactive classes right now.'}
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

export default ClassManagementScreen

const styles = StyleSheet.create({
  container: {
    backgroundColor: AppColors.grey,
    flex: 1,
  },
  navs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 24,
    paddingRight: 24,
    paddingTop: 8,
    paddingBottom: 8,
  },
  backBtn: {
    width: 36,
  },
  spacer: {
    width: 36,
  },
  title: {
    color: AppColors.blue,
    fontFamily: 'Montserrat',
    fontSize: 28,
    textAlign: 'center',
  },
  actionsBar: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 4,
  },
  addButton: {
    backgroundColor: AppColors.blue,
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
  },
  addButtonText: {
    color: AppColors.white,
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  centerState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    color: AppColors.blue,
    fontFamily: 'Montserrat',
    fontSize: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  stateText: {
    color: AppColors.grey3,
    fontSize: 14,
    textAlign: 'center',
  },
  errorCard: {
    borderWidth: 1,
    borderColor: AppColors.grey,
    borderRadius: 18,
    padding: 20,
    backgroundColor: AppColors.white,
    marginTop: 24,
  },
  errorTitle: {
    color: AppColors.blue,
    fontSize: 18,
    fontFamily: 'Montserrat',
    marginBottom: 8,
  },
  errorText: {
    color: AppColors.grey3,
    fontSize: 14,
    marginBottom: 16,
  },
  emptyCard: {
    borderWidth: 1,
    borderColor: AppColors.grey,
    borderRadius: 18,
    padding: 20,
    backgroundColor: AppColors.white,
    marginTop: 16,
  },
  retryBtn: {
    backgroundColor: AppColors.blue,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
  },
  retryBtnText: {
    color: AppColors.white,
  },
  list: {
    marginTop: 16,
    gap: 16,
  },
  filterBar: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 6,
  },
  filterButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: AppColors.grey,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: AppColors.white,
  },
  filterButtonActive: {
    backgroundColor: AppColors.blue,
    borderColor: AppColors.blue,
  },
  filterButtonText: {
    color: AppColors.primary,
    fontSize: 14,
  },
  filterButtonTextActive: {
    color: AppColors.white,
  },
  sectionTitle: {
    color: AppColors.blue,
    fontFamily: 'Montserrat',
    fontSize: 18,
    marginBottom: 4,
  },
  card: {
    borderWidth: 1,
    borderColor: AppColors.grey,
    borderRadius: 18,
    padding: 18,
    backgroundColor: AppColors.white,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    color: AppColors.blue,
    fontSize: 20,
    fontFamily: 'Montserrat',
    marginBottom: 4,
  },
  cardSubtitle: {
    color: AppColors.grey3,
    fontSize: 14,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  statusActive: {
    backgroundColor: AppColors.blue,
  },
  statusInactive: {
    backgroundColor: AppColors.grey3,
  },
  statusText: {
    fontSize: 12,
    color: AppColors.white,
  },
  description: {
    color: AppColors.primary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 12,
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
    height: 50
  },
  editButtonText: {
    color: AppColors.blue,
    fontSize: 15,
  },
  deleteButton: {
    flex: 1,
    backgroundColor: AppColors.red,
    borderRadius: 999,
    paddingVertical: 11,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  deleteButtonDisabled: {
    opacity: 0.7,
  },
  deleteButtonText: {
    color: AppColors.white,
    fontSize: 15,
  },
})