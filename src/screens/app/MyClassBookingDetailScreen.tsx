// @ts-nocheck
import { useCallback, useContext, useRef, useState } from 'react'
import {
  Alert,
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
import { formatUsdOrFree } from '../../utils/currency'
import { UserContext } from '../../context/UserContext'
import { Feather } from '@expo/vector-icons'

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

  setTokens((prev) => ({
    ...(prev ?? {}),
    access_token: refreshObj.access_token,
    refresh_token: refreshObj.refresh_token,
  }))

  return refreshObj.access_token
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
  if (response.ok) {
    return response
  }

  if (!(await shouldRefreshAuthResponse(response))) {
    return response
  }

  console.log('Access token expired, requesting new one - requestWithRefresh()')
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


const MyClassBookingDetailScreen = ({ navigation, route }) => {
  const { tokens, setTokens, webServer } = useContext(UserContext)
  const bookingUid = route?.params?.bookingUid
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [isCancelling, setIsCancelling] = useState(false)
  const cancellationKeyRef = useRef<string | null>(null)

  const loadBooking = useCallback(async () => {
    if (!tokens?.access_token || !bookingUid) {
      setErrorMessage('Unable to load booking details.')
      setLoading(false)
      return
    }

    setLoading(true)
    setErrorMessage('')

    const endpoint = `${webServer}/api/v1/classes/bookings/${bookingUid}`

    try {
      const response = await requestWithRefresh({
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        webServer,
        setTokens,
        performRequest: (accessToken) =>
          fetch(endpoint, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }),
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

      if (!response.ok) {
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

  const renderPrice = () => formatUsdOrFree(booking?.price)

  const renderBookingStatus = () => {
    const status = String(booking?.booking_status ?? 'pending').toLowerCase()
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  const renderPaymentStatus = () => {
    const status = String(booking?.payment_status ?? 'unpaid').toLowerCase()
    if (status === 'unpaid') return 'Pending'
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  const renderBookingDetailText = (value) => {
    if (value === null || value === undefined) {
      return ''
    }

    return String(value).trim()
  }

  const bookingStatus = String(booking?.booking_status ?? '').toLowerCase()
  const paymentStatus = String(booking?.payment_status ?? '').toLowerCase()
  const isCancellable = bookingStatus === 'pending' || bookingStatus === 'confirmed'
  const hasRefundablePayment = paymentStatus === 'succeeded'

  const generateCancellationIdempotencyKey = () => {
    const random = Math.random().toString(36).slice(2, 10)
    return `class-booking-${bookingUid}-cancel-${Date.now()}-${random}`
  }

  const handleCancelBooking = () => {
    if (!booking || !isCancellable || isCancelling) {
      return
    }

    Alert.alert(
      'Cancel booking?',
      hasRefundablePayment
        ? 'This class booking will be cancelled and your payment will be refunded.'
        : 'This class booking will be cancelled. No payment refund is expected.',
      [
        { text: 'Go Back', style: 'cancel' },
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
    const endpoint = `${webServer}/api/v1/classes/bookings/${bookingUid}/cancel`

    setIsCancelling(true)

    try {
      const response = await requestWithRefresh({
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        webServer,
        setTokens,
        performRequest: (accessToken) =>
          fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Idempotency-Key': idempotencyKey,
              Authorization: `Bearer ${accessToken}`,
            },
            body: '{}',
          }),
      })

      if (!response) {
        showMessage({
          message: 'Session expired',
          description: 'Please sign in again.',
          type: 'danger',
        })
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

      if (!response.ok) {
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
              <View style={styles.headerTop}>
                <View style={styles.headerLeft}>
                  <Text style={styles.className}>{booking?.class_name || 'Untitled class'}</Text>
                  {booking?.trainer_display_name && (
                    <Text style={styles.trainerInfo}>by {booking.trainer_display_name}</Text>
                  )}
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

            {booking?.class_description && (
              <View style={styles.descriptionSection}>
                <Text style={styles.description}>{booking.class_description}</Text>
              </View>
            )}

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

              {calculateDuration() && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Duration</Text>
                  <Text style={styles.detailValue}>{calculateDuration()}</Text>
                </View>
              )}

              {booking?.booked_at && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Booked on</Text>
                  <Text style={styles.detailValue}>{formatDateTime(booking.booked_at)}</Text>
                </View>
              )}

              {renderBookingDetailText(booking?.location) ? (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Location</Text>
                  <Text style={styles.detailValue}>{renderBookingDetailText(booking.location)}</Text>
                </View>
              ) : null}

              {renderBookingDetailText(booking?.additional_notes) ? (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Additional Notes</Text>
                  <Text style={styles.detailValue}>{renderBookingDetailText(booking.additional_notes)}</Text>
                </View>
              ) : null}
            </View>

            {isCancellable && (
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
    backgroundColor: AppColors.grey,
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
    backgroundColor: AppColors.white,
    borderBottomColor: AppColors.grey,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 8,
  },
  title: {
    fontSize: 24,
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
    paddingVertical: 20,
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
  },
  emptyTitle: {
    fontSize: 20,
    color: AppColors.blue,
    textAlign: 'center',
  },
  errorCard: {
    backgroundColor: AppColors.white,
    borderColor: AppColors.grey,
    borderWidth: 1,
    padding: 18,
    borderRadius: 18,
    marginVertical: 20,
  },
  errorTitle: {
    fontSize: 16,
    color: AppColors.blue,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: AppColors.grey3,
    marginBottom: 12,
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
  },
  content: {
    marginBottom: 24,
  },
  headerSection: {
    backgroundColor: AppColors.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: AppColors.grey,
  },
  className: {
    fontSize: 24,
    color: AppColors.blue,
    marginBottom: 12,
  },
  priceBadge: {
    fontSize: 13,
    color: AppColors.white,
    backgroundColor: AppColors.blue,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  descriptionSection: {
    backgroundColor: AppColors.white,
    padding: 16,
    borderRadius: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: AppColors.grey,
  },
  description: {
    fontSize: 14,
    color: AppColors.primary,
    lineHeight: 22,
  },
  detailsSection: {
    backgroundColor: AppColors.white,
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: AppColors.grey,
  },
  actionSection: {
    marginTop: 8,
    marginBottom: 16,
  },
  cancelBtn: {
    minHeight: 50,
    borderRadius: 999,
    backgroundColor: AppColors.red,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  cancelBtnDisabled: {
    opacity: 0.7,
  },
  cancelBtnText: {
    color: AppColors.white,
    fontSize: 16,
  },
  cancelHelpText: {
    marginTop: 10,
    fontSize: 13,
    color: AppColors.grey3,
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 12,
    color: AppColors.blue,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomColor: AppColors.grey,
    borderBottomWidth: 1,
  },
  detailRow_last: {
    borderBottomWidth: 0,
  },
  detailLabel: {
    fontSize: 13,
    color: AppColors.primary,
    flex: 0.4,
  },
  detailValue: {
    fontSize: 14,
    color: AppColors.blue,
    textAlign: 'right',
    flex: 0.6,
    paddingLeft: 12,
  },
  trainerInfo: {
    fontSize: 14,
    color: AppColors.grey3,
    fontStyle: 'italic',
    marginTop: 4,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopColor: AppColors.grey,
    borderTopWidth: 1,
  },
  statusGroup: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 12,
    color: AppColors.primary,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    minWidth: 96,
  },
  statusBadgeBooking: {
    backgroundColor: AppColors.grey2,
  },
  statusBadgePayment: {
    backgroundColor: AppColors.blue,
  },
  statusText: {
    fontSize: 12,
    color: AppColors.white,
    textAlign: 'center',
  },
  notes: {
    fontSize: 14,
    color: AppColors.blue,
    lineHeight: 22,
  },
})