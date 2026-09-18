import { useCallback, useContext, useState } from 'react'
import {
  Alert,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import { Feather } from '@expo/vector-icons'
import { showMessage } from 'react-native-flash-message'
import { AppColors } from '../../styles/colors'
import { UserContext } from '../../context/UserContext'

type RefreshTokens = {
  access_token?: string
  refresh_token?: string
}

type SessionStatus = 'scheduled' | 'cancelled' | 'completed' | string

type ManagedPersonalTrainingSession = {
  uid?: number
  session_uid?: number
  gym_id?: number
  trainer_gym_user_id?: number | null
  trainer_display_name?: string | null
  location?: string | null
  additional_notes?: string | null
  start_at?: string | null
  end_at?: string | null
  price?: number | string | null
  currency_code?: string | null
  status?: SessionStatus
  created_at?: string | null
  updated_at?: string | null
}

type UserContextValue = {
  user?: {
    role?: string | null
  } | null
  tokens?: RefreshTokens | null
  setTokens: (value: RefreshTokens | null | ((prev: RefreshTokens | null) => RefreshTokens | null)) => void
  webServer: string
}

type PersonalTrainingManagementNavigation = {
  goBack: () => void
  navigate: (
    screen: 'AddPersonalTrainingSessionScreen' | 'EditPersonalTrainingSessionScreen',
    params?: { sessionUid?: number }
  ) => void
}

type LoadOptions = {
  isRefresh?: boolean
}

const parseDate = (value?: string | null) => {
  if (!value) {
    return null
  }

  const normalized = String(value).includes('T') ? String(value) : String(value).replace(' ', 'T')
  const date = new Date(normalized)
  return Number.isNaN(date.getTime()) ? null : date
}

const formatDate = (value?: string | null) => {
  const date = parseDate(value)
  if (!date) {
    return 'Unknown date'
  }

  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

const formatTime = (value?: string | null) => {
  const date = parseDate(value)
  if (!date) {
    return 'Unknown time'
  }

  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

const renderStatusLabel = (status?: SessionStatus) => {
  const normalized = String(status ?? 'scheduled').trim().toLowerCase()
  if (!normalized) {
    return 'Unknown'
  }

  return normalized.charAt(0).toUpperCase() + normalized.slice(1)
}

const PersonalTrainingManagementScreen = ({ navigation }: { navigation: PersonalTrainingManagementNavigation }) => {
  const { user, tokens, setTokens, webServer } = useContext(UserContext) as UserContextValue
  const [sessions, setSessions] = useState<ManagedPersonalTrainingSession[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [deletingSessionUid, setDeletingSessionUid] = useState<number | null>(null)

  const isOwner = String(user?.role ?? '').trim().toLowerCase() === 'owner'

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

  const performAuthenticatedRequest = async (endpoint: string, init: RequestInit = {}): Promise<Response | null> => {
    if (!tokens?.access_token) {
      return null
    }

    const requestWithToken = async (accessToken: string) => {
      return fetch(endpoint, {
        ...init,
        headers: {
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

  const loadSessions = useCallback(
    async ({ isRefresh = false }: LoadOptions = {}) => {
      if (!tokens?.access_token) {
        setErrorMessage('Please sign in again to view personal training sessions.')
        setSessions([])
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

      const endpoint = `${webServer}/api/v1/personal-training/management/sessions`

      try {
        const response = await performAuthenticatedRequest(endpoint)
        if (!response) {
          setErrorMessage('Please sign in again to view personal training sessions.')
          setSessions([])
          return
        }

        const responseText = await response.text()
        let responseBody: { message?: string; data?: ManagedPersonalTrainingSession[] } = {}
        if (responseText) {
          try {
            responseBody = JSON.parse(responseText)
          } catch {
            responseBody = { message: responseText }
          }
        }

        if (response.status !== 200) {
          const message = responseBody?.message || 'Unable to load personal training sessions.'
          setErrorMessage(message)
          setSessions([])
          showMessage({
            message: 'Personal training unavailable',
            description: message,
            type: 'danger',
          })
          return
        }

        setSessions(Array.isArray(responseBody?.data) ? responseBody.data : [])
      } catch {
        const message = 'Failed to load personal training sessions.'
        setErrorMessage(message)
        setSessions([])
        showMessage({
          message: 'Personal training unavailable',
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
      void loadSessions()
    }, [loadSessions])
  )

  const onRefresh = () => {
    void loadSessions({ isRefresh: true })
  }

  const deleteSession = useCallback(
    async (sessionUid: number) => {
      if (!sessionUid || deletingSessionUid !== null) {
        return
      }

      setDeletingSessionUid(sessionUid)

      try {
        const response = await performAuthenticatedRequest(
          `${webServer}/api/v1/personal-training/sessions/${sessionUid}`,
          {
            method: 'DELETE',
          }
        )

        if (!response) {
          const message = 'Please sign in again to delete personal training sessions.'
          showMessage({
            message: 'Delete failed',
            description: message,
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
            message: 'Personal training session deleted',
            description: responseBody?.message || 'The personal training session was deleted successfully.',
            type: 'success',
          })
          await loadSessions()
          return
        }

        const message =
          responseBody?.message ||
          'Unable to delete personal training session.'

        if (response.status === 409) {
          showMessage({
            message: 'Delete blocked',
            description: message,
            type: 'danger',
          })
          return
        }

        if (response.status === 401) {
          showMessage({
            message: 'Authentication required',
            description: 'Please sign in again to delete personal training sessions.',
            type: 'danger',
          })
          return
        }

        if (response.status === 403) {
          showMessage({
            message: 'Permission denied',
            description: message,
            type: 'danger',
          })
          return
        }

        showMessage({
          message: 'Delete failed',
          description: message,
          type: 'danger',
        })
      } catch {
        showMessage({
          message: 'Delete failed',
          description: 'Unable to delete personal training session.',
          type: 'danger',
        })
      } finally {
        setDeletingSessionUid((current) => (current === sessionUid ? null : current))
      }
    },
    [deletingSessionUid, loadSessions, performAuthenticatedRequest, webServer]
  )

  const confirmDeleteSession = (sessionUid: number, sessionLabel: string) => {
    if (!sessionUid || deletingSessionUid !== null) {
      return
    }

    Alert.alert(
      'Delete personal training session?',
      `This will permanently delete ${sessionLabel}. This cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void deleteSession(sessionUid)
          },
        },
      ],
      { cancelable: true }
    )
  }

  const renderPrice = (session: ManagedPersonalTrainingSession) => {
    const price = Number(session?.price ?? 0)
    if (price <= 0) {
      return 'Free'
    }

    const currency = String(session?.currency_code ?? '').trim().toUpperCase()
    return `${price.toFixed(2)} ${currency}`.trim()
  }

  const sessionCount = sessions.length

  if (!isOwner) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.navs}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Feather name="arrow-left" color={AppColors.blue} size={36} />
          </TouchableOpacity>
          <Text style={styles.title}>Personal Training</Text>
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
        <Text style={styles.title}>Personal Training</Text>
        <View style={styles.spacer} />
      </View>

      <View style={styles.actionsBar}>
        <TouchableOpacity
          style={styles.addButton}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('AddPersonalTrainingSessionScreen')}
        >
          <Feather name="plus" color={AppColors.white} size={18} />
          <Text style={styles.addButtonText}>Add Session</Text>
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
            <Text style={styles.stateText}>Loading personal training sessions...</Text>
          </View>
        ) : errorMessage ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Unable to load personal training sessions</Text>
            <Text style={styles.errorText}>{errorMessage}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => loadSessions()}>
              <Text style={styles.retryBtnText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : sessionCount === 0 ? (
          <View style={styles.centerState}>
            <Text style={styles.emptyTitle}>No personal training sessions yet</Text>
            <Text style={styles.stateText}>Use the backend to create sessions and they will appear here.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {sessions.map((session, index) => {
              const sessionUid = Number(session?.uid ?? session?.session_uid ?? 0)
              const priceLabel = renderPrice(session)
              const status = String(session?.status ?? 'scheduled').trim().toLowerCase()
              const location = String(session?.location ?? '').trim()
              const notes = String(session?.additional_notes ?? '').trim()
              const trainerDisplayName = String(session?.trainer_display_name ?? '').trim()
              const deleting = deletingSessionUid === sessionUid
              const statusStyle =
                status === 'cancelled'
                  ? styles.statusCancelled
                  : status === 'completed'
                    ? styles.statusCompleted
                    : styles.statusScheduled

              return (
                <View
                  key={sessionUid || `${session?.trainer_gym_user_id ?? 'trainer'}-${session?.start_at ?? index}`}
                  style={styles.card}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderText}>
                      <Text style={styles.cardTitle}>Personal Training Session</Text>
                      <Text style={styles.cardSubtitle}>{priceLabel}</Text>
                    </View>
                    <View style={[styles.statusPill, statusStyle]}>
                      <Text style={styles.statusText}>{renderStatusLabel(status)}</Text>
                    </View>
                  </View>

                  <Text style={styles.trainerName}>
                    {trainerDisplayName ? `with ${trainerDisplayName}` : 'with TBA'}
                  </Text>

                  <View style={styles.metaGrid}>
                    <View style={styles.metaItem}>
                      <Text style={styles.metaLabel}>Date</Text>
                      <Text style={styles.metaValue}>{formatDate(session?.start_at)}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Text style={styles.metaLabel}>Time</Text>
                      <Text style={styles.metaValue}>
                        {formatTime(session?.start_at)} - {formatTime(session?.end_at)}
                      </Text>
                    </View>
                  </View>

                  {location ? (
                    <View style={styles.detailSection}>
                      <Text style={styles.metaLabel}>Location</Text>
                      <Text style={styles.detailValue}>{location}</Text>
                    </View>
                  ) : null}

                  {notes ? (
                    <View style={styles.detailSection}>
                      <Text style={styles.metaLabel}>Additional Notes</Text>
                      <Text style={styles.detailValue}>{notes}</Text>
                    </View>
                  ) : null}

                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={styles.editButton}
                      activeOpacity={0.85}
                      onPress={() => navigation.navigate('EditPersonalTrainingSessionScreen', { sessionUid })}
                      disabled={!sessionUid || deleting}
                    >
                      <Feather name="edit-2" color={AppColors.blue} size={16} />
                      <Text style={styles.editButtonText}>Edit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.deleteButton, deleting ? styles.deleteButtonDisabled : null]}
                      activeOpacity={0.85}
                      onPress={() => confirmDeleteSession(sessionUid, `${trainerDisplayName || 'this personal training session'}`)}
                      disabled={!sessionUid || deleting}
                    >
                      {deleting ? (
                        <ActivityIndicator size="small" color={AppColors.white} />
                      ) : (
                        <Feather name="trash-2" color={AppColors.white} size={16} />
                      )}
                      <Text style={styles.deleteButtonText}>{deleting ? 'Deleting...' : 'Delete'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

export default PersonalTrainingManagementScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.grey,
  },
  navs: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: AppColors.white,
    borderBottomColor: AppColors.grey,
    borderBottomWidth: 1,
  },
  backBtn: {
    paddingRight: 8,
  },
  spacer: {
    width: 36,
  },
  title: {
    color: AppColors.blue,
    fontFamily: 'Montserrat',
    fontSize: 28,
  },
  actionsBar: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: AppColors.blue,
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 14,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
    opacity: 0.92,
  },
  addButtonText: {
    color: AppColors.white,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Montserrat',
  },
  cardActions: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 10,
    flexWrap: 'wrap',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderColor: AppColors.blue,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: AppColors.white,
  },
  editButtonText: {
    color: AppColors.blue,
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Montserrat',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderColor: AppColors.red,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: AppColors.red,
  },
  deleteButtonDisabled: {
    opacity: 0.75,
  },
  deleteButtonText: {
    color: AppColors.white,
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Montserrat',
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
  },
  stateText: {
    marginTop: 12,
    fontSize: 16,
    color: AppColors.grey3,
    textAlign: 'center',
    fontFamily: 'Montserrat',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: AppColors.blue,
    textAlign: 'center',
    fontFamily: 'Montserrat',
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
    fontWeight: '600',
    color: AppColors.blue,
    marginBottom: 8,
    fontFamily: 'Montserrat',
  },
  errorText: {
    fontSize: 14,
    color: AppColors.grey3,
    marginBottom: 12,
    fontFamily: 'Montserrat',
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
    fontWeight: '600',
    fontSize: 14,
    fontFamily: 'Montserrat',
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
    marginBottom: 8,
    gap: 12,
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: AppColors.blue,
    marginBottom: 4,
    fontFamily: 'Montserrat',
  },
  cardSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.white,
    backgroundColor: AppColors.blue,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    alignSelf: 'flex-start',
    fontFamily: 'Montserrat',
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusScheduled: {
    backgroundColor: AppColors.blue,
  },
  statusCancelled: {
    backgroundColor: AppColors.red,
  },
  statusCompleted: {
    backgroundColor: AppColors.grey3,
  },
  statusText: {
    color: AppColors.white,
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Montserrat',
  },
  trainerName: {
    fontSize: 14,
    color: AppColors.grey3,
    marginBottom: 8,
    fontStyle: 'italic',
    fontFamily: 'Montserrat',
  },
  metaGrid: {
    marginTop: 8,
  },
  metaItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 12,
  },
  metaLabel: {
    fontSize: 12,
    color: AppColors.grey3,
    fontWeight: '600',
    textTransform: 'uppercase',
    fontFamily: 'Montserrat',
  },
  metaValue: {
    fontSize: 12,
    color: AppColors.blue,
    fontWeight: '600',
    textAlign: 'right',
    flexShrink: 1,
    fontFamily: 'Montserrat',
  },
  detailSection: {
    marginTop: 8,
  },
  detailValue: {
    marginTop: 4,
    fontSize: 12,
    color: AppColors.primary,
    fontFamily: 'Montserrat',
  },
})
