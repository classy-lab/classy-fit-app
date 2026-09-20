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
import Feather from '@expo/vector-icons/Feather'
import { showMessage } from 'react-native-flash-message'
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

const PLATFORM_FEE_LABEL = '$10.00 USD / month'

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

const PlatformBillingScreen = ({ navigation }: { navigation: { goBack: () => void } }) => {
  const { user, tokens, setTokens, webServer } = useContext(UserContext) as UserContextValue
  const [billing, setBilling] = useState<PlatformBillingRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const isOwner = String(user?.role ?? '').trim().toLowerCase() === 'owner'

  const refreshAccessToken = async (): Promise<string | null> => {
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
    endpoint: string,
    init: RequestInit = {}
  ): Promise<Response | null> => {
    if (!tokens?.access_token) {
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

    let accessToken = tokens.access_token
    let response = await requestWithToken(accessToken)

    if (response.status === 401 || response.status === 403) {
      const refreshedAccessToken = await refreshAccessToken()
      if (!refreshedAccessToken) {
        return response
      }

      accessToken = refreshedAccessToken
      response = await requestWithToken(accessToken)
    }

    return response
  }

  const readResponseBody = async (response: Response) => {
    const responseText = await response.text()
    if (!responseText) {
      return {}
    }

    try {
      return JSON.parse(responseText)
    } catch {
      return { message: responseText }
    }
  }

  const loadBilling = useCallback(
    async ({ isRefresh = false }: { isRefresh?: boolean } = {}) => {
      if (!isOwner) {
        setErrorMessage('Only gym owners can view platform billing.')
        setBilling(null)
        setLoading(false)
        setRefreshing(false)
        return
      }

      if (!user?.gym_id || !tokens?.access_token) {
        setErrorMessage('Please sign in again to view platform billing.')
        setBilling(null)
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

      const endpoint = `${webServer}/api/v1/gyms/${user.gym_id}/platform-billing`

      try {
        let response = await performAuthenticatedRequest(endpoint, { method: 'GET' })
        if (!response) {
          setErrorMessage('Please sign in again to view platform billing.')
          setBilling(null)
          return
        }

        let responseBody = await readResponseBody(response)

        if (response.status === 404) {
          const initializeResponse = await performAuthenticatedRequest(endpoint, {
            method: 'POST',
          })

          if (!initializeResponse) {
            setErrorMessage('Unable to initialize platform billing. Please sign in again.')
            setBilling(null)
            return
          }

          response = initializeResponse
          responseBody = await readResponseBody(response)
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
          return
        }

        const nextBilling = responseBody?.billing ?? null
        if (!nextBilling) {
          setErrorMessage('Platform billing data is not available yet.')
          setBilling(null)
          return
        }

        setBilling(nextBilling)
      } catch (error) {
        const message = 'Failed to load platform billing.'
        setErrorMessage(message)
        setBilling(null)
        showMessage({
          message: 'Platform billing unavailable',
          description: message,
          type: 'danger',
        })
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [isOwner, tokens?.access_token, user?.gym_id, webServer, setTokens]
  )

  useFocusEffect(
    useCallback(() => {
      void loadBilling()
    }, [loadBilling])
  )

  const billingMode = formatLabel(billing?.billing_mode)
  const billingStatus = formatLabel(billing?.status)
  const hasBilling = billing !== null

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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void loadBilling({ isRefresh: true })} tintColor={AppColors.blue} />}
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

              <View style={styles.noteBox}>
                <Text style={styles.noteText}>
                  This screen only shows the current platform-billing state. Payment actions are added in a later milestone.
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
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
    fontFamily: 'Montserrat',
    textTransform: 'capitalize',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
  },
  metaItem: {
    flexBasis: '48%',
    backgroundColor: AppColors.grey,
    borderRadius: 14,
    padding: 12,
  },
  metaLabel: {
    color: AppColors.grey3,
    fontSize: 12,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  metaValue: {
    color: AppColors.blue,
    fontSize: 14,
    fontFamily: 'Montserrat',
    lineHeight: 20,
  },
  noteBox: {
    marginTop: 16,
    backgroundColor: AppColors.grey,
    borderRadius: 14,
    padding: 12,
  },
  noteText: {
    color: AppColors.primary,
    fontSize: 13,
    lineHeight: 18,
  },
})
