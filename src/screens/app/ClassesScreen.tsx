// @ts-nocheck
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
import { AppColors } from '../../styles/colors'
import { UserContext } from '../../context/UserContext'
import { Feather } from '@expo/vector-icons'
import { performAuthenticatedRequest as performAuthenticatedRequestWithRefresh } from '../../utils/authenticatedRequest'

const ClassesScreen = ({ navigation }) => {
  const { user, tokens, setTokens, webServer } = useContext(UserContext)
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming')

  const performAuthenticatedRequest = async (endpoint: string, init: RequestInit = {}) => {
    return performAuthenticatedRequestWithRefresh({
      endpoint,
      init,
      accessToken: tokens?.access_token ?? null,
      refreshToken: tokens?.refresh_token ?? null,
      webServer,
      setTokens,
    })
  }

  const requestJson = async (endpoint: string) => {
    const response = await performAuthenticatedRequest(endpoint)
    if (!response) {
      return { ok: false, expired: true, body: {} }
    }

    const responseText = await response.text()
    let responseBody: any = {}
    if (responseText) {
      try {
        responseBody = JSON.parse(responseText)
      } catch {
        responseBody = { message: responseText }
      }
    }

    return { ok: response.status === 200, expired: false, body: responseBody }
  }

  const loadSessions = useCallback(async ({ isRefresh = false } = {}) => {
    if (!user?.gym_id || !tokens?.access_token) {
      setErrorMessage('Please sign in again to view classes.')
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
      // The gym-wide sessions endpoint only returns future sessions, so past sessions are
      // collected per class through the member-accessible class session endpoints.
      const classesResult = await requestJson(`${webServer}/api/v1/classes`)

      if (classesResult.expired) {
        setErrorMessage('Your session expired. Please sign in again.')
        setSessions([])
        return
      }

      if (!classesResult.ok) {
        const upcomingResult = await requestJson(`${webServer}/api/v1/classes/sessions`)

        if (upcomingResult.expired) {
          setErrorMessage('Your session expired. Please sign in again.')
          setSessions([])
          return
        }

        if (!upcomingResult.ok) {
          const message = classesResult.body?.message || upcomingResult.body?.message || 'Unable to load classes.'
          setErrorMessage(message)
          setSessions([])
          showMessage({
            message: 'Classes unavailable',
            description: message,
            type: 'danger',
          })
          return
        }

        setSessions(Array.isArray(upcomingResult.body?.data) ? upcomingResult.body.data : [])
        return
      }

      const classList = Array.isArray(classesResult.body?.data) ? classesResult.body.data : []
      const sessionGroups = await Promise.all(
        classList.map(async (gymClass) => {
          const classUid = gymClass?.uid ?? gymClass?.class_uid
          if (!classUid) return []

          const sessionsResult = await requestJson(`${webServer}/api/v1/classes/${classUid}/sessions`)
          if (!sessionsResult.ok) return []

          return Array.isArray(sessionsResult.body?.data) ? sessionsResult.body.data : []
        })
      )

      const uniqueSessions = new Map()
      sessionGroups.flat().forEach((session) => {
        const key = String(session?.session_uid ?? session?.uid ?? `${session?.class_uid}-${session?.start_at}`)
        if (!uniqueSessions.has(key)) {
          uniqueSessions.set(key, session)
        }
      })

      setSessions(Array.from(uniqueSessions.values()))
    } catch (error) {
      const message = 'Failed to load class sessions.'
      setErrorMessage(message)
      setSessions([])
      showMessage({
        message: 'Classes unavailable',
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

  const formatDate = (value) => {
    const date = parseDate(value)
    if (!date) return 'Unknown date'
    return new Intl.DateTimeFormat(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date)
  }

  const formatTime = (value) => {
    const date = parseDate(value)
    if (!date) return 'Unknown time'
    return new Intl.DateTimeFormat(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    }).format(date)
  }

  const parseDate = (value) => {
    if (!value) return null
    const normalized = String(value).includes('T') ? String(value) : String(value).replace(' ', 'T')
    const date = new Date(normalized)
    return Number.isNaN(date.getTime()) ? null : date
  }

  const openSession = (session) => {
    navigation.navigate('ClassSessionScreen', { session })
  }

  const renderPrice = (session) => {
    const price = Number(session?.price ?? 0)
    if (price <= 0) {
      return 'Free'
    }
    const currency = String(session?.currency_code ?? '').trim().toUpperCase()
    return `${price.toFixed(2)} ${currency}`.trim()
  }

  const isUpcoming = (session) => {
    const sessionDate = parseDate(session?.start_at)
    if (!sessionDate) return false
    return sessionDate.getTime() >= Date.now()
  }

  const sortByStart = (list, direction) => {
    return [...list].sort((a, b) => {
      const aTime = parseDate(a?.start_at)?.getTime() ?? 0
      const bTime = parseDate(b?.start_at)?.getTime() ?? 0
      return direction === 'asc' ? aTime - bTime : bTime - aTime
    })
  }

  const upcomingSessions = sortByStart(sessions.filter(isUpcoming), 'asc')
  const pastSessions = sortByStart(sessions.filter((session) => !isUpcoming(session)), 'desc')
  const visibleSessions = activeTab === 'upcoming' ? upcomingSessions : pastSessions

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.navs}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" color={AppColors.blue} size={36} />
        </TouchableOpacity>
        <Text style={styles.title}>Classes</Text>
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
            <Text style={styles.stateText}>Loading classes...</Text>
          </View>
        ) : errorMessage ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Unable to load classes</Text>
            <Text style={styles.errorText}>{errorMessage}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => loadSessions()}>
              <Text style={styles.retryBtnText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : sessions.length === 0 ? (
          <View style={styles.centerState}>
            <Text style={styles.emptyTitle}>No upcoming classes</Text>
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
              <>
                <Text style={styles.sectionTitle}>{activeTab === 'upcoming' ? 'Upcoming' : 'Past'} classes</Text>
                {visibleSessions.map((session) => {
                  const price = Number(session?.price ?? 0)
                  const capacity = Number(session?.capacity ?? 0)
                  const bookedCount = Number(session?.booked_count ?? 0)
                  const location = String(session?.location ?? '').trim()
                  const availableCapacity =
                    session?.available_capacity !== null && session?.available_capacity !== undefined
                      ? Number(session.available_capacity)
                      : Math.max(capacity - bookedCount, 0)

                  return (
                    <TouchableOpacity
                      key={String(session?.session_uid ?? session?.uid ?? `${session?.class_uid}-${session?.start_at}`)}
                      style={styles.card}
                      activeOpacity={0.85}
                      onPress={() => openSession(session)}
                    >
                      <View style={styles.cardHeader}>
                        <View style={styles.cardHeaderText}>
                          <Text style={styles.cardTitle}>{session?.class_name || 'Untitled class'}</Text>
                          <Text style={styles.pricePill}>
                            {price <= 0 ? 'Free' : `${price.toFixed(2)} ${String(session?.currency_code ?? '').toUpperCase()}`}
                          </Text>
                        </View>
                        <View style={[styles.badge, price <= 0 ? styles.badgeFree : styles.badgePaid]}>
                          <Text style={styles.badgeText}>{price <= 0 ? 'Free' : 'Paid'}</Text>
                        </View>
                      </View>

                      {session?.class_description ? (
                        <Text style={styles.description} numberOfLines={3}>
                          {session.class_description}
                        </Text>
                      ) : null}

                      {location ? (
                        <View style={styles.locationSection}>
                          <Text style={styles.metaLabel}>Location</Text>
                          <Text style={styles.metaValue}>{location}</Text>
                        </View>
                      ) : null}

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
                          <Text style={styles.metaLabel}>Trainer</Text>
                          <Text style={styles.metaValue}>{session?.trainer_display_name || 'TBA'}</Text>
                        </View>
                        <View style={styles.metaItem}>
                          <Text style={styles.metaLabel}>Capacity</Text>
                          <Text style={styles.metaValue}>
                            {availableCapacity}/{capacity || 0} available
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  )
                })}
              </>
            ) : (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>{activeTab === 'upcoming' ? 'No upcoming classes' : 'No past classes'}</Text>
                <Text style={styles.stateText}>
                  {activeTab === 'upcoming'
                    ? 'Check back later for new sessions.'
                    : 'You do not have any past class sessions yet.'}
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

export default ClassesScreen

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
    fontSize: 30,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 28,
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
  centerState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  stateText: {
    color: AppColors.grey3,
    fontFamily: 'Montserrat',
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
  },
  emptyTitle: {
    color: AppColors.blue,
    fontFamily: 'Montserrat',
    fontSize: 18,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorCard: {
    backgroundColor: AppColors.white,
    borderRadius: 18,
    padding: 18,
    marginTop: 12,
    borderWidth: 1,
    borderColor: AppColors.grey,
  },
  errorTitle: {
    color: AppColors.blue,
    fontFamily: 'Montserrat',
    fontSize: 18,
    marginBottom: 8,
  },
  errorText: {
    color: AppColors.grey3,
    fontFamily: 'Montserrat',
    fontSize: 14,
    lineHeight: 20,
  },
  retryBtn: {
    marginTop: 16,
    backgroundColor: AppColors.blue,
    borderRadius: 999,
    alignSelf: 'flex-start',
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  retryBtnText: {
    color: AppColors.white,
    fontFamily: 'Montserrat',
    fontSize: 14,
  },
  sectionTitle: {
    color: AppColors.blue,
    fontFamily: 'Montserrat',
    fontSize: 20,
    marginTop: 16,
    marginBottom: 10,
  },
  emptyCard: {
    backgroundColor: AppColors.white,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: AppColors.grey,
    marginTop: 12,
  },
  card: {
    backgroundColor: AppColors.white,
    borderRadius: 20,
    padding: 18,
    marginTop: 14,
    borderWidth: 1,
    borderColor: AppColors.grey,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    color: AppColors.blue,
    fontFamily: 'Montserrat-Bold',
    fontSize: 22,
    marginBottom: 8,
  },
  pricePill: {
    color: AppColors.white,
    fontFamily: 'Montserrat',
    fontSize: 13,
    backgroundColor: AppColors.blue,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeFree: {
    backgroundColor: AppColors.grey3,
  },
  badgePaid: {
    backgroundColor: AppColors.blue,
  },
  badgeText: {
    color: AppColors.white,
    fontFamily: 'Montserrat',
    fontSize: 12,
  },
  description: {
    color: AppColors.primary,
    fontFamily: 'Montserrat',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 2,
  },
  locationSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: AppColors.grey,
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
  },
  metaItem: {
    width: '48%',
    backgroundColor: AppColors.grey,
    borderRadius: 14,
    padding: 12,
  },
  metaLabel: {
    color: AppColors.grey3,
    fontFamily: 'Montserrat',
    fontSize: 12,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  metaValue: {
    color: AppColors.primary,
    fontFamily: 'Montserrat',
    fontSize: 14,
    lineHeight: 18,
  },
})
