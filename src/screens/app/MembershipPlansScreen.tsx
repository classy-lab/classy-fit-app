import { useCallback, useContext, useRef, useState } from 'react'
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
import { useStripe } from '@stripe/stripe-react-native'
import { showMessage } from 'react-native-flash-message'
import { AppColors } from '../../styles/colors'
import { formatUsd } from '../../utils/currency'
import { UserContext } from '../../context/UserContext'

const normalizeToken = (value) => String(value ?? '').trim()

const refreshAccessTokenWithRefresh = async ({
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

const performAuthenticatedRequestWithRefresh = async ({
  endpoint,
  init = {} as RequestInit,
  accessToken,
  refreshToken,
  webServer,
  setTokens,
}) => {
  const requestAccessToken = normalizeToken(accessToken)
  if (!requestAccessToken) {
    return null
  }

  const requestWithToken = async (token) => {
    const headers = new Headers(init.headers ?? undefined)
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json')
    }
    headers.set('Authorization', `Bearer ${token}`)

    return fetch(endpoint, {
      ...init,
      headers,
    })
  }

  const response = await requestWithToken(requestAccessToken)
  if (response.ok) {
    return response
  }

  console.log('Access token expired, requesting new one - performAuthenticatedRequestWithRefresh()')
  const refreshedAccessToken = await refreshAccessTokenWithRefresh({
    refreshToken,
    webServer,
    setTokens,
  })

  if (!refreshedAccessToken) {
    return response
  }

  const retryResponse = await requestWithToken(refreshedAccessToken)
  return retryResponse
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

type MembershipPlanStatus = 'active' | 'inactive' | string

type MembershipPlan = {
  uid: number
  gym_id: number
  name: string
  description: string | null
  duration_months: number
  price: number | string
  currency_code: string
  status: MembershipPlanStatus
  created_at: string | null
  updated_at: string | null
}

type MembershipPlansResponse = {
  status?: string
  data?: MembershipPlan[]
  message?: string
}

type MembershipPurchaseMembership = {
  uid?: number
  gym_id?: number
  member_gym_user_id?: number
  membership_plan_uid?: number
  plan_name?: string | null
  duration_months?: number | string | null
  price?: number | string | null
  currency_code?: string | null
  start_at?: string | null
  end_at?: string | null
  status?: string | null
  created_at?: string | null
  updated_at?: string | null
}

type MembershipPurchaseResponse = {
  status?: string
  message?: string
  membership?: MembershipPurchaseMembership | null
  payment?: {
    payment_intent?: {
      client_secret?: string | null
    } | null
  } | null
  idempotency_key?: string
}

type MembershipPurchaseSuccessParams = {
  membership?: MembershipPurchaseMembership | null
  isPaid?: boolean
  idempotencyKey?: string
}

type MembershipPlansNavigation = {
  goBack: () => void
  navigate: (
    screen: 'MembershipPurchaseSuccessScreen',
    params: MembershipPurchaseSuccessParams
  ) => void
}

const durationOrder: Record<number, number> = {
  1: 0,
  3: 1,
  6: 2,
  12: 3,
}

const durationLabels: Record<number, string> = {
  1: '1 Month',
  3: '3 Months',
  6: '6 Months',
  12: '12 Months',
}

const sortMembershipPlans = (plans: MembershipPlan[]) => {
  return [...plans].sort((left, right) => {
    const leftDuration = Number(left?.duration_months ?? 0)
    const rightDuration = Number(right?.duration_months ?? 0)
    const leftRank = durationOrder[leftDuration] ?? 100 + leftDuration
    const rightRank = durationOrder[rightDuration] ?? 100 + rightDuration

    if (leftRank !== rightRank) {
      return leftRank - rightRank
    }

    return String(left?.name ?? '').localeCompare(String(right?.name ?? ''))
  })
}

const formatDurationLabel = (durationMonths?: number | string | null) => {
  const duration = Number(durationMonths ?? 0)
  if (durationLabels[duration]) {
    return durationLabels[duration]
  }

  if (duration > 0) {
    return `${duration} Months`
  }

  return 'Unknown duration'
}

const formatPlanPrice = (plan: MembershipPlan) => formatUsd(plan?.price)

const MembershipPlansScreen = ({ navigation }: { navigation: MembershipPlansNavigation }) => {
  const { user, tokens, setTokens, webServer } = useContext(UserContext) as UserContextValue
  const { initPaymentSheet, presentPaymentSheet } = useStripe()
  const [plans, setPlans] = useState<MembershipPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isPurchasing, setIsPurchasing] = useState(false)
  const purchaseAttemptKeyRef = useRef<{ planUid: number; key: string } | null>(null)

  const performAuthenticatedRequest = async (
    endpoint: string,
    init = {} as RequestInit
  ): Promise<Response | null> => {
    return performAuthenticatedRequestWithRefresh({
      endpoint,
      init,
      accessToken: tokens?.access_token ?? null,
      refreshToken: tokens?.refresh_token ?? null,
      webServer,
      setTokens,
    })
  }

  const loadPlans = useCallback(
    async ({ isRefresh = false }: { isRefresh?: boolean } = {}) => {
      if (!user?.gym_id || !tokens?.access_token) {
        setErrorMessage('Please sign in again to view membership plans.')
        setPlans([])
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

      try {
        const response = await performAuthenticatedRequest(`${webServer}/api/v1/membership-plans`)
        if (!response) {
          setErrorMessage('Please sign in again to view membership plans.')
          setPlans([])
          return
        }

        const responseText = await response.text()
        let responseBody: MembershipPlansResponse = {}
        if (responseText) {
          try {
            responseBody = JSON.parse(responseText)
          } catch {
            responseBody = { message: responseText }
          }
        }

        if (response.status !== 200) {
          const message = responseBody?.message || 'Unable to load membership plans.'
          setErrorMessage(message)
          setPlans([])
          showMessage({
            message: 'Membership plans unavailable',
            description: message,
            type: 'danger',
          })
          return
        }

        const sortedPlans = Array.isArray(responseBody?.data) ? sortMembershipPlans(responseBody.data) : []
        setPlans(sortedPlans)
      } catch {
        const message = 'Failed to load membership plans.'
        setErrorMessage(message)
        setPlans([])
        showMessage({
          message: 'Membership plans unavailable',
          description: message,
          type: 'danger',
        })
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [tokens?.access_token, user?.gym_id, webServer, setTokens]
  )

  useFocusEffect(
    useCallback(() => {
      void loadPlans()
    }, [loadPlans])
  )

  const onRefresh = () => {
    void loadPlans({ isRefresh: true })
  }

  const choosePlan = async (plan: MembershipPlan) => {
    if (isPurchasing) {
      return
    }

    const planUid = Number(plan?.uid ?? 0)
    if (!planUid || !user?.gym_id || !tokens?.access_token) {
      showMessage({
        message: 'Purchase unavailable',
        description: 'Please sign in again to continue.',
        type: 'danger',
      })
      return
    }

    if (!purchaseAttemptKeyRef.current || purchaseAttemptKeyRef.current.planUid !== planUid) {
      const randomSuffix = Math.random().toString(36).slice(2, 10)
      purchaseAttemptKeyRef.current = {
        planUid,
        key: `membership-purchase-${planUid}-${Date.now()}-${randomSuffix}`,
      }
    }

    const idempotencyKey = purchaseAttemptKeyRef.current.key
    const endpoint = `${webServer}/api/v1/membership-plans/${planUid}/purchase`

    const submitPurchaseRequest = async (): Promise<{
      response: Response
      responseBody: MembershipPurchaseResponse
    } | null> => {
      const response = await performAuthenticatedRequest(endpoint, {
        method: 'POST',
        headers: {
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify({}),
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
      let responseBody: MembershipPurchaseResponse = {}
      if (responseText) {
        try {
          responseBody = JSON.parse(responseText) as MembershipPurchaseResponse
        } catch {
          responseBody = { message: responseText }
        }
      }

      return { response, responseBody }
    }

    setIsPurchasing(true)

    try {
      const initialResult = await submitPurchaseRequest()
      if (!initialResult) {
        return
      }

      const { response, responseBody } = initialResult
      if (response.status !== 200 && response.status !== 201) {
        const message = responseBody?.message || 'Unable to purchase this membership plan.'
        showMessage({
          message: 'Purchase failed',
          description: message,
          type: 'danger',
        })
        return
      }

      const membership = responseBody?.membership ?? null
      if (!membership) {
        showMessage({
          message: 'Purchase failed',
          description: 'Unable to load membership details. Please try again.',
          type: 'danger',
        })
        return
      }

      const price = Number(plan?.price ?? membership?.price ?? 0)
      const isFree = price <= 0
      const clientSecret = responseBody?.payment?.payment_intent?.client_secret ?? null

      if (isFree) {
        showMessage({
          message: 'Purchase submitted',
          description: 'Your membership request was submitted successfully.',
          type: 'success',
        })
        navigation.navigate('MembershipPurchaseSuccessScreen', {
          membership,
          isPaid: false,
          idempotencyKey: responseBody?.idempotency_key ?? idempotencyKey,
        })
        return
      }

      if (!clientSecret) {
        showMessage({
          message: 'Purchase failed',
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
        console.log('Membership Payment Sheet init error:', initError)
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

        console.log('Membership Payment Sheet error:', presentError)
        showMessage({
          message: 'Payment failed',
          description: presentError.message || 'The payment could not be processed. Please try again.',
          type: 'danger',
        })
        return
      }

      const reconciliationResult = await submitPurchaseRequest()
      const reconciledBody =
        reconciliationResult &&
          (reconciliationResult.response.status === 200 || reconciliationResult.response.status === 201)
          ? reconciliationResult.responseBody
          : responseBody

      const reconciledMembership = reconciledBody?.membership ?? membership
      if (!reconciledMembership) {
        showMessage({
          message: 'Purchase failed',
          description: 'Unable to confirm your membership purchase. Please try again.',
          type: 'danger',
        })
        return
      }

      showMessage({
        message: 'Payment successful',
        description: 'Your membership purchase has been submitted.',
        type: 'success',
      })
      navigation.navigate('MembershipPurchaseSuccessScreen', {
        membership: reconciledMembership,
        isPaid: true,
        idempotencyKey: reconciledBody?.idempotency_key ?? responseBody?.idempotency_key ?? idempotencyKey,
      })
    } catch (error) {
      console.log('Membership purchase error:', error)
      showMessage({
        message: 'Purchase failed',
        description: 'An unexpected error occurred. Please try again.',
        type: 'danger',
      })
    } finally {
      setIsPurchasing(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.navs}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" color={AppColors.blue} size={36} />
        </TouchableOpacity>
        <Text style={styles.title}>Buy Membership</Text>
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
            <Text style={styles.stateText}>Loading membership plans...</Text>
          </View>
        ) : errorMessage ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Unable to load membership plans</Text>
            <Text style={styles.errorText}>{errorMessage}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => loadPlans()}>
              <Text style={styles.retryBtnText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : plans.length === 0 ? (
          <View style={styles.centerState}>
            <Text style={styles.emptyTitle}>No membership plans available</Text>
            <Text style={styles.stateText}>Check back later for plans at your gym.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {sortMembershipPlans(plans).map((plan) => {
              const planUid = Number(plan?.uid ?? 0)
              const description = String(plan?.description ?? '').trim()
              const durationLabel = formatDurationLabel(plan?.duration_months)
              const priceLabel = formatPlanPrice(plan)

              return (
                <View key={planUid || `${plan?.name}-${plan?.created_at ?? 'plan'}`} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderText}>
                      <Text style={styles.durationPill}>{durationLabel}</Text>
                      <Text style={styles.cardTitle}>{plan?.name || 'Untitled plan'}</Text>
                    </View>
                  </View>

                  {description ? (
                    <Text style={styles.description} numberOfLines={3}>
                      {description}
                    </Text>
                  ) : null}

                  <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                      <Text style={styles.metaLabel}>Price</Text>
                      <Text style={styles.metaValue}>{priceLabel}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Text style={styles.metaLabel}>Duration</Text>
                      <Text style={styles.metaValue}>{durationLabel}</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[styles.chooseButton, isPurchasing && styles.chooseButtonDisabled]}
                    onPress={() => void choosePlan(plan)}
                    disabled={isPurchasing}
                  >
                    {isPurchasing ? (
                      <ActivityIndicator color={AppColors.white} />
                    ) : (
                      <Feather name="check-circle" color={AppColors.white} size={16} />
                    )}
                    <Text style={styles.chooseButtonText}>
                      {isPurchasing ? 'Processing...' : 'Buy Now'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

export default MembershipPlansScreen

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
  title: {
    color: AppColors.blue,
    fontSize: 24,
    fontFamily: 'Montserrat',
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
    paddingBottom: 28,
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
  durationPill: {
    fontSize: 13,
    fontFamily: 'Montserrat',
    color: AppColors.blue,
    backgroundColor: AppColors.grey,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: 'Montserrat',
    color: AppColors.primary,
    lineHeight: 24,
  },
  description: {
    color: AppColors.grey3,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
  },
  metaItem: {
    flexBasis: '48%',
    backgroundColor: AppColors.white,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: AppColors.grey,
  },
  metaLabel: {
    color: AppColors.grey3,
    fontSize: 12,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  metaValue: {
    color: AppColors.primary,
    fontSize: 14,
    fontFamily: 'Montserrat',
  },
  chooseButton: {
    marginTop: 18,
    backgroundColor: AppColors.blue,
    borderRadius: 999,
    paddingVertical: 13,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  chooseButtonDisabled: {
    opacity: 0.75,
  },
  chooseButtonText: {
    color: AppColors.white,
    fontSize: 15,
    fontFamily: 'Montserrat',
  },
})