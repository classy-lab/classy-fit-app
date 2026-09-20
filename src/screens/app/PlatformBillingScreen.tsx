import { useCallback, useContext, useEffect, useRef, useState } from 'react'
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
import Feather from '@expo/vector-icons/Feather'
import { showMessage } from 'react-native-flash-message'
import { initStripe, useStripe } from '@stripe/stripe-react-native'
import { AppColors } from '../../styles/colors'
import { UserContext } from '../../context/UserContext'
import SignOut from '../../components/utils/SignOut'

type RefreshTokens = {
  access_token?: string
  refresh_token?: string
}

type UserContextValue = {
  user?: {
    gym_id?: number | string
    role?: string | null
  } | null
  tokens?: RefreshTokens | null
  setTokens: (
    value:
      | RefreshTokens
      | null
      | ((prev: RefreshTokens | null) => RefreshTokens | null)
  ) => void
  webServer: string
  stripePublishableKey: string
}

type PlatformBillingRecord = {
  uid: number
  gym_id: number
  billing_mode: string
  status: string
  platform_fee_amount: number | string
  currency_code: string
  stripe_customer_id: string
  stripe_subscription_id: string | null
  current_period_start: string | null
  current_period_end: string | null
  paid_through_at: string | null
  cancel_at_period_end: boolean | number
  canceled_at: string | null
  created_at: string | null
  updated_at: string | null
}

type PlatformBillingResponse = {
  status?: string
  billing?: PlatformBillingRecord | null
  message?: string
}

type PlatformBillingPaymentIntentResponse = {
  status?: string
  billing?: PlatformBillingRecord | null
  payment?: {
    payment_intent?: {
      client_secret?: string | null
    } | null
  } | null
  message?: string
}

type PaymentFlowResult =
  | { status: 'success' }
  | { status: 'cancelled' }
  | { status: 'error'; message: string }

const PLATFORM_FEE_LABEL = '$10.00 USD / month'
const PLATFORM_BILLING_URL_SCHEME = 'classyfit'

const formatDateTime = (value?: string | null) => {
  if (!value) {
    return 'Not available yet'
  }

  const normalized = value.includes('T') ? value : value.replace(' ', 'T')
  const parsed = new Date(normalized)
  if (Number.isNaN(parsed.getTime())) {
    return 'Not available yet'
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsed)
}

const formatLabel = (value?: string | null) => {
  const normalized = String(value ?? '').trim()
  if (!normalized) {
    return 'Unknown'
  }

  return normalized.charAt(0).toUpperCase() + normalized.slice(1).toLowerCase()
}

const readResponseBody = async <T extends Record<string, unknown>>(response: Response): Promise<T> => {
  const responseText = await response.text()
  if (!responseText) {
    return {} as T
  }

  try {
    return JSON.parse(responseText) as T
  } catch {
    return { message: responseText } as unknown as T
  }
}

const createPlatformBillingPaymentIdempotencyKey = (gymId: number | string) => {
  const randomSuffix = Math.random().toString(36).slice(2, 10)
  return `platform-billing-payment-${gymId}-${Date.now()}-${randomSuffix}`
}

const refreshAccessToken = async ({
  tokens,
  setTokens,
  webServer,
}: Pick<UserContextValue, 'tokens' | 'setTokens' | 'webServer'>): Promise<string | null> => {
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

  setTokens((prev) => ({
    ...prev,
    access_token: refreshObj.access_token,
    refresh_token: refreshObj.refresh_token,
  }))

  return refreshObj.access_token
}

const performAuthenticatedRequest = async (
  authContext: Pick<UserContextValue, 'tokens' | 'setTokens' | 'webServer'>,
  endpoint: string,
  init: RequestInit = {}
): Promise<Response | null> => {
  if (!authContext.tokens?.access_token) {
    return null
  }

  const requestWithToken = async (accessToken: string) => {
    return fetch(endpoint, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init.headers ?? {}),
        Authorization: `Bearer ${accessToken}`,
      },
    })
  }

  let accessToken = authContext.tokens.access_token
  let response = await requestWithToken(accessToken)

  if (response.status === 401 || response.status === 403) {
    const refreshedAccessToken = await refreshAccessToken(authContext)
    if (!refreshedAccessToken) {
      return response
    }

    accessToken = refreshedAccessToken
    response = await requestWithToken(accessToken)
  }

  return response
}

const PlatformBillingScreen = ({ navigation }: { navigation: { goBack: () => void } }) => {
  const { user, tokens, setTokens, webServer, stripePublishableKey } = useContext(UserContext) as UserContextValue
  const { initPaymentSheet, presentPaymentSheet } = useStripe()
  const [billing, setBilling] = useState<PlatformBillingRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [paymentNotice, setPaymentNotice] = useState<string | null>(null)
  const [gymStripeAccountId, setGymStripeAccountId] = useState<string | null>(null)
  const [paymentFlowStatusText, setPaymentFlowStatusText] = useState('Preparing secure payment...')
  const paymentAttemptBaselineRef = useRef<{
    paid_through_at: string | null
    status: string | null
    current_period_end: string | null
  } | null>(null)
  const paymentAttemptKeyRef = useRef<string | null>(null)
  const paymentAttemptInFlightRef = useRef(false)

  const isOwner = String(user?.role ?? '').trim().toLowerCase() === 'owner'

  const loadBilling = useCallback(
    async ({ isRefresh = false }: { isRefresh?: boolean } = {}): Promise<PlatformBillingRecord | null> => {
      if (!isOwner) {
        setErrorMessage('Only gym owners can view platform billing.')
        setBilling(null)
        setLoading(false)
        setRefreshing(false)
        return null
      }

      if (!user?.gym_id || !tokens?.access_token) {
        setErrorMessage('Please sign in again to view platform billing.')
        setBilling(null)
        setLoading(false)
        setRefreshing(false)
        return null
      }

      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      setErrorMessage('')

      const endpoint = `${webServer}/api/v1/gyms/${user.gym_id}/platform-billing`

      try {
        let response = await performAuthenticatedRequest(
          { tokens, setTokens, webServer },
          endpoint,
          { method: 'GET' }
        )
        if (!response) {
          setErrorMessage('Please sign in again to view platform billing.')
          setBilling(null)
          return null
        }

        let responseBody = await readResponseBody<PlatformBillingResponse>(response)

        if (response.status === 404) {
          const initializeResponse = await performAuthenticatedRequest(
            { tokens, setTokens, webServer },
            endpoint,
            { method: 'POST' }
          )

          if (!initializeResponse) {
            setErrorMessage('Unable to initialize platform billing. Please sign in again.')
            setBilling(null)
            return null
          }

          response = initializeResponse
          responseBody = await readResponseBody<PlatformBillingResponse>(response)
        }

        if (response.status !== 200 && response.status !== 201) {
          const message = responseBody?.message || 'Unable to load platform billing.'
          setErrorMessage(message)
          setBilling(null)
          showMessage({
            message: 'Platform billing unavailable',
            description: message,
            type: 'danger',
          })
          return null
        }

        const nextBilling = responseBody?.billing ?? null
        if (!nextBilling) {
          setErrorMessage('Platform billing data is not available yet.')
          setBilling(null)
          return null
        }

        setBilling(nextBilling)
        return nextBilling
      } catch {
        const message = 'Failed to load platform billing.'
        setErrorMessage(message)
        setBilling(null)
        showMessage({
          message: 'Platform billing unavailable',
          description: message,
          type: 'danger',
        })
        return null
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [isOwner, setTokens, tokens, user?.gym_id, webServer]
  )

  const loadGymStripeAccountContext = useCallback(async () => {
    if (!user?.gym_id || !tokens?.access_token) {
      setGymStripeAccountId(null)
      return
    }

    const response = await performAuthenticatedRequest(
      { tokens, setTokens, webServer },
      `${webServer}/api/v1/gyms/${user.gym_id}/stripe/account-context`,
      { method: 'GET' }
    )

    if (!response || (response.status !== 200 && response.status !== 201)) {
      setGymStripeAccountId(null)
      return
    }

    const responseBody = await readResponseBody<{
      account?: {
        stripe_account_id?: string | null
      } | null
    }>(response)
    setGymStripeAccountId(String(responseBody?.account?.stripe_account_id ?? '').trim() || null)
  }, [setTokens, tokens, user?.gym_id, webServer])

  const onRefresh = useCallback(() => {
    void loadBilling({ isRefresh: true })
  }, [loadBilling])

  useFocusEffect(
    useCallback(() => {
      void loadBilling()
      void loadGymStripeAccountContext()
    }, [loadBilling, loadGymStripeAccountContext])
  )

  useEffect(() => {
    if (!paymentNotice) {
      return
    }

    const previousBaseline = paymentAttemptBaselineRef.current
    const nextBaseline = {
      paid_through_at: billing?.paid_through_at ?? null,
      status: billing?.status ?? null,
      current_period_end: billing?.current_period_end ?? null,
    }

    if (
      previousBaseline &&
      (nextBaseline.paid_through_at !== previousBaseline.paid_through_at ||
        nextBaseline.status !== previousBaseline.status ||
        nextBaseline.current_period_end !== previousBaseline.current_period_end)
    ) {
      setPaymentNotice(null)
      paymentAttemptKeyRef.current = null
    }
  }, [billing?.current_period_end, billing?.paid_through_at, billing?.status, paymentNotice])

  const startManualPayment = useCallback(async () => {
    if (!billing || billing.billing_mode !== 'manual') {
      return
    }

    if (isProcessingPayment || paymentAttemptInFlightRef.current) {
      return
    }

    if (!user?.gym_id) {
      showMessage({
        message: 'Payment unavailable',
        description: 'Please sign in again to continue.',
        type: 'danger',
      })
      return
    }

    if (!stripePublishableKey || stripePublishableKey === 'pk_test_placeholder') {
      showMessage({
        message: 'Payment unavailable',
        description: 'Stripe configuration is not available.',
        type: 'danger',
      })
      return
    }

    if (!gymStripeAccountId) {
      showMessage({
        message: 'Payment unavailable',
        description: 'The gym Stripe account is not available right now.',
        type: 'danger',
      })
      return
    }

    if (!paymentAttemptKeyRef.current) {
      paymentAttemptKeyRef.current = createPlatformBillingPaymentIdempotencyKey(user.gym_id)
    }

    paymentAttemptInFlightRef.current = true
    paymentAttemptBaselineRef.current = {
      paid_through_at: billing.paid_through_at ?? null,
      status: billing.status ?? null,
      current_period_end: billing.current_period_end ?? null,
    }
    setPaymentNotice(null)
    setIsProcessingPayment(true)
    setPaymentFlowStatusText('Opening Classy Fit payment sheet...')

    let paymentOutcome: 'success' | 'cancelled' | 'error' = 'error'
    let paymentErrorMessage = 'Unable to start platform billing payment.'
    let didCancelPayment = false
    let restoreErrorMessage: string | null = null

    try {
      await initStripe({
        publishableKey: stripePublishableKey,
        urlScheme: PLATFORM_BILLING_URL_SCHEME,
      })

      setPaymentFlowStatusText('Creating payment request...')
      const paymentIntentResponse = await performAuthenticatedRequest(
        { tokens, setTokens, webServer },
        `${webServer}/api/v1/gyms/${user.gym_id}/platform-billing/payment-intent`,
        {
          method: 'POST',
          headers: {
            'Idempotency-Key': paymentAttemptKeyRef.current,
          },
          body: JSON.stringify({}),
        }
      )

      if (!paymentIntentResponse) {
        paymentOutcome = 'error'
        paymentErrorMessage = 'Please sign in again to continue.'
        return
      }

      const paymentIntentBody = await readResponseBody<PlatformBillingPaymentIntentResponse>(paymentIntentResponse)

      if (paymentIntentResponse.status !== 200 && paymentIntentResponse.status !== 201) {
        paymentOutcome = 'error'
        paymentErrorMessage = paymentIntentBody?.message || 'Unable to start platform billing payment.'
        return
      }

      const clientSecret = paymentIntentBody?.payment?.payment_intent?.client_secret ?? null
      if (!clientSecret) {
        paymentOutcome = 'error'
        paymentErrorMessage = 'Payment initialization failed. Please try again.'
        return
      }

      setPaymentFlowStatusText('Presenting payment sheet...')
      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: 'Classy Fit',
        style: 'alwaysDark',
        returnURL: 'classyfit://stripe-redirect',
      })

      if (initError) {
        paymentOutcome = 'error'
        paymentErrorMessage = initError.message || 'Unable to initialize payment sheet.'
        return
      }

      const { error: presentError, didCancel } = await presentPaymentSheet()
      if (didCancel || presentError?.code === 'Canceled') {
        didCancelPayment = true
        return
      }

      if (presentError) {
        paymentOutcome = 'error'
        paymentErrorMessage = presentError.message || 'The payment could not be processed.'
        return
      }

      paymentOutcome = 'success'
    } catch (error) {
      paymentOutcome = 'error'
      paymentErrorMessage = error instanceof Error ? error.message : 'An unexpected payment error occurred.'
    } finally {
      try {
        await initStripe({
          publishableKey: stripePublishableKey,
          stripeAccountId: gymStripeAccountId,
          urlScheme: PLATFORM_BILLING_URL_SCHEME,
        })
      } catch (restoreError) {
        restoreErrorMessage =
          restoreError instanceof Error
            ? restoreError.message
            : 'Unable to restore the gym Stripe configuration.'
      }
    }

    paymentAttemptInFlightRef.current = false
    setIsProcessingPayment(false)

    if (restoreErrorMessage) {
      showMessage({
        message: 'Stripe configuration unavailable',
        description: restoreErrorMessage,
        type: 'danger',
      })
      return
    }

    if (didCancelPayment) {
      return
    }

    if (paymentOutcome === 'error') {
      showMessage({
        message: 'Payment failed',
        description: paymentErrorMessage,
        type: 'danger',
      })
      return
    }

    showMessage({
      message: 'Payment submitted',
      description: 'Your platform billing payment is being confirmed by Stripe.',
      type: 'success',
    })

    setPaymentNotice('Payment submitted. Waiting for Stripe confirmation...')
    const refreshedBilling = await loadBilling({ isRefresh: true })
    const previousBaseline = paymentAttemptBaselineRef.current
    const nextBaseline = {
      paid_through_at: refreshedBilling?.paid_through_at ?? null,
      status: refreshedBilling?.status ?? null,
      current_period_end: refreshedBilling?.current_period_end ?? null,
    }

    if (
      previousBaseline &&
      (nextBaseline.paid_through_at !== previousBaseline.paid_through_at ||
        nextBaseline.status !== previousBaseline.status ||
        nextBaseline.current_period_end !== previousBaseline.current_period_end)
    ) {
      setPaymentNotice(null)
      paymentAttemptKeyRef.current = null
    }
  }, [
    billing,
    gymStripeAccountId,
    initPaymentSheet,
    isProcessingPayment,
    loadBilling,
    paymentFlowStatusText,
    presentPaymentSheet,
    setTokens,
    stripePublishableKey,
    tokens,
    user?.gym_id,
    webServer,
  ])

  const billingMode = formatLabel(billing?.billing_mode)
  const billingStatus = formatLabel(billing?.status)
  const hasBilling = billing !== null
  const showManualPayment = hasBilling && String(billing?.billing_mode ?? '').trim().toLowerCase() === 'manual'

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.navs}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" color={AppColors.blue} size={36} />
        </TouchableOpacity>
        <SignOut />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        alwaysBounceVertical
        bounces
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={AppColors.blue} />}
      >
        <View style={styles.headingContainer}>
          <Text style={styles.title}>Platform Billing</Text>
          <Text style={styles.subtitle}>{PLATFORM_FEE_LABEL}</Text>
        </View>

        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color={AppColors.blue} />
            <Text style={styles.stateText}>Loading platform billing...</Text>
          </View>
        ) : errorMessage ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Unable to load platform billing</Text>
            <Text style={styles.errorText}>{errorMessage}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => void loadBilling()}>
              <Text style={styles.retryBtnText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : !hasBilling ? (
          <View style={styles.centerState}>
            <Text style={styles.emptyTitle}>Platform billing is not ready yet</Text>
            <Text style={styles.stateText}>Please pull to refresh or try again.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {paymentNotice ? (
              <View style={styles.noticeCard}>
                <Feather name="clock" color={AppColors.blue} size={18} />
                <Text style={styles.noticeText}>{paymentNotice}</Text>
              </View>
            ) : null}

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderText}>
                  <Text style={styles.cardTitle}>Platform Billing</Text>
                  <Text style={styles.cardSubtitle}>{PLATFORM_FEE_LABEL}</Text>
                </View>
                <View style={styles.badges}>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{billingMode}</Text>
                  </View>
                  <View style={[styles.badge, styles.statusBadge]}>
                    <Text style={styles.badgeText}>{billingStatus}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Billing Mode</Text>
                  <Text style={styles.metaValue}>{billingMode}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Billing Status</Text>
                  <Text style={styles.metaValue}>{billingStatus}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Paid Through</Text>
                  <Text style={styles.metaValue}>{formatDateTime(billing.paid_through_at)}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Current Period Start</Text>
                  <Text style={styles.metaValue}>{formatDateTime(billing.current_period_start)}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Current Period End</Text>
                  <Text style={styles.metaValue}>{formatDateTime(billing.current_period_end)}</Text>
                </View>
              </View>

              {showManualPayment ? (
                <View style={styles.paymentSection}>
                  <Text style={styles.paymentSectionTitle}>Manual payment required</Text>
                  <Text style={styles.paymentSectionText}>
                    Pay the current $10.00 platform fee to Classy Fit using the platform Stripe account.
                  </Text>

                  <TouchableOpacity
                    style={[styles.payBtn, (isProcessingPayment || !gymStripeAccountId) && styles.payBtnDisabled]}
                    onPress={startManualPayment}
                    disabled={isProcessingPayment || !gymStripeAccountId}
                    activeOpacity={isProcessingPayment || !gymStripeAccountId ? 1 : 0.85}
                  >
                    {isProcessingPayment ? (
                      <ActivityIndicator color={AppColors.white} />
                    ) : (
                      <Text style={styles.payBtnText}>Pay $10.00</Text>
                    )}
                  </TouchableOpacity>
                </View>
              ) : null}

              <View style={styles.noteBox}>
                <Text style={styles.noteText}>
                  This screen shows the current platform-billing state. Payment updates are confirmed by Stripe webhooks.
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {isProcessingPayment ? (
        <View style={styles.paymentOverlay} pointerEvents="auto">
          <View style={styles.paymentOverlayCard}>
            <ActivityIndicator size="large" color={AppColors.blue} />
            <Text style={styles.paymentOverlayTitle}>Starting payment</Text>
            <Text style={styles.paymentOverlayText}>{paymentFlowStatusText}</Text>
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  )
}

export default PlatformBillingScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.white,
  },
  navs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 6,
  },
  backBtn: {
    paddingRight: 8,
    paddingVertical: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 28,
  },
  headingContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    color: AppColors.blue,
    fontSize: 28,
    fontFamily: 'Montserrat',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 8,
    color: AppColors.grey3,
    fontSize: 15,
    textAlign: 'center',
  },
  centerState: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Montserrat',
    color: AppColors.blue,
    textAlign: 'center',
  },
  stateText: {
    marginTop: 12,
    fontSize: 16,
    color: AppColors.grey3,
    textAlign: 'center',
    lineHeight: 22,
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
    fontFamily: 'Montserrat',
    color: AppColors.blue,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: AppColors.grey3,
    marginBottom: 12,
    lineHeight: 20,
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
    fontFamily: 'Montserrat',
    fontSize: 14,
  },
  list: {
    gap: 14,
  },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F3F8FF',
    borderColor: '#D6E7FF',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
  },
  noticeText: {
    flex: 1,
    color: AppColors.blue,
    fontSize: 14,
    lineHeight: 20,
  },
  card: {
    backgroundColor: AppColors.white,
    borderRadius: 18,
    padding: 18,
    borderColor: AppColors.grey,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 12,
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: 'Montserrat',
    color: AppColors.blue,
    lineHeight: 24,
  },
  cardSubtitle: {
    marginTop: 4,
    color: AppColors.grey3,
    fontSize: 14,
    lineHeight: 20,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 8,
  },
  badge: {
    backgroundColor: AppColors.blue,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statusBadge: {
    backgroundColor: AppColors.grey3,
  },
  badgeText: {
    color: AppColors.white,
    fontSize: 12,
  },
  metaRow: {
    gap: 12,
    marginTop: 10,
  },
  metaItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
  },
  metaLabel: {
    flex: 1,
    fontSize: 13,
    color: AppColors.grey3,
  },
  metaValue: {
    flex: 1,
    fontSize: 13,
    color: AppColors.blue,
    textAlign: 'right',
  },
  paymentSection: {
    marginTop: 18,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#F8FAFF',
    borderWidth: 1,
    borderColor: '#D6E7FF',
    gap: 10,
  },
  paymentSectionTitle: {
    color: AppColors.blue,
    fontFamily: 'Montserrat',
    fontSize: 16,
  },
  paymentSectionText: {
    color: AppColors.grey3,
    fontSize: 14,
    lineHeight: 20,
  },
  payBtn: {
    marginTop: 4,
    backgroundColor: AppColors.blue,
    borderRadius: 999,
    alignSelf: 'flex-start',
    paddingHorizontal: 18,
    paddingVertical: 12,
    minWidth: 136,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payBtnDisabled: {
    opacity: 0.7,
  },
  payBtnText: {
    color: AppColors.white,
    fontFamily: 'Montserrat',
    fontSize: 14,
  },
  noteBox: {
    marginTop: 18,
    backgroundColor: '#F6F6F6',
    borderRadius: 14,
    padding: 14,
  },
  noteText: {
    color: AppColors.grey3,
    fontSize: 13,
    lineHeight: 19,
  },
  paymentOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  paymentOverlayCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: AppColors.white,
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: AppColors.grey,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  paymentOverlayTitle: {
    marginTop: 14,
    color: AppColors.blue,
    fontFamily: 'Montserrat',
    fontSize: 16,
    textAlign: 'center',
  },
  paymentOverlayText: {
    marginTop: 8,
    color: AppColors.grey3,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
})
