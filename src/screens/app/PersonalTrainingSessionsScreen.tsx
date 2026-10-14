import { useCallback, useContext, useState } from 'react'
import {
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
import { showMessage } from 'react-native-flash-message'
import { Feather } from '@expo/vector-icons'
import { AppColors } from '../../styles/colors'
import { UserContext } from '../../context/UserContext'
import { getMemberPersonalTrainingTitle } from '../../components/utils/personalTrainingDisplay'

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
  if (!trimmed) return []

  try {
    const parsed = JSON.parse(trimmed) as unknown
    if (typeof parsed === 'string') return [parsed]
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
      if (candidates.length > 0) return candidates
    }
  } catch {
    // Fall through to the raw text below.
  }

  return [trimmed]
}

const shouldRefreshAuthResponse = async (response: Response): Promise<boolean> => {
  if (!response || response.ok) return false
  if (response.status === 401) return true
  if (response.status !== 400 && response.status !== 403) return false
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
    gym_id?: number | string
  } | null
  tokens?: RefreshTokens | null
  setTokens: (value: RefreshTokens | null | ((prev: RefreshTokens | null) => RefreshTokens | null)) => void
  webServer: string
}

type PersonalTrainingSessionSummary = {
  session_uid?: number
  uid?: number
  trainer_gym_user_id?: number | null
  trainer_display_name?: string | null
  price?: number | string | null
  currency_code?: string | null
  start_at?: string | null
  end_at?: string | null
  location?: string | null
  additional_notes?: string | null
  status?: string | null
  is_available?: boolean
  booked_count?: number
}

type PersonalTrainingSessionsNavigation = {
  goBack: () => void
  navigate: (
    screen: 'PersonalTrainingSessionScreen',
    params: {
      sessionUid?: number | string
      session?: PersonalTrainingSessionSummary
    }
  ) => void
}

const parseDate = (value?: string | null) => {
  if (!value) return null
  const normalized = String(value).includes('T') ? String(value) : String(value).replace(' ', 'T')
  const date = new Date(normalized)
  return Number.isNaN(date.getTime()) ? null : date
}

