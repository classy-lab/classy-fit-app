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
import { Feather } from '@expo/vector-icons'
import { AppColors } from '../../styles/colors'
import { UserContext } from '../../context/UserContext'

const parseDate = (value) => {
  if (!value) return null
  const normalized = String(value).includes('T') ? String(value) : String(value).replace(' ', 'T')
  const date = new Date(normalized)
  return Number.isNaN(date.getTime()) ? null : date
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

const PersonalTrainingSessionsScreen = ({ navigation }) => {
  const { user, tokens, setTokens, webServer } = useContext(UserContext)
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const refreshAccessToken = async () => {
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

    setTokens((prev: any) => ({
      ...prev,
      access_token: refreshObj.access_token,
      refresh_token: refreshObj.refresh_token,
    }))

    return refreshObj.access_token
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

    const endpoint = `${webServer}/api/v1/personal-training/sessions`

    const performRequest = async (accessToken) => {
      return fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
    }

    try {
      let accessToken = tokens.access_token
      let response = await performRequest(accessToken)

      if (response.status === 401 || response.status === 403) {
        const refreshedAccessToken = await refreshAccessToken()
        if (refreshedAccessToken) {
          accessToken = refreshedAccessToken
          response = await performRequest(accessToken)
        } else {
          setErrorMessage('Your session expired. Please sign in again.')
          setSessions([])
          return
        }
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

  const openSession = (session) => {
    navigation.navigate('PersonalTrainingSessionScreen', {
      sessionUid: session?.session_uid,
      session,
    })
  }

  const renderPrice = (session) => {
    const price = Number(session?.price ?? 0)
    if (price <= 0) {
      return 'Free'
    }
    const currency = String(session?.currency_code ?? '').trim().toUpperCase()
    return `${price.toFixed(2)} ${currency}`.trim()
  }

  const renderNotesPreview = (session) => {
    const notes = String(session?.additional_notes ?? '').trim()
    if (!notes) return null
    return notes.length > 80 ? `${notes.slice(0, 77)}...` : notes
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
          sessions.map((session) => {
            const price = Number(session?.price ?? 0)
            const location = String(session?.location ?? '').trim()
            const notesPreview = renderNotesPreview(session)
            const status = String(session?.status ?? 'scheduled').toLowerCase()

            return (
              <TouchableOpacity
                key={String(session?.session_uid ?? session?.uid ?? `${session?.trainer_gym_user_id}-${session?.start_at}`)}
                style={styles.card}
                activeOpacity={0.85}
                onPress={() => openSession(session)}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderText}>
                    <Text style={styles.cardTitle}>Personal Training Session</Text>
                    <Text style={styles.pricePill}>{renderPrice(session)}</Text>
                  </View>
                  <View style={[styles.badge, price <= 0 ? styles.badgeFree : styles.badgePaid]}>
                    <Text style={styles.badgeText}>{price <= 0 ? 'Free' : 'Paid'}</Text>
                  </View>
                </View>

                {session?.trainer_display_name ? (
                  <Text style={styles.trainerName}>with {session.trainer_display_name}</Text>
                ) : (
                  <Text style={styles.trainerName}>with TBA</Text>
                )}

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
          })
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
  card: {
    backgroundColor: AppColors.white,
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    borderColor: AppColors.grey,
    borderWidth: 1,
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
    fontWeight: '700',
    color: AppColors.blue,
    marginBottom: 4,
    fontFamily: 'Montserrat',
  },
  pricePill: {
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
  badgeText: {
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
