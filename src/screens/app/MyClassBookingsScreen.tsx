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

const MyClassBookingsScreen = ({ navigation }) => {
  const { user, tokens, setTokens, webServer } = useContext(UserContext)
  const [bookings, setBookings] = useState([])
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

  const loadBookings = useCallback(async ({ isRefresh = false } = {}) => {
    if (!tokens?.access_token) {
      setErrorMessage('Please sign in again to view your bookings.')
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

    const endpoint = `${webServer}/api/v1/classes/bookings`

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
          setBookings([])
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
        const message = responseBody?.message || 'Unable to load your bookings.'
        setErrorMessage(message)
        setBookings([])
        showMessage({
          message: 'Bookings unavailable',
          description: message,
          type: 'danger',
        })
        return
      }

      const allBookings = Array.isArray(responseBody?.data) ? responseBody.data : []
      setBookings(allBookings)
    } catch (error) {
      const message = 'Failed to load your bookings.'
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

  const isUpcoming = (booking) => {
    const sessionDate = parseDate(booking?.start_at)
    if (!sessionDate) return false
    return sessionDate.getTime() > Date.now()
  }

  const openBooking = (booking) => {
    navigation.navigate('MyClassBookingDetailScreen', { bookingUid: booking?.booking_uid })
  }

  const renderPrice = (booking) => {
    const price = Number(booking?.price ?? 0)
    if (price <= 0) {
      return 'Free'
    }
    const currency = String(booking?.currency_code ?? '').trim().toUpperCase()
    return `${price.toFixed(2)} ${currency}`.trim()
  }

  const renderBookingStatus = (booking) => {
    const status = String(booking?.booking_status ?? 'pending').toLowerCase()
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  const renderPaymentStatus = (booking) => {
    const status = String(booking?.payment_status ?? 'unpaid').toLowerCase()
    if (status === 'unpaid') return 'Pending'
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  const upcomingBookings = bookings.filter(isUpcoming)
  const pastBookings = bookings.filter((b) => !isUpcoming(b))

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.navs}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" color={AppColors.blue} size={36} />
        </TouchableOpacity>
        <Text style={styles.title}>My Bookings</Text>
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
            <Text style={styles.stateText}>Loading your bookings...</Text>
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
            <Text style={styles.emptyTitle}>No bookings yet</Text>
            <Text style={styles.stateText}>Book a class to get started.</Text>
          </View>
        ) : (
          <>
            {upcomingBookings.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Upcoming</Text>
                {upcomingBookings.map((booking) => (
                  <TouchableOpacity
                    key={String(booking?.booking_uid ?? `${booking?.class_uid}-${booking?.session_uid}`)}
                    style={styles.card}
                    activeOpacity={0.85}
                    onPress={() => openBooking(booking)}
                  >
                    <View style={styles.cardHeader}>
                      <View style={styles.cardHeaderText}>
                        <Text style={styles.cardTitle}>{booking?.class_name || 'Untitled class'}</Text>
                        {/* <Text style={styles.pricePill}>Cost: {renderPrice(booking)}</Text> */}
                      </View>
                    </View>

                    {booking?.trainer_display_name && (
                      <Text style={styles.trainerName}>with {booking.trainer_display_name}</Text>
                    )}

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
                      {booking?.payment_status && (
                        <View style={styles.metaItem}>
                          <Text style={styles.metaLabel}>Payment</Text>
                          <Text style={styles.metaValue}>{renderPaymentStatus(booking)}</Text>
                        </View>
                      )}
                      <View style={styles.metaItem}>
                        <Text style={styles.metaLabel}>Cost</Text>
                        <Text style={styles.pricePill}>{renderPrice(booking)}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {pastBookings.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Past</Text>
                {pastBookings.map((booking) => (
                  <TouchableOpacity
                    key={String(booking?.booking_uid ?? `${booking?.class_uid}-${booking?.session_uid}-past`)}
                    style={[styles.card, styles.cardPast]}
                    activeOpacity={0.85}
                    onPress={() => openBooking(booking)}
                  >
                    <View style={styles.cardHeader}>
                      <View style={styles.cardHeaderText}>
                        <Text style={styles.cardTitle}>{booking?.class_name || 'Untitled class'}</Text>
                        <Text style={styles.pricePill}>Cost: {renderPrice(booking)}</Text>
                      </View>
                    </View>

                    {booking?.trainer_display_name && (
                      <Text style={styles.trainerName}>with {booking.trainer_display_name}</Text>
                    )}

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
                      {booking?.payment_status && (
                        <View style={styles.metaItem}>
                          <Text style={styles.metaLabel}>Payment</Text>
                          <Text style={styles.metaValue}>{renderPaymentStatus(booking)}</Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

export default MyClassBookingsScreen

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
    fontWeight: 'bold',
    color: AppColors.blue,
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
  },
  centerState: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  stateText: {
    marginTop: 12,
    fontSize: 16,
    color: AppColors.grey,
    textAlign: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: AppColors.blue,
    textAlign: 'center',
  },
  errorCard: {
    backgroundColor: '#fff3cd',
    borderLeftColor: '#ff6b6b',
    borderLeftWidth: 4,
    padding: 16,
    borderRadius: 8,
    marginVertical: 20,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ff6b6b',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  retryBtn: {
    backgroundColor: AppColors.blue,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  retryBtnText: {
    color: AppColors.white,
    fontWeight: '600',
    fontSize: 14,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: AppColors.blue,
    marginBottom: 12,
  },
  card: {
    backgroundColor: AppColors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
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
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.blue,
    marginBottom: 4,
  },
  pricePill: {
    fontSize: 13,
    fontWeight: '500',
    color: AppColors.white,
    backgroundColor: AppColors.blue,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  trainerName: {
    fontSize: 14,
    color: AppColors.grey,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  metaGrid: {
    marginTop: 12,
  },
  metaItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  metaLabel: {
    fontSize: 12,
    color: AppColors.primary,
    fontWeight: '500',
  },
  metaValue: {
    fontSize: 12,
    color: AppColors.blue,
    fontWeight: '600',
  },
})
