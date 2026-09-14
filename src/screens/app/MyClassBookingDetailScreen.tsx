// @ts-nocheck
import { useCallback, useContext, useState } from 'react'
import {
  ActivityIndicator,
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

const MyClassBookingDetailScreen = ({ navigation, route }) => {
  const { tokens, setTokens, webServer } = useContext(UserContext)
  const bookingUid = route?.params?.bookingUid
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
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

  const loadBooking = useCallback(async () => {
    if (!tokens?.access_token || !bookingUid) {
      setErrorMessage('Unable to load booking details.')
      setLoading(false)
      return
    }

    setLoading(true)
    setErrorMessage('')

    const endpoint = `${webServer}/api/v1/classes/bookings/${bookingUid}`

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
          setBooking(null)
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
        const message = responseBody?.message || 'Unable to load booking details.'
        setErrorMessage(message)
        setBooking(null)
        showMessage({
          message: 'Booking details unavailable',
          description: message,
          type: 'danger',
        })
        return
      }

      setBooking(responseBody?.booking ?? null)
    } catch (error) {
      const message = 'Failed to load booking details.'
      setErrorMessage(message)
      setBooking(null)
      showMessage({
        message: 'Booking details unavailable',
        description: message,
        type: 'danger',
      })
    } finally {
      setLoading(false)
    }
  }, [tokens?.access_token, tokens?.refresh_token, setTokens, webServer, bookingUid])

  useFocusEffect(
    useCallback(() => {
      void loadBooking()
    }, [loadBooking])
  )

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
      weekday: 'long',
      month: 'long',
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

  const formatDateTime = (value) => {
    const date = parseDate(value)
    if (!date) return 'Unknown'
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date)
  }

  const calculateDuration = () => {
    if (!booking?.session_start_at || !booking?.session_end_at) return null
    const start = parseDate(booking.session_start_at)
    const end = parseDate(booking.session_end_at)
    if (!start || !end) return null
    const minutes = Math.round((end.getTime() - start.getTime()) / 60000)
    return Math.floor(minutes / 60) > 0
      ? `${Math.floor(minutes / 60)}h ${minutes % 60}m`
      : `${minutes}m`
  }

  const renderPrice = () => {
    const price = Number(booking?.price ?? 0)
    if (price <= 0) {
      return 'Free'
    }
    const currency = String(booking?.currency_code ?? '').trim().toUpperCase()
    return `${price.toFixed(2)} ${currency}`.trim()
  }

  const renderBookingStatus = () => {
    const status = String(booking?.booking_status ?? 'pending').toLowerCase()
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  const renderPaymentStatus = () => {
    const status = String(booking?.payment_status ?? 'unpaid').toLowerCase()
    if (status === 'unpaid') return 'Pending'
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.navs}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" color={AppColors.blue} size={36} />
        </TouchableOpacity>
        <Text style={styles.title}>Booking Details</Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color={AppColors.blue} />
            <Text style={styles.stateText}>Loading booking details...</Text>
          </View>
        ) : errorMessage ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Unable to load booking</Text>
            <Text style={styles.errorText}>{errorMessage}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => loadBooking()}>
              <Text style={styles.retryBtnText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : !booking ? (
          <View style={styles.centerState}>
            <Text style={styles.emptyTitle}>Booking not found</Text>
          </View>
        ) : (
          <View style={styles.content}>
            <View style={styles.headerSection}>
              <Text style={styles.className}>{booking?.class_name || 'Untitled class'}</Text>
              <Text style={styles.priceBadge}>{renderPrice()}</Text>
            </View>

            {booking?.class_description && (
              <View style={styles.descriptionSection}>
                <Text style={styles.description}>{booking.class_description}</Text>
              </View>
            )}

            <View style={styles.detailsSection}>
              <Text style={styles.sectionTitle}>Session Details</Text>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Date</Text>
                <Text style={styles.detailValue}>{formatDate(booking?.start_at)}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Time</Text>
                <Text style={styles.detailValue}>
                  {formatTime(booking?.start_at)} - {formatTime(booking?.end_at)}
                </Text>
              </View>

              {calculateDuration() && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Duration</Text>
                  <Text style={styles.detailValue}>{calculateDuration()}</Text>
                </View>
              )}

              {booking?.trainer_display_name && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Trainer</Text>
                  <Text style={styles.detailValue}>{booking.trainer_display_name}</Text>
                </View>
              )}
            </View>

            <View style={styles.detailsSection}>
              <Text style={styles.sectionTitle}>Booking Information</Text>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Booking Status</Text>
                <Text style={styles.detailValue}>{renderBookingStatus()}</Text>
              </View>

              {booking?.payment_status && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Payment Status</Text>
                  <Text style={styles.detailValue}>{renderPaymentStatus()}</Text>
                </View>
              )}

              {booking?.booked_at && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Booked on</Text>
                  <Text style={styles.detailValue}>{formatDateTime(booking.booked_at)}</Text>
                </View>
              )}

              {booking?.cancelled_at && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Cancelled on</Text>
                  <Text style={styles.detailValue}>{formatDateTime(booking.cancelled_at)}</Text>
                </View>
              )}
            </View>

            {booking?.notes && (
              <View style={styles.detailsSection}>
                <Text style={styles.sectionTitle}>Notes</Text>
                <Text style={styles.notes}>{booking.notes}</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

export default MyClassBookingDetailScreen

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
  content: {
    marginBottom: 24,
  },
  headerSection: {
    marginBottom: 20,
  },
  className: {
    fontSize: 28,
    fontWeight: 'bold',
    color: AppColors.blue,
    marginBottom: 8,
  },
  priceBadge: {
    fontSize: 18,
    fontWeight: '600',
    color: AppColors.primary,
    backgroundColor: AppColors.lightGrey,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  descriptionSection: {
    backgroundColor: AppColors.lightGrey,
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  description: {
    fontSize: 14,
    color: AppColors.blue,
    lineHeight: 20,
  },
  detailsSection: {
    backgroundColor: AppColors.white,
    borderColor: AppColors.grey,
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.blue,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomColor: AppColors.lightGrey,
    borderBottomWidth: 1,
  },
  detailRow_last: {
    borderBottomWidth: 0,
  },
  detailLabel: {
    fontSize: 14,
    color: AppColors.grey,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: AppColors.blue,
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    marginLeft: 12,
  },
  notes: {
    fontSize: 14,
    color: AppColors.blue,
    lineHeight: 20,
  },
})