const formatDate = (value?: string | null) => {
  const date = parseDate(value)
  if (!date) return 'Unknown date'
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

const formatTime = (value?: string | null) => {
  const date = parseDate(value)
  if (!date) return 'Unknown time'
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

const isPersonalTrainingSessionSummary = (value: unknown): value is PersonalTrainingSessionSummary => {
  return typeof value === 'object' && value !== null
}

const PersonalTrainingSessionsScreen = ({ navigation }: { navigation: PersonalTrainingSessionsNavigation }) => {
  const { user, tokens, setTokens, webServer } = useContext(UserContext) as UserContextValue
  const [sessions, setSessions] = useState<PersonalTrainingSessionSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming')

  const performAuthenticatedRequest = async (endpoint: string, init = {} as RequestInit) => {
    return performAuthenticatedRequestWithRefresh({
      endpoint,
      init,
      accessToken: tokens?.access_token ?? null,
      refreshToken: tokens?.refresh_token ?? null,
      webServer,
      setTokens,
    })
  }

  const loadSessions = useCallback(async ({ isRefresh = false } = {}) => {
    if (!user?.gym_id || !tokens?.access_token) {
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

    try {
      const response = await performAuthenticatedRequest(`${webServer}/api/v1/personal-training/sessions`)
      if (!response) {
        setErrorMessage('Your session expired. Please sign in again.')
        setSessions([])
        return
      }

      const responseText = await response.text()
      let responseBody: { data?: unknown; message?: string } = {}
      if (responseText) {
        try {
          responseBody = JSON.parse(responseText) as { data?: unknown; message?: string }
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

      setSessions(
        Array.isArray(responseBody?.data)
          ? responseBody.data.filter(isPersonalTrainingSessionSummary)
          : []
      )
    } catch (error) {
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
  }, [tokens?.access_token, tokens?.refresh_token, setTokens, user?.gym_id, webServer])

  useFocusEffect(
    useCallback(() => {
      void loadSessions()
    }, [loadSessions])
  )

  const onRefresh = () => {
    void loadSessions({ isRefresh: true })
  }

  const openSession = (session: PersonalTrainingSessionSummary) => {
    navigation.navigate('PersonalTrainingSessionScreen', {
      sessionUid: session?.session_uid,
      session,
    })
  }

  const renderPrice = (session: PersonalTrainingSessionSummary) => {
    const price = Number(session?.price ?? 0)
    if (price <= 0) {
      return 'Free'
    }
    const currency = String(session?.currency_code ?? '').trim().toUpperCase()
    return `${price.toFixed(2)} ${currency}`.trim()
  }

  const renderNotesPreview = (session: PersonalTrainingSessionSummary) => {
    const notes = String(session?.additional_notes ?? '').trim()
    if (!notes) return null
    return notes.length > 80 ? `${notes.slice(0, 77)}...` : notes
  }

  const isUpcoming = (session: PersonalTrainingSessionSummary) => {
    const sessionDate = parseDate(session?.start_at)
    if (!sessionDate) return false
    return sessionDate.getTime() > Date.now()
  }

  const upcomingSessions = sessions.filter(isUpcoming)
  const pastSessions = sessions.filter((session) => !isUpcoming(session))
  const visibleSessions = activeTab === 'upcoming' ? upcomingSessions : pastSessions
  const activeSessionsLabel = activeTab === 'upcoming' ? 'Upcoming' : 'Past'

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.navs}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" color={AppColors.blue} size={36} />
        </TouchableOpacity>
        <Text style={styles.title}>Personal Training</Text>
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
            <Text style={styles.stateText}>Loading personal training sessions...</Text>
          </View>
        ) : errorMessage ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Unable to load personal training</Text>
            <Text style={styles.errorText}>{errorMessage}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => loadSessions()}>
              <Text style={styles.retryBtnText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : sessions.length === 0 ? (
          <View style={styles.centerState}>
            <Text style={styles.emptyTitle}>No upcoming personal training sessions</Text>
            <Text style={styles.stateText}>Check back later for new sessions.</Text>
          </View>
        ) : (
          <>
            <View style={styles.filterBar}>
              <TouchableOpacity
                style={[styles.filterButton, activeTab === 'upcoming' && styles.filterButtonActive]}
                onPress={() => setActiveTab('upcoming')}
              >
                <Text style={[styles.filterButtonText, activeTab === 'upcoming' && styles.filterButtonTextActive]}>
                  Upcoming ({upcomingSessions.length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterButton, activeTab === 'past' && styles.filterButtonActive]}
                onPress={() => setActiveTab('past')}
              >
                <Text style={[styles.filterButtonText, activeTab === 'past' && styles.filterButtonTextActive]}>
                  Past ({pastSessions.length})
                </Text>
              </TouchableOpacity>
            </View>

            {visibleSessions.length > 0 ? (
              <View style={styles.list}>
                <Text style={styles.sectionTitle}>{activeSessionsLabel} sessions</Text>
                {visibleSessions.map((session) => {
                  const price = Number(session?.price ?? 0)
                  const location = String(session?.location ?? '').trim()
                  const notesPreview = renderNotesPreview(session)
                  const status = String(session?.status ?? 'scheduled').toLowerCase()
                  const trainerName = String(session?.trainer_display_name ?? '').trim()
                  const isUnavailable = session?.is_available === false
                  const unavailableLabel = Number(session?.booked_count ?? 0) > 0 ? 'Booked' : 'Unavailable'

                  return (
                    <TouchableOpacity
                      key={String(session?.session_uid ?? session?.uid ?? `${session?.trainer_gym_user_id}-${session?.start_at}`)}
                      style={[styles.card, (status !== 'scheduled' || isUnavailable) && styles.cardPast]}
                      activeOpacity={0.85}
                      onPress={() => openSession(session)}
                    >
                      <View style={styles.cardHeader}>
                        <View style={styles.cardHeaderText}>
                          <Text style={styles.cardTitle}>{getMemberPersonalTrainingTitle(trainerName)}</Text>
                          <Text style={styles.pricePill}>{renderPrice(session)}</Text>
                        </View>
                        <View style={[styles.badge, isUnavailable ? styles.badgeUnavailable : price <= 0 ? styles.badgeFree : styles.badgePaid]}>
                          <Text style={styles.badgeText}>{isUnavailable ? unavailableLabel : 'Available'}</Text>
                        </View>
                      </View>

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
                        <View style={styles.metaItem}>
                          <Text style={styles.metaLabel}>Status</Text>
                          <Text style={styles.metaValue}>{status.charAt(0).toUpperCase() + status.slice(1)}</Text>
                        </View>
                      </View>

                      {location ? (
                        <View style={styles.locationRow}>
                          <Text style={styles.metaLabel}>Location</Text>
                          <Text style={styles.metaValue} numberOfLines={2}>
                            {location}
                          </Text>
                        </View>
                      ) : null}

                      {notesPreview ? (
                        <View style={styles.notesRow}>
                          <Text style={styles.metaLabel}>Notes</Text>
                          <Text style={styles.notesText} numberOfLines={2}>
                            {notesPreview}
                          </Text>
                        </View>
                      ) : null}
                    </TouchableOpacity>
                  )
                })}
              </View>
            ) : (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>{activeSessionsLabel} sessions</Text>
                <Text style={styles.stateText}>
                  {activeTab === 'upcoming'
                    ? 'No upcoming personal training sessions right now. Check back for new sessions.'
                    : 'You do not have any past personal training sessions yet.'}
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

export default PersonalTrainingSessionsScreen

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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  filterBar: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 6,
  },
  filterButton: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: AppColors.grey,
    backgroundColor: AppColors.white,
    paddingVertical: 12,
    alignItems: 'center',
  },
  filterButtonActive: {
    borderColor: AppColors.blue,
    backgroundColor: AppColors.blue,
  },
  filterButtonText: {
    color: AppColors.primary,
    fontSize: 14,
  },
  filterButtonTextActive: {
    color: AppColors.white,
  },
  list: {
    marginTop: 16,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 20,
    color: AppColors.blue,
    marginBottom: 14,
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
    color: AppColors.blue,
    textAlign: 'center',
    fontFamily: 'Montserrat',
  },
  emptyCard: {
    backgroundColor: AppColors.white,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: AppColors.grey,
    marginTop: 12,
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
    fontSize: 14,
    fontFamily: 'Montserrat',
  },
  card: {
    backgroundColor: AppColors.white,
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    borderColor: AppColors.grey,
    borderWidth: 1,
  },
  cardPast: {
    opacity: 0.7,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    color: AppColors.blue,
    marginBottom: 4,
    fontFamily: 'Montserrat',
  },
  pricePill: {
    fontSize: 13,
    color: AppColors.white,
    backgroundColor: AppColors.blue,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    alignSelf: 'flex-start',
    fontFamily: 'Montserrat',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeFree: {
    backgroundColor: '#38a169',
  },
  badgePaid: {
    backgroundColor: AppColors.blue,
  },
  badgeUnavailable: {
    backgroundColor: AppColors.grey3,
  },
  badgeText: {
    color: AppColors.white,
    fontSize: 12,
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
    textTransform: 'uppercase',
    fontFamily: 'Montserrat',
  },
  metaValue: {
    fontSize: 12,
    color: AppColors.blue,
    textAlign: 'right',
    flexShrink: 1,
    fontFamily: 'Montserrat',
  },
  locationRow: {
    marginTop: 8,
  },
  notesRow: {
    marginTop: 8,
  },
  notesText: {
    marginTop: 4,
    fontSize: 12,
    color: AppColors.primary,
    fontFamily: 'Montserrat',
  },
})