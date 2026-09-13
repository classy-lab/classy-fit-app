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
    : `${price.toFixed(2)} ${String(session?.currency_code ?? '').toUpperCase()}`

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

    try {
      let accessToken = tokens.access_token
      let response = await performRequest(accessToken)

      if (response.status === 401 || response.status === 403) {
        const refreshedAccessToken = await refreshAccessToken()
        if (refreshedAccessToken) {
          accessToken = refreshedAccessToken
          response = await performRequest(accessToken)
        } else {
          showMessage({
            message: 'Session expired',
            description: 'Please sign in again.',
            type: 'danger',
          })
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

      showMessage({
        message: 'Payment successful',
        description: 'Your class booking payment has been submitted.',
        type: 'success',
      })
      navigation.navigate('ClassBookingSuccessScreen', {
        session,
        booking,
        payment,
        isPaid: true,
        idempotencyKey: responseBody?.idempotency_key,
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

          <View style={styles.metaGrid}>
            {sessionSummary.map((item) => (
              <View key={item.label} style={styles.metaItem}>
                <Text style={styles.metaLabel}>{item.label}</Text>
                <Text style={styles.metaValue}>{item.value}</Text>
              </View>
            ))}
          </View>

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
    backgroundColor: AppColors.white,
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
    backgroundColor: AppColors.grey,
    borderRadius: 20,
    padding: 18,
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
    fontSize: 24,
    marginBottom: 8,
  },
  priceLabel: {
    color: AppColors.primary,
    fontFamily: 'Montserrat',
    fontSize: 16,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  freeBadge: {
    backgroundColor: '#DCFCE7',
  },
  paidBadge: {
    backgroundColor: '#DBEAFE',
  },
  badgeText: {
    color: AppColors.blue,
    fontFamily: 'Montserrat',
    fontSize: 12,
  },
  description: {
    color: AppColors.primary,
    fontFamily: 'Montserrat',
    fontSize: 14,
    lineHeight: 21,
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
  noticeBox: {
    backgroundColor: '#FDE68A',
    borderRadius: 14,
    marginTop: 18,
    padding: 12,
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
