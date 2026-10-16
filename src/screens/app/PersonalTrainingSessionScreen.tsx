import { useCallback, useContext, useRef, useState } from 'react'
import {
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import { Feather } from '@expo/vector-icons'
import { useStripe } from '@stripe/stripe-react-native'
import { showMessage } from 'react-native-flash-message'
import { AppColors } from '../../styles/colors'
import { formatUsd } from '../../utils/currency'
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

type PersonalTrainingSessionRecord = {
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
}

type PersonalTrainingBookingRecord = {
  booking_uid?: number
  uid?: number
  trainer_display_name?: string | null
  price?: number | string | null
  currency_code?: string | null
  booking_status?: string | null
  payment_status?: string | null
  location?: string | null
  start_at?: string | null
  end_at?: string | null
}

type PersonalTrainingSessionNavigation = {
  goBack: () => void
  navigate: (
    screen: 'PersonalTrainingBookingSuccessScreen',
    params: {
      session?: PersonalTrainingSessionRecord | null
      booking?: PersonalTrainingBookingRecord | null
      payment?: {
        payment_intent?: {
          client_secret?: string | null
        } | null
      } | null
      isPaid?: boolean
      idempotencyKey?: string
    }
  ) => void
}

type PersonalTrainingSessionRoute = {
  params?: {
    sessionUid?: number | string
    session?: PersonalTrainingSessionRecord | null
  } | null
}

type LoadSessionResponse = {
  session?: PersonalTrainingSessionRecord | null
  message?: string
}

type LoadBookingResponse = {
  booking?: PersonalTrainingBookingRecord | null
  payment?: {
    payment_intent?: {
      client_secret?: string | null
    } | null
  } | null
  idempotency_key?: string
  message?: string
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

const generateIdempotencyKey = (sessionUid: string) => {
  const random = Math.random().toString(36).slice(2, 10)
  return `pt-booking-${sessionUid}-${Date.now()}-${random}`
}

const parseResponseBody = async <T extends object>(response: Response): Promise<T | { message?: string }> => {
  const responseText = await response.text()
  if (!responseText) {
    return {}
  }

  try {
    return JSON.parse(responseText) as T
  } catch {
    return { message: responseText }
  }
}

const PersonalTrainingSessionScreen = ({
  navigation,
  route,
}: {
  navigation: PersonalTrainingSessionNavigation
  route: PersonalTrainingSessionRoute
}) => {
  const { user, tokens, setTokens, webServer } = useContext(UserContext) as UserContextValue
  const { initPaymentSheet, presentPaymentSheet } = useStripe()
  const sessionUid = String(route?.params?.sessionUid ?? route?.params?.session?.session_uid ?? '').trim()
  const initialSession = route?.params?.session ?? null
  const bookingAttemptKeyRef = useRef<string | null>(null)
  const [session, setSession] = useState<PersonalTrainingSessionRecord | null>(initialSession)
  const [loading, setLoading] = useState(!initialSession)
  const [refreshing, setRefreshing] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const requestWithRefresh = async (
    endpoint: string,
    init = {} as RequestInit,
    debugStage: 'session-load' | 'booking' | 'checkout' | 'reconciliation' = 'session-load'
  ) => {
    const accessToken = String(tokens?.access_token ?? '').trim()

    if (!accessToken) {
      return null
    }

    const performRequest = (token: string) => {
      const headers = new Headers(init.headers ?? undefined)
      headers.set('Authorization', `Bearer ${token}`)

      return fetch(endpoint, {
        ...init,
        headers,
      })
    }

    let response = await performRequest(accessToken)
    if (debugStage === 'booking') {
      console.log('PT_AUTH booking request', { hasAccessToken: Boolean(accessToken) })
      console.log('PT_AUTH booking response', { status: response.status, ok: response.ok })
    } else if (debugStage === 'checkout') {
      console.log('PT_AUTH checkout request', { hasAccessToken: Boolean(accessToken) })
      console.log('PT_AUTH checkout response', { status: response.status, ok: response.ok })
    } else if (debugStage === 'session-load') {
      console.log('PT_AUTH session-load response', { status: response.status, ok: response.ok })
    } else if (debugStage === 'reconciliation') {
      console.log('PT_AUTH reconciliation response', { status: response.status, ok: response.ok })
    }

    if (await shouldRefreshAuthResponse(response)) {
      if (debugStage === 'booking') {
        console.log('PT_AUTH booking refresh started', { hasRefreshToken: Boolean(tokens?.refresh_token) })
      } else if (debugStage === 'checkout') {
        console.log('PT_AUTH checkout refresh started', { hasRefreshToken: Boolean(tokens?.refresh_token) })
      } else if (debugStage === 'session-load') {
        console.log('PT_AUTH session-load refresh started', { hasRefreshToken: Boolean(tokens?.refresh_token) })
      } else if (debugStage === 'reconciliation') {
        console.log('PT_AUTH reconciliation refresh started', { hasRefreshToken: Boolean(tokens?.refresh_token) })
      }

      const refreshedAccessToken = await refreshAccessToken({
        refreshToken: tokens?.refresh_token ?? null,
        webServer,
        setTokens,
      })

      if (!refreshedAccessToken) {
        return null
      }

      response = await performRequest(refreshedAccessToken)
    }

    return response
  }

  const loadSession = async ({ isRefresh = false }: { isRefresh?: boolean } = {}) => {
    if (!sessionUid || !user?.gym_id || !tokens?.access_token) {
      setErrorMessage('Unable to load personal training session.')
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

    const endpoint = `${webServer}/api/v1/personal-training/sessions/${sessionUid}`
    try {
      const response = await requestWithRefresh(endpoint, {}, 'session-load')

      if (!response) {
        console.log('PT_AUTH SESSION_EXPIRED', { stage: 'session-load' })
        setErrorMessage('Your session expired. Please sign in again.')
        setSession(null)
        return
      }

      const responseBody = (await parseResponseBody(response)) as LoadSessionResponse

      if (!response.ok) {
        const message = responseBody?.message || 'Unable to load personal training session.'
        setErrorMessage(message)
        setSession(null)
        showMessage({
          message: 'Personal training unavailable',
          description: message,
          type: 'danger',
        })
        return
      }

      setSession(responseBody?.session ?? null)
    } catch (error) {
      const message = 'Failed to load personal training session.'
      setErrorMessage(message)
      setSession(null)
      showMessage({
        message: 'Personal training unavailable',
        description: message,
        type: 'danger',
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useFocusEffect(
    useCallback(() => {
      void loadSession()
    }, [sessionUid, tokens?.access_token, tokens?.refresh_token, user?.gym_id, webServer])
  )

  const isRefreshable = !loading && !!sessionUid
  const onRefresh = () => {
    if (isRefreshable) {
      void loadSession({ isRefresh: true })
    }
  }

  const sessionStatus = String(session?.status ?? '').toLowerCase()
  const startDate = parseDate(session?.start_at)
  const isInPast = startDate ? startDate.getTime() <= Date.now() : false
  const isBookable = sessionStatus === 'scheduled' && !isInPast && session?.is_available !== false
  const price = Number(session?.price ?? 0)
  const isFree = price <= 0
  const priceLabel = isFree
    ? 'Free'
    : formatUsd(price)
  const location = String(session?.location ?? '').trim()
  const additionalNotes = String(session?.additional_notes ?? '').trim()
  const bookingButtonLabel = isFree ? 'Book Session' : 'Pay & Book Session'
  const trainerName = String(session?.trainer_display_name ?? '').trim()

  const submitBooking = async () => {
    if (!sessionUid || !user?.gym_id || !tokens?.access_token) {
      showMessage({
        message: 'Booking unavailable',
        description: 'Please sign in again and try once more.',
        type: 'danger',
      })
      return
    }

    if (!isBookable) {
      showMessage({
        message: 'Session unavailable',
        description: 'This personal training session is not available for booking.',
        type: 'danger',
      })
      return
    }

    if (!bookingAttemptKeyRef.current) {
      bookingAttemptKeyRef.current = generateIdempotencyKey(sessionUid)
    }

    const idempotencyKey = bookingAttemptKeyRef.current
    setIsSubmitting(true)

    const bookingEndpoint = `${webServer}/api/v1/personal-training/sessions/${sessionUid}/book`

    try {
      const bookingResponse = await requestWithRefresh(bookingEndpoint, {
        method: 'POST',
        headers: {
          'Idempotency-Key': idempotencyKey,
        },
      }, 'booking')

      if (!bookingResponse) {
        console.log('PT_AUTH SESSION_EXPIRED', { stage: 'booking' })
        showMessage({
          message: 'Session expired',
          description: 'Please sign in again.',
          type: 'danger',
        })
        return
      }

      const bookingResponseBody = (await parseResponseBody<LoadBookingResponse>(bookingResponse)) as LoadBookingResponse

      if (!bookingResponse.ok) {
        const message = bookingResponseBody?.message || 'Unable to book this session.'
        showMessage({
          message: 'Booking failed',
          description: message,
          type: 'danger',
        })
        return
      }

      const booking = bookingResponseBody?.booking
      const bookingUid = Number(booking?.booking_uid ?? 0)

      if (!bookingUid) {
        showMessage({
          message: 'Booking failed',
          description: 'Unable to load booking details. Please try again.',
          type: 'danger',
        })
        return
      }

      const checkoutEndpoint = `${webServer}/api/v1/personal-training/bookings/${bookingUid}/checkout`
      const checkoutResponse = await requestWithRefresh(checkoutEndpoint, {
        method: 'POST',
        headers: {
          'Idempotency-Key': idempotencyKey,
        },
      }, 'checkout')

      if (!checkoutResponse) {
        console.log('PT_AUTH SESSION_EXPIRED', { stage: 'checkout' })
        showMessage({
          message: 'Session expired',
          description: 'Please sign in again.',
          type: 'danger',
        })
        return
      }

      const checkoutResponseBodyDebug = (await parseResponseBody<LoadBookingResponse>(checkoutResponse.clone())) as LoadBookingResponse
      console.log('PT_AUTH checkout response body', {
        message: checkoutResponseBodyDebug?.message,
        error: (checkoutResponseBodyDebug as { error?: unknown })?.error,
        code: (checkoutResponseBodyDebug as { code?: unknown })?.code,
        status: (checkoutResponseBodyDebug as { status?: unknown })?.status,
        body: checkoutResponseBodyDebug,
      })

      let checkoutResponseBody = (await parseResponseBody<LoadBookingResponse>(checkoutResponse)) as LoadBookingResponse

      if (!checkoutResponse.ok) {
        const message = checkoutResponseBody?.message || 'Unable to complete this booking.'
        showMessage({
          message: 'Booking failed',
          description: message,
          type: 'danger',
        })
        return
      }

      const checkoutBooking = checkoutResponseBody?.booking ?? booking
      const checkoutPayment = checkoutResponseBody?.payment ?? null

      if (isFree) {
        showMessage({
          message: 'Booking successful',
          description: 'Your personal training session has been booked successfully.',
          type: 'success',
        })
        navigation.navigate('PersonalTrainingBookingSuccessScreen', {
          session,
          booking: checkoutBooking,
          payment: checkoutPayment,
          isPaid: false,
          idempotencyKey: bookingResponseBody?.idempotency_key ?? idempotencyKey,
        })
        return
      }

      const clientSecret = checkoutPayment?.payment_intent?.client_secret
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
        console.log('Personal Training Payment Sheet init error:', initError)
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
          return
        }

        console.log('Personal Training Payment Sheet error:', presentError)
        showMessage({
          message: 'Payment failed',
          description: presentError.message || 'The payment could not be processed. Please try again.',
          type: 'danger',
        })
        return
      }

      const reconciliationResponse = await requestWithRefresh(checkoutEndpoint, {
        method: 'POST',
        headers: {
          'Idempotency-Key': idempotencyKey,
        },
      }, 'reconciliation')

      if (reconciliationResponse?.ok) {
        checkoutResponseBody = (await parseResponseBody<LoadBookingResponse>(reconciliationResponse)) as LoadBookingResponse
      }

      const reconciledBooking = checkoutResponseBody?.booking ?? checkoutBooking
      const reconciledPayment = checkoutResponseBody?.payment ?? checkoutPayment

      showMessage({
        message: 'Payment successful',
        description: 'Your personal training booking payment has been submitted.',
        type: 'success',
      })
      navigation.navigate('PersonalTrainingBookingSuccessScreen', {
        session,
        booking: reconciledBooking,
        payment: reconciledPayment,
        isPaid: true,
        idempotencyKey: checkoutResponseBody?.idempotency_key ?? bookingResponseBody?.idempotency_key ?? idempotencyKey,
      })
    } catch (error) {
      console.log('Personal training booking checkout error:', error)
      showMessage({
        message: 'Booking failed',
        description: 'An unexpected error occurred. Please try again.',
        type: 'danger',
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  const showUnavailable = !loading && !errorMessage && !isBookable

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
            <Text style={styles.stateText}>Loading personal training session...</Text>
          </View>
        ) : errorMessage ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Unable to load session</Text>
            <Text style={styles.errorText}>{errorMessage}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => loadSession()}>
              <Text style={styles.retryBtnText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : !session ? (
          <View style={styles.centerState}>
            <Text style={styles.emptyTitle}>Session not found</Text>
          </View>
        ) : (
          <View style={styles.card}>
            <View style={styles.headerRow}>
              <View style={styles.headerText}>
                <Text style={styles.sessionName}>{getMemberPersonalTrainingTitle(trainerName)}</Text>
                <Text style={styles.priceLabel}>{priceLabel}</Text>
              </View>
              <View style={[styles.badge, isFree ? styles.freeBadge : styles.paidBadge]}>
                <Text style={styles.badgeText}>{isFree ? 'Free' : 'Paid'}</Text>
              </View>
            </View>

            {session?.status ? (
              <View style={styles.statusRow}>
                <Text style={styles.metaLabel}>Status</Text>
                <Text style={styles.metaValue}>{String(session.status).charAt(0).toUpperCase() + String(session.status).slice(1)}</Text>
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
            </View>

            {location ? (
              <View style={styles.detailSection}>
                <Text style={styles.metaLabel}>Location</Text>
                <Text style={styles.detailValue}>{location}</Text>
              </View>
            ) : null}

            {additionalNotes ? (
              <View style={styles.detailSection}>
                <Text style={styles.metaLabel}>Additional Notes</Text>
                <Text style={styles.detailValue}>{additionalNotes}</Text>
              </View>
            ) : null}

            {showUnavailable ? (
              <View style={styles.noticeBox}>
                <Text style={styles.noticeText}>This session is no longer available for booking.</Text>
              </View>
            ) : null}
          </View>
        )}

        {!loading && !errorMessage && session ? (
          <TouchableOpacity
            style={[styles.bookBtn, (!isBookable || isSubmitting) && styles.bookBtnDisabled]}
            disabled={!isBookable || isSubmitting}
            activeOpacity={isBookable && !isSubmitting ? 0.85 : 1}
            onPress={submitBooking}
          >
            {isSubmitting ? (
              <ActivityIndicator color={AppColors.white} />
            ) : (
              <Text style={styles.bookBtnText}>{bookingButtonLabel}</Text>
            )}
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  )
}

export default PersonalTrainingSessionScreen

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
  card: {
    backgroundColor: AppColors.white,
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    borderColor: AppColors.grey,
    borderWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  headerText: {
    flex: 1,
  },
  sessionName: {
    fontSize: 18,
    color: AppColors.blue,
    marginBottom: 4,
    fontFamily: 'Montserrat',
  },
  priceLabel: {
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
  freeBadge: {
    backgroundColor: '#38a169',
  },
  paidBadge: {
    backgroundColor: AppColors.blue,
  },
  badgeText: {
    color: AppColors.white,
    fontSize: 12,
    fontFamily: 'Montserrat',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  metaGrid: {
    marginTop: 4,
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
  detailSection: {
    marginTop: 10,
  },
  detailValue: {
    marginTop: 4,
    fontSize: 13,
    color: AppColors.primary,
    fontFamily: 'Montserrat',
    lineHeight: 20,
  },
  noticeBox: {
    marginTop: 14,
    backgroundColor: AppColors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: AppColors.grey,
    padding: 14,
  },
  noticeText: {
    color: AppColors.grey3,
    fontFamily: 'Montserrat',
    textAlign: 'center',
  },
  bookBtn: {
    marginTop: 8,
    backgroundColor: AppColors.blue,
    borderRadius: 999,
    minHeight: 50,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookBtnDisabled: {
    opacity: 0.55,
  },
  bookBtnText: {
    color: AppColors.white,
    fontFamily: 'Montserrat',
    fontSize: 16,
  },
})