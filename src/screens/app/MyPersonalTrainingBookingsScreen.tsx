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
import { performAuthenticatedRequest } from '../../utils/authenticatedRequest'

type RefreshTokens = {
  access_token?: string
  refresh_token?: string
}

type UserContextValue = {
  tokens?: RefreshTokens | null
  setTokens: (value: RefreshTokens | null | ((prev: RefreshTokens | null) => RefreshTokens | null)) => void
  webServer: string
}

type PersonalTrainingBookingSummary = {
  booking_uid?: number | string
  session_uid?: number | string
  trainer_display_name?: string | null
  price?: number | string | null
  currency_code?: string | null
  booking_status?: string | null
  payment_status?: string | null
  location?: string | null
  start_at?: string | null
  end_at?: string | null
}

type MyPersonalTrainingBookingsNavigation = {
  goBack: () => void
  navigate: (
    screen: 'MyPersonalTrainingBookingDetailScreen',
    params: { bookingUid?: number | string }
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

const MyPersonalTrainingBookingsScreen = ({ navigation }: { navigation: MyPersonalTrainingBookingsNavigation }) => {
  const { tokens, setTokens, webServer } = useContext(UserContext) as UserContextValue
  const [bookings, setBookings] = useState<PersonalTrainingBookingSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming')

  const loadBookings = useCallback(async ({ isRefresh = false } = {}) => {
    if (!tokens?.access_token) {
      setErrorMessage('Please sign in again to view your personal training bookings.')
      setBookings([])
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

    const endpoint = `${webServer}/api/v1/personal-training/bookings`

    try {
      const response = await performAuthenticatedRequest({
        endpoint,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        webServer,
        setTokens,
      })

      if (!response) {
        setErrorMessage('Your session expired. Please sign in again.')
        setBookings([])
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

      if (!response.ok) {
        const message = responseBody?.message || 'Unable to load your personal training bookings.'
        setErrorMessage(message)
        setBookings([])
        showMessage({
          message: 'Bookings unavailable',
          description: message,
          type: 'danger',
        })
        return
      }

      setBookings(
        Array.isArray(responseBody?.data)
          ? responseBody.data.filter(
              (value): value is PersonalTrainingBookingSummary => typeof value === 'object' && value !== null
            )
          : []
      )
    } catch (error) {
      const message = 'Failed to load your personal training bookings.'
      setErrorMessage(message)
      setBookings([])
      showMessage({
        message: 'Bookings unavailable',
        description: message,
        type: 'danger',
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [tokens?.access_token, tokens?.refresh_token, setTokens, webServer])

  useFocusEffect(
    useCallback(() => {
      void loadBookings()
    }, [loadBookings])
  )

  const onRefresh = () => {
    void loadBookings({ isRefresh: true })
  }

  const isUpcoming = (booking: PersonalTrainingBookingSummary) => {
    const sessionDate = parseDate(booking?.start_at)
    if (!sessionDate) return false
    return sessionDate.getTime() > Date.now()
  }

  const openBooking = (booking: PersonalTrainingBookingSummary) => {
    navigation.navigate('MyPersonalTrainingBookingDetailScreen', { bookingUid: booking?.booking_uid })
  }

  const renderPrice = (booking: PersonalTrainingBookingSummary) => {
    const price = Number(booking?.price ?? 0)
    if (price <= 0) {
      return 'Free'
    }
    const currency = String(booking?.currency_code ?? '').trim().toUpperCase()
    return `${price.toFixed(2)} ${currency}`.trim()
  }

  const renderBookingStatus = (booking: PersonalTrainingBookingSummary) => {
    const status = String(booking?.booking_status ?? 'pending').toLowerCase()
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  const upcomingBookings = bookings.filter(isUpcoming)
  const pastBookings = bookings.filter((booking) => !isUpcoming(booking))
  const visibleBookings = activeTab === 'upcoming' ? upcomingBookings : pastBookings
  const activeBookingsLabel = activeTab === 'upcoming' ? 'Upcoming' : 'Past'

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.navs}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" color={AppColors.blue} size={36} />
        </TouchableOpacity>
        <Text style={styles.title}>My PT Bookings</Text>
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
            <Text style={styles.stateText}>Loading your personal training bookings...</Text>
          </View>
        ) : errorMessage ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Unable to load bookings</Text>
            <Text style={styles.errorText}>{errorMessage}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => loadBookings()}>
              <Text style={styles.retryBtnText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : bookings.length === 0 ? (
          <View style={styles.centerState}>
            <Text style={styles.emptyTitle}>No personal training bookings yet</Text>
            <Text style={styles.stateText}>Book a personal training session to get started.</Text>
          </View>
        ) : (
          <>
            <View style={styles.filterBar}>
              <TouchableOpacity
                style={[styles.filterButton, activeTab === 'upcoming' && styles.filterButtonActive]}
                onPress={() => setActiveTab('upcoming')}
              >
                <Text style={[styles.filterButtonText, activeTab === 'upcoming' && styles.filterButtonTextActive]}>
                  Upcoming ({upcomingBookings.length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterButton, activeTab === 'past' && styles.filterButtonActive]}
                onPress={() => setActiveTab('past')}
              >
                <Text style={[styles.filterButtonText, activeTab === 'past' && styles.filterButtonTextActive]}>
                  Past ({pastBookings.length})
                </Text>
              </TouchableOpacity>
            </View>

            {visibleBookings.length > 0 ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{activeBookingsLabel}</Text>
                {visibleBookings.map((booking) => (
                  <TouchableOpacity
                    key={String(booking?.booking_uid ?? `${booking?.session_uid}-${booking?.start_at}`)}
                    style={[
                      styles.card,
                      (['cancelled', 'refunded'].includes(String(booking?.booking_status ?? '').toLowerCase())
                        || String(booking?.payment_status ?? '').toLowerCase() === 'refunded') && styles.cardInactive,
                    ]}
                    activeOpacity={0.85}
                    onPress={() => openBooking(booking)}
                  >
                    <View style={styles.cardHeader}>
                      <View style={styles.cardHeaderText}>
                        <Text style={styles.cardTitle}>{getMemberPersonalTrainingTitle(booking?.trainer_display_name)}</Text>
                      </View>
                      <View style={[styles.badge, Number(booking?.price ?? 0) <= 0 ? styles.badgeFree : styles.badgePaid]}>
                        <Text style={styles.badgeText}>{Number(booking?.price ?? 0) <= 0 ? 'Free' : 'Paid'}</Text>
                      </View>
                    </View>

                    {booking?.location ? (
                      <View style={styles.locationRow}>
                        <Text style={styles.metaLabel}>Location</Text>
                        <Text style={styles.metaValue} numberOfLines={2}>
                          {booking.location}
                        </Text>
                      </View>
                    ) : null}

                    <View style={styles.metaGrid}>
                      <View style={styles.metaItem}>
                        <Text style={styles.metaLabel}>Date</Text>
                        <Text style={styles.metaValue}>{formatDate(booking?.start_at)}</Text>
                      </View>
                      <View style={styles.metaItem}>
                        <Text style={styles.metaLabel}>Time</Text>
                        <Text style={styles.metaValue}>
                          {formatTime(booking?.start_at)} - {formatTime(booking?.end_at)}
                        </Text>
                      </View>
                      <View style={styles.metaItem}>
                        <Text style={styles.metaLabel}>Booking Status</Text>
                        <Text style={styles.metaValue}>{renderBookingStatus(booking)}</Text>
                      </View>
                      <View style={styles.metaItem}>
                        <Text style={styles.metaLabel}>Cost</Text>
                        <Text style={styles.pricePill}>{renderPrice(booking)}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>{activeBookingsLabel} bookings</Text>
                <Text style={styles.stateText}>
                  {activeTab === 'upcoming'
                    ? 'No upcoming personal training bookings right now. Check back for new sessions.'
                    : 'You do not have any past personal training bookings yet.'}
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

export default MyPersonalTrainingBookingsScreen

const styles = StyleSheet.create({
  container: {
    backgroundColor: AppColors.white,
    flex: 1,
  },
  navs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 24,
    paddingRight: 24,
    paddingTop: 12,
    paddingBottom: 12,
  },
  backBtn: {
    padding: 8,
  },
  title: {
    fontSize: 24,
    color: AppColors.blue,
    flex: 1,
    textAlign: 'center',
    fontFamily: 'Montserrat',
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
  section: {
    marginBottom: 24,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 20,
    color: AppColors.blue,
    marginBottom: 14,
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
  cardInactive: {
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
  badgeText: {
    color: AppColors.white,
    fontSize: 12,
    fontFamily: 'Montserrat',
  },
  locationRow: {
    marginTop: 8,
  },
  metaGrid: {
    marginTop: 14,
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
    fontFamily: 'Montserrat',
  },
  filterButtonTextActive: {
    color: AppColors.white,
  },
})
