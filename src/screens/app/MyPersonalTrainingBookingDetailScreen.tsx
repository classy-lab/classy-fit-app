import { useCallback, useContext, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
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

const refreshAccessToken = async ({
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

const requestWithRefresh = async ({
  performRequest,
  accessToken,
  refreshToken,
  webServer,
  setTokens,
}) => {
  if (!accessToken) {
    return null
  }

  let response = await performRequest(accessToken)
  if (response.status !== 401) {
    return response
  }

  const refreshedAccessToken = await refreshAccessToken({
    refreshToken,
    webServer,
    setTokens,
  })

  if (!refreshedAccessToken) {
    return null
  }

  return performRequest(refreshedAccessToken)
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

const MyPersonalTrainingBookingDetailScreen = ({ navigation, route }) => {
  const { tokens, setTokens, webServer } = useContext(UserContext)
  const bookingUid = route?.params?.bookingUid
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [isCancelling, setIsCancelling] = useState(false)
  const cancellationKeyRef = useRef<string | null>(null)

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

    const endpoint = `${webServer}/api/v1/personal-training/bookings/${bookingUid}`
    const performRequest = async (accessToken) => {
      return fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
    }

    try {
      const response = await requestWithRefresh({
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        webServer,
        setTokens,
        performRequest: (accessToken) =>
          performRequest(accessToken),
      })

      if (!response) {
        setErrorMessage('Your session expired. Please sign in again.')
        setBooking(null)
        return
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

  const submitRequestWithRefresh = useCallback(
    async (performRequest) => {
      const accessToken = tokens?.access_token
      if (!accessToken) {
        showMessage({
          message: 'Session expired',
          description: 'Please sign in again.',
          type: 'danger',
        })
        return null
      }

      const response = await requestWithRefresh({
        accessToken,
        refreshToken: tokens?.refresh_token,
        webServer,
        setTokens,
        performRequest,
      })

      if (!response) {
        showMessage({
          message: 'Session expired',
          description: 'Please sign in again.',
          type: 'danger',
        })
        return null
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

      return { response, responseBody }
    },
    [refreshAccessToken, tokens?.access_token]
  )

  useFocusEffect(
    useCallback(() => {
      void loadBooking()
    }, [loadBooking])
  )

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
    if (status === 'unpaid') {
      return 'Pending'
    }

    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  const renderDetailText = (value) => {
    if (value === null || value === undefined) {
      return ''
    }
    return String(value).trim()
  }

  const bookingStatus = String(booking?.booking_status ?? '').toLowerCase()
  const paymentStatus = String(booking?.payment_status ?? '').toLowerCase()
  const isCancellable = bookingStatus === 'pending' || bookingStatus === 'confirmed'
  const hasRefundablePayment = paymentStatus === 'succeeded'
  const trainerName = String(booking?.trainer_display_name ?? '').trim()

  const generateCancellationIdempotencyKey = () => {
    const random = Math.random().toString(36).slice(2, 10)
    return `pt-booking-${bookingUid}-cancel-${Date.now()}-${random}`
  }

  const handleCancelBooking = () => {
    if (!booking || !isCancellable || isCancelling) {
      return
    }

    Alert.alert(
      'Cancel booking?',
      hasRefundablePayment
        ? 'This personal training booking will be cancelled and your payment will be refunded.'
        : 'This personal training booking will be cancelled.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Cancel Booking',
          style: 'destructive',
          onPress: () => {
            void submitCancellation()
          },
        },
      ],
      { cancelable: true }
    )
  }

  const submitCancellation = async () => {
    if (!tokens?.access_token || !bookingUid) {
      showMessage({
        message: 'Cancellation unavailable',
        description: 'Please sign in again and try once more.',
        type: 'danger',
      })
      return
    }

    if (!cancellationKeyRef.current) {
      cancellationKeyRef.current = generateCancellationIdempotencyKey()
    }

    const idempotencyKey = cancellationKeyRef.current
    const endpoint = `${webServer}/api/v1/personal-training/bookings/${bookingUid}/cancel`

    const performRequest = async (accessToken) => {
      return fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Idempotency-Key': idempotencyKey,
        },
      })
    }

    setIsCancelling(true)

    try {
      const result = await submitRequestWithRefresh(performRequest)
      if (!result) {
        return
      }

      const { response, responseBody } = result

      if (response.status === 409) {
        const message = responseBody?.message || 'This booking is already cancelled.'
        showMessage({
          message: 'Unable to cancel booking',
          description: message,
          type: 'danger',
        })
        await loadBooking()
        return
      }

      if (response.status !== 200) {
        const message = responseBody?.message || 'Unable to cancel this booking.'
        showMessage({
          message: 'Cancellation failed',
          description: message,
          type: 'danger',
        })
        return
      }

      const refund = responseBody?.refund
      showMessage({
        message: 'Booking cancelled',
        description: refund
          ? 'Your booking was cancelled and the payment was refunded.'
          : 'Your booking was cancelled.',
        type: 'success',
      })

      await loadBooking()
    } catch (error) {
      showMessage({
        message: 'Cancellation failed',
        description: 'We could not complete this cancellation. Please try again.',
        type: 'danger',
      })
    } finally {
      setIsCancelling(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.navs}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" color={AppColors.blue} size={36} />
        </TouchableOpacity>
        <Text style={styles.title}>PT Booking</Text>
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
              <View style={styles.headerTop}>
                <View style={styles.headerLeft}>
                  <Text style={styles.sessionName}>{getMemberPersonalTrainingTitle(trainerName)}</Text>
                </View>
                <Text style={styles.priceBadge}>{renderPrice()}</Text>
              </View>
              <View style={styles.statusRow}>
                <View style={styles.statusGroup}>
                  <Text style={styles.statusLabel}>Booking Status</Text>
                  <View style={[styles.statusBadge, styles.statusBadgeBooking]}>
                    <Text style={styles.statusText}>{renderBookingStatus()}</Text>
                  </View>
                </View>
                <View style={styles.statusGroup}>
                  <Text style={styles.statusLabel}>Payment Status</Text>
                  <View style={[styles.statusBadge, styles.statusBadgePayment]}>
                    <Text style={styles.statusText}>{renderPaymentStatus()}</Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.detailsSection}>
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

              {booking?.booked_at ? (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Booked on</Text>
                  <Text style={styles.detailValue}>{formatDateTime(booking.booked_at)}</Text>
                </View>
              ) : null}

              {booking?.cancelled_at ? (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Cancelled on</Text>
                  <Text style={styles.detailValue}>{formatDateTime(booking.cancelled_at)}</Text>
                </View>
              ) : null}

              {renderDetailText(booking?.location) ? (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Location</Text>
                  <Text style={styles.detailValue}>{booking.location}</Text>
                </View>
              ) : null}

              {renderDetailText(booking?.additional_notes) ? (
                <View style={styles.detailBlock}>
                  <Text style={styles.detailLabel}>Additional Notes</Text>
                  <Text style={styles.detailBlockValue}>{booking.additional_notes}</Text>
                </View>
              ) : null}

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Booking UID</Text>
                <Text style={styles.detailValue}>{booking?.booking_uid ?? bookingUid}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Cost</Text>
                <Text style={styles.detailValue}>{renderPrice()}</Text>
              </View>
            </View>

            {isCancellable ? (
              <View style={styles.actionSection}>
                <TouchableOpacity
                  style={[styles.cancelBtn, isCancelling && styles.cancelBtnDisabled]}
                  disabled={isCancelling}
                  activeOpacity={0.85}
                  onPress={handleCancelBooking}
                >
                  {isCancelling ? (
                    <ActivityIndicator color={AppColors.white} />
                  ) : (
                    <Text style={styles.cancelBtnText}>Cancel Booking</Text>
                  )}
                </TouchableOpacity>
                <Text style={styles.cancelHelpText}>
                  {hasRefundablePayment
                    ? 'Cancelling this booking will also refund the payment.'
                    : 'Cancelling this booking will remove it from your schedule.'}
                </Text>
              </View>
            ) : null}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

export default MyPersonalTrainingBookingDetailScreen

const styles = StyleSheet.create({
  container: {
    backgroundColor: AppColors.white,
    flex: 1,
  },
  navs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
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
  content: {
    flex: 1,
  },
  headerSection: {
    backgroundColor: AppColors.white,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: AppColors.grey,
    marginBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  headerLeft: {
    flex: 1,
  },
  sessionName: {
    color: AppColors.blue,
    fontFamily: 'Montserrat',
    fontSize: 22,
    marginBottom: 4,
  },
  priceBadge: {
    fontSize: 13,
    color: AppColors.white,
    backgroundColor: AppColors.blue,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    fontFamily: 'Montserrat',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  statusGroup: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 12,
    color: AppColors.grey3,
    textTransform: 'uppercase',
    marginBottom: 6,
    fontFamily: 'Montserrat',
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  statusBadgeBooking: {
    backgroundColor: AppColors.blue,
  },
  statusBadgePayment: {
    backgroundColor: AppColors.primary,
  },
  statusText: {
    color: AppColors.white,
    fontSize: 12,
    fontFamily: 'Montserrat',
  },
  detailsSection: {
    backgroundColor: AppColors.white,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: AppColors.grey,
  },
  detailRow: {
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 12,
    color: AppColors.grey3,
    textTransform: 'uppercase',
    marginBottom: 4,
    fontFamily: 'Montserrat',
  },
  detailValue: {
    fontSize: 14,
    color: AppColors.blue,
    fontFamily: 'Montserrat',
    lineHeight: 20,
  },
  detailBlock: {
    marginBottom: 12,
  },
  detailBlockValue: {
    marginTop: 4,
    fontSize: 14,
    color: AppColors.primary,
    fontFamily: 'Montserrat',
    lineHeight: 20,
  },
  actionSection: {
    marginTop: 16,
    paddingHorizontal: 2,
    paddingBottom: 8,
  },
  cancelBtn: {
    backgroundColor: AppColors.red,
    borderRadius: 999,
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  cancelBtnDisabled: {
    opacity: 0.7,
  },
  cancelBtnText: {
    color: AppColors.white,
    fontFamily: 'Montserrat',
    fontSize: 16,
  },
  cancelHelpText: {
    marginTop: 10,
    color: AppColors.grey3,
    fontFamily: 'Montserrat',
    fontSize: 13,
    lineHeight: 18,
  },
})