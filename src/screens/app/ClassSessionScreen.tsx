// @ts-nocheck
import { useContext, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Feather } from '@expo/vector-icons'
import { useStripe } from '@stripe/stripe-react-native'
import { showMessage } from 'react-native-flash-message'
import { AppColors } from '../../styles/colors'
import { formatUsd } from '../../utils/currency'
import { UserContext } from '../../context/UserContext'

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

const generateIdempotencyKey = (sessionUid) => {
  const random = Math.random().toString(36).slice(2, 10)
  return `class-booking-${sessionUid}-${Date.now()}-${random}`
}

const ClassSessionScreen = ({ navigation, route }) => {
  const { user, tokens, setTokens, webServer } = useContext(UserContext)
  const { initPaymentSheet, presentPaymentSheet } = useStripe()
  const session = route?.params?.session ?? {}
  const bookingAttemptKeyRef = useRef<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const location = String(session?.location ?? '').trim()
  const additionalNotes = String(session?.additional_notes ?? '').trim()

  const price = Number(session?.price ?? 0)
  const capacity = Number(session?.capacity ?? 0)
  const bookedCount = Number(session?.booked_count ?? 0)
  const availableCapacity =
    session?.available_capacity !== null && session?.available_capacity !== undefined
      ? Number(session.available_capacity)
      : Math.max(capacity - bookedCount, 0)
  const sessionStatus = String(session?.status ?? session?.session_status ?? 'scheduled')
  const isScheduled = sessionStatus === 'scheduled'
  const canBook = isScheduled && availableCapacity > 0 && !isSubmitting
  const isFree = price <= 0
  const priceLabel = isFree
    ? 'Free'
    : formatUsd(price)

  const refreshAccessToken = async () => {
    return refreshAccessTokenWithRefresh({
      refreshToken: tokens?.refresh_token ?? null,
      webServer,
      setTokens,
    })
  }

  const sessionSummary = useMemo(() => {
    return [
      {
        label: 'Date',
        value: formatDate(session?.start_at),
      },
      {
        label: 'Time',
        value: `${formatTime(session?.start_at)} - ${formatTime(session?.end_at)}`,
      },
      {
        label: 'Duration',
        value: session?.duration_minutes ? `${session.duration_minutes} min` : 'Unknown',
      },
      {
        label: 'Trainer',
        value: session?.trainer_display_name || 'TBA',
      },
      {
        label: 'Capacity',
        value: `${availableCapacity}/${capacity || 0} available`,
      },
    ]
  }, [availableCapacity, capacity, session?.duration_minutes, session?.end_at, session?.start_at, session?.trainer_display_name])

  const submitBooking = async () => {
    if (!session?.session_uid || !user?.gym_id || !tokens?.access_token) {
      showMessage({
        message: 'Booking unavailable',
        description: 'Please sign in again and try once more.',
        type: 'danger',
      })
      return
    }

    if (!canBook) {
      showMessage({
        message: 'Class unavailable',
        description: !isScheduled
          ? 'This class is no longer available for booking.'
          : 'This class is full.',
        type: 'danger',
      })
      return
    }

    if (!bookingAttemptKeyRef.current) {
      bookingAttemptKeyRef.current = generateIdempotencyKey(session.session_uid)
    }

    const idempotencyKey = bookingAttemptKeyRef.current

    setIsSubmitting(true)

    const endpoint = `${webServer}/api/v1/classes/${session.session_uid}/booking`
    const performRequest = async (accessToken) => {
      return fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Idempotency-Key': idempotencyKey,
        },
      })
    }

    const submitCheckoutRequest = async () => {
      let response = await performRequest(tokens.access_token)

      if (!response.ok) {
        if (!(await shouldRefreshAuthResponse(response))) {
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
        }

        console.log('Access token expired, requesting new one - submitCheckoutRequest()')
        const refreshedAccessToken = await refreshAccessToken()
        if (!refreshedAccessToken) {
          showMessage({
            message: 'Session expired',
            description: 'Please sign in again.',
            type: 'danger',
          })
          return null
        }

        response = await performRequest(refreshedAccessToken)
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
    }

    try {
      const initialCheckoutResult = await submitCheckoutRequest()
      if (!initialCheckoutResult) {
        return
      }

      let { response, responseBody } = initialCheckoutResult

      if (response.status !== 200 && response.status !== 201) {
        const message = responseBody?.message || 'Unable to book class.'
        showMessage({
          message: 'Booking failed',
          description: message,
          type: 'danger',
        })
        return
      }

      const booking = responseBody?.booking
      const payment = responseBody?.payment

      if (!payment) {
        showMessage({
          message: 'Booking successful',
          description: 'Your class has been booked successfully.',
          type: 'success',
        })
        navigation.navigate('ClassBookingSuccessScreen', {
          session,
          booking,
          payment: null,
          isPaid: false,
          idempotencyKey: responseBody?.idempotency_key ?? idempotencyKey,
        })
        return
      }

      const clientSecret = payment?.payment_intent?.client_secret
      if (!clientSecret) {
        showMessage({
          message: 'Booking failed',
          description: 'Payment initialization failed. Please try again.',
          type: 'danger',
        })
        return
      }

      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: 'Classy Fit',
        style: 'alwaysDark',
        returnURL: 'classyfit://stripe-redirect',
      })

      if (initError) {
        console.log('Class Payment Sheet init error:', initError)
        showMessage({
          message: 'Payment setup failed',
          description: 'Unable to initialize payment sheet. Please try again.',
          type: 'danger',
        })
        return
      }

      const { error: presentError } = await presentPaymentSheet()

      if (presentError) {
        if (presentError.code === 'Canceled') {
          const bookingUid = Number(booking?.booking_uid ?? 0)
          if (bookingUid > 0) {
            try {
              const cancelResponse = await submitRequestWithRefresh((accessToken) => {
                return fetch(`${webServer}/api/v1/classes/bookings/${bookingUid}/cancel`, {
                  method: 'POST',
                  headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Idempotency-Key': idempotencyKey,
                  },
                })
              })

              if (!cancelResponse || (!cancelResponse.response.ok && cancelResponse.response.status !== 409)) {
                showMessage({
                  message: 'Booking still pending',
                  description:
                    cancelResponse?.responseBody?.message ||
                    'Your payment was cancelled, but we could not release this class right away. Please refresh and try again.',
                  type: 'warning',
                })
              }

              bookingAttemptKeyRef.current = null
            } catch (error) {
              showMessage({
                message: 'Booking still pending',
                description:
                  'Your payment was cancelled, but we could not release this class right away. Please refresh and try again.',
                type: 'warning',
              })
            } finally {
              await loadSession({ isRefresh: true })
            }
          }

          return
        }

        console.log('Class Payment Sheet error:', presentError)
        showMessage({
          message: 'Payment failed',
          description: presentError.message || 'The payment could not be processed. Please try again.',
          type: 'danger',
        })
        return
      }

      const reconciliationResult = await submitCheckoutRequest()
      if (reconciliationResult && (reconciliationResult.response.status === 200 || reconciliationResult.response.status === 201)) {
        response = reconciliationResult.response
        responseBody = reconciliationResult.responseBody
      }

      const reconciledBooking = responseBody?.booking ?? booking
      const reconciledPayment = responseBody?.payment ?? payment

      showMessage({
        message: 'Payment successful',
        description: 'Your class booking payment has been submitted.',
        type: 'success',
      })
      navigation.navigate('ClassBookingSuccessScreen', {
        session,
        booking: reconciledBooking,
        payment: reconciledPayment,
        isPaid: true,
        idempotencyKey: responseBody?.idempotency_key ?? idempotencyKey,
      })
    } catch (error) {
      console.log('Class booking checkout error:', error)
      showMessage({
        message: 'Booking failed',
        description: 'An unexpected error occurred. Please try again.',
        type: 'danger',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.navs}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" color={AppColors.blue} size={36} />
        </TouchableOpacity>
        <Text style={styles.title}>Class Session</Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <View style={styles.headerText}>
              <Text style={styles.className}>{session?.class_name || 'Class session'}</Text>
              <Text style={styles.priceLabel}>{priceLabel}</Text>
            </View>
            <View style={[styles.badge, isFree ? styles.freeBadge : styles.paidBadge]}>
              <Text style={styles.badgeText}>{isFree ? 'Free' : 'Paid'}</Text>
            </View>
          </View>

          {session?.class_description ? (
            <Text style={styles.description}>{session.class_description}</Text>
          ) : null}

          {location ? (
            <View style={styles.detailSection}>
              <Text style={styles.metaLabel}>Location</Text>
              <Text style={styles.detailValue}>{location}</Text>
            </View>
          ) : null}

          <View style={styles.metaGrid}>
            {sessionSummary.map((item) => (
              <View key={item.label} style={styles.metaItem}>
                <Text style={styles.metaLabel}>{item.label}</Text>
                <Text style={styles.metaValue}>{item.value}</Text>
              </View>
            ))}
          </View>

          {additionalNotes ? (
            <View style={styles.detailSection}>
              <Text style={styles.metaLabel}>Additional Notes</Text>
              <Text style={styles.detailValue}>{additionalNotes}</Text>
            </View>
          ) : null}

          {!isScheduled ? (
            <View style={styles.noticeBox}>
              <Text style={styles.noticeText}>This class is no longer scheduled.</Text>
            </View>
          ) : availableCapacity <= 0 ? (
            <View style={styles.noticeBox}>
              <Text style={styles.noticeText}>This class is full.</Text>
            </View>
          ) : null}
        </View>

        <TouchableOpacity
          style={[styles.bookBtn, !canBook && styles.bookBtnDisabled]}
          disabled={!canBook}
          activeOpacity={canBook ? 0.85 : 1}
          onPress={submitBooking}
        >
          {isSubmitting ? (
            <ActivityIndicator color={AppColors.white} />
          ) : (
            <Text style={styles.bookBtnText}>{isFree ? 'Book Class' : 'Pay & Book Class'}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

export default ClassSessionScreen

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
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: AppColors.white,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: AppColors.grey,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  headerText: {
    flex: 1,
  },
  className: {
    color: AppColors.blue,
    fontFamily: 'Montserrat',
    fontSize: 26,
    marginBottom: 8,
  },
  priceLabel: {
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
  freeBadge: {
    backgroundColor: AppColors.grey3,
  },
  paidBadge: {
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
    lineHeight: 22,
    marginTop: 14,
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 18,
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
    lineHeight: 20,
  },
  detailSection: {
    marginTop: 18,
    backgroundColor: AppColors.grey,
    borderRadius: 16,
    padding: 14,
  },
  detailValue: {
    color: AppColors.primary,
    fontFamily: 'Montserrat',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  noticeBox: {
    backgroundColor: AppColors.grey,
    borderRadius: 14,
    marginTop: 18,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: AppColors.blue,
  },
  noticeText: {
    color: AppColors.primary,
    fontFamily: 'Montserrat',
    fontSize: 14,
  },
  bookBtn: {
    backgroundColor: AppColors.blue,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    marginTop: 18,
    shadowColor: AppColors.primary,
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  bookBtnDisabled: {
    opacity: 0.5,
  },
  bookBtnText: {
    color: AppColors.white,
    fontFamily: 'Montserrat',
    fontSize: 16,
  },
})