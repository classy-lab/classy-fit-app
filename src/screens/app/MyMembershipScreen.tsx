import { useCallback, useContext, useMemo, useState } from 'react'
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
import Feather from '@expo/vector-icons/Feather'
import { AppColors } from '../../styles/colors'
import { UserContext } from '../../context/UserContext'

type RefreshTokens = {
  access_token?: string
  refresh_token?: string
}

type UserContextValue = {
  tokens?: RefreshTokens | null
  setTokens: (value: RefreshTokens | null | ((prev: RefreshTokens | null) => RefreshTokens | null)) => void
  webServer: string
}

type MembershipSummary = {
  uid?: number | string
  gym_id?: number | string
  member_gym_user_id?: number | string
  membership_plan_uid?: number | string
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

type MembershipsResponse = {
  status?: string
  data?: MembershipSummary[]
  message?: string
}

type MyMembershipNavigation = {
  goBack: () => void
  navigate: (screen: 'MembershipPlansScreen') => void
}

const parseDate = (value?: string | null) => {
  if (!value) {
    return null
  }

  const normalized = String(value).includes('T') ? String(value) : String(value).replace(' ', 'T')
  const date = new Date(normalized)
  return Number.isNaN(date.getTime()) ? null : date
}

const formatDate = (value?: string | null) => {
  const date = parseDate(value)
  if (!date) {
    return 'Unknown date'
  }

  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

const formatPrice = (price?: number | string | null, currency?: string | null) => {
  const amount = Number(price ?? 0)
  if (!Number.isFinite(amount) || amount <= 0) {
    return 'Free'
  }

  const currencyCode = String(currency ?? '').trim().toUpperCase()
  return currencyCode ? `${amount.toFixed(2)} ${currencyCode}` : amount.toFixed(2)
}

const formatDurationLabel = (durationMonths?: number | string | null) => {
  const months = Number(durationMonths ?? 0)
  if (!Number.isFinite(months) || months <= 0) {
    return 'Unknown duration'
  }

  return months === 1 ? '1 month' : `${months} months`
}

const formatStatusLabel = (status?: string | null) => {
  const value = String(status ?? '').trim().toLowerCase()
  if (!value) {
    return 'Unknown'
  }

  return value.charAt(0).toUpperCase() + value.slice(1)
}

const MyMembershipScreen = ({ navigation }: { navigation: MyMembershipNavigation }) => {
  const { tokens, setTokens, webServer } = useContext(UserContext) as UserContextValue
  const [memberships, setMemberships] = useState<MembershipSummary[]>([])
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

    setTokens((prev) => ({
      ...(prev ?? {}),
      access_token: refreshObj.access_token,
      refresh_token: refreshObj.refresh_token,
    }))

    return refreshObj.access_token
  }

  const loadMemberships = useCallback(
    async ({ isRefresh = false }: { isRefresh?: boolean } = {}) => {
      if (!tokens?.access_token) {
        setErrorMessage('Please sign in again to view your memberships.')
        setMemberships([])
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

      const endpoint = `${webServer}/api/v1/memberships`

      const performRequest = async (accessToken: string): Promise<Response> => {
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
            setMemberships([])
            return
          }
        }

        const responseText = await response.text()
        let responseBody: MembershipsResponse = {}

        if (responseText) {
          try {
            responseBody = JSON.parse(responseText) as MembershipsResponse
          } catch {
            responseBody = { message: responseText }
          }
        }

        if (response.status !== 200) {
          const message = responseBody?.message || 'Unable to load your memberships.'
          setErrorMessage(message)
          setMemberships([])
          showMessage({
            message: 'Memberships unavailable',
            description: message,
            type: 'danger',
          })
          return
        }

        setMemberships(
          Array.isArray(responseBody?.data)
            ? responseBody.data.filter(
                (value): value is MembershipSummary => typeof value === 'object' && value !== null
              )
            : []
        )
      } catch (error) {
        const message = 'Failed to load your memberships.'
        setErrorMessage(message)
        setMemberships([])
        showMessage({
          message: 'Memberships unavailable',
          description: message,
          type: 'danger',
        })
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [tokens?.access_token, tokens?.refresh_token, setTokens, webServer]
  )

  useFocusEffect(
    useCallback(() => {
      void loadMemberships()
    }, [loadMemberships])
  )

  const currentMemberships = useMemo(
    () => memberships.filter((membership) => String(membership?.status ?? '').toLowerCase() === 'active'),
    [memberships]
  )

  const pendingMemberships = useMemo(
    () => memberships.filter((membership) => String(membership?.status ?? '').toLowerCase() === 'pending'),
    [memberships]
  )

  const historicalMemberships = useMemo(
    () =>
      memberships.filter((membership) => {
        const status = String(membership?.status ?? '').toLowerCase()
        return status !== 'active' && status !== 'pending'
      }),
    [memberships]
  )

  const openMembershipPlans = () => {
    navigation.navigate('MembershipPlansScreen')
  }

  const renderMembershipCard = (membership: MembershipSummary, variant: 'current' | 'pending' | 'history') => {
    const status = String(membership?.status ?? '').toLowerCase()

    return (
      <View
        key={String(membership?.uid ?? `${membership?.membership_plan_uid}-${membership?.created_at ?? ''}`)}
        style={[
          styles.card,
          variant === 'current' && styles.currentCard,
          variant === 'pending' && styles.pendingCard,
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleBlock}>
            <Text style={styles.cardTitle}>{membership?.plan_name || 'Membership'}</Text>
            <Text style={styles.cardSubtitle}>{formatDurationLabel(membership?.duration_months)}</Text>
          </View>
          <View style={[styles.statusPill, variant === 'current' ? styles.statusActive : variant === 'pending' ? styles.statusPending : styles.statusHistory]}>
            <Text style={styles.statusText}>{formatStatusLabel(status)}</Text>
          </View>
        </View>

        <View style={styles.detailGrid}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Price</Text>
            <Text style={styles.detailValue}>
              {formatPrice(membership?.price, membership?.currency_code)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Start date</Text>
            <Text style={styles.detailValue}>{formatDate(membership?.start_at)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>End date</Text>
            <Text style={styles.detailValue}>{formatDate(membership?.end_at)}</Text>
          </View>
        </View>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.navs}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" color={AppColors.blue} size={36} />
        </TouchableOpacity>
        <Text style={styles.title}>My Membership</Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void loadMemberships({ isRefresh: true })}
            tintColor={AppColors.blue}
          />
        }
      >
        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color={AppColors.blue} />
            <Text style={styles.stateText}>Loading your memberships...</Text>
          </View>
        ) : errorMessage ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Unable to load memberships</Text>
            <Text style={styles.errorText}>{errorMessage}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => void loadMemberships()}>
              <Text style={styles.retryBtnText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : memberships.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Feather name="credit-card" color={AppColors.white} size={28} />
            </View>
            <Text style={styles.emptyTitle}>No membership found</Text>
            <Text style={styles.stateText}>
              You do not currently have a membership. Browse the available membership plans to get started.
            </Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={openMembershipPlans}>
              <Text style={styles.primaryBtnText}>Browse Membership Plans</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.content}>
            {currentMemberships.length > 0 ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Current Membership</Text>
                {currentMemberships.map((membership, index) =>
                  renderMembershipCard(membership, index === 0 ? 'current' : 'history')
                )}
              </View>
            ) : null}

            {pendingMemberships.length > 0 ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Pending Memberships</Text>
                {pendingMemberships.map((membership) => renderMembershipCard(membership, 'pending'))}
              </View>
            ) : null}

            {historicalMemberships.length > 0 ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Membership History</Text>
                {historicalMemberships.map((membership) => renderMembershipCard(membership, 'history'))}
              </View>
            ) : null}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

export default MyMembershipScreen

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
    paddingVertical: 16,
  },
  centerState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  stateText: {
    marginTop: 12,
    fontSize: 15,
    color: AppColors.grey3,
    textAlign: 'center',
    lineHeight: 22,
  },
  errorCard: {
    backgroundColor: AppColors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: AppColors.grey2,
    padding: 20,
    marginTop: 12,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: AppColors.blue,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: AppColors.grey3,
    marginBottom: 14,
    lineHeight: 20,
  },
  retryBtn: {
    backgroundColor: AppColors.blue,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 12,
    alignSelf: 'flex-start',
  },
  retryBtnText: {
    color: AppColors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  emptyCard: {
    backgroundColor: AppColors.white,
    borderRadius: 22,
    padding: 22,
    borderWidth: 1,
    borderColor: AppColors.grey2,
    alignItems: 'center',
    marginTop: 12,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: AppColors.blue,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: AppColors.blue,
    textAlign: 'center',
  },
  primaryBtn: {
    marginTop: 20,
    backgroundColor: AppColors.blue,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 999,
  },
  primaryBtnText: {
    color: AppColors.white,
    fontWeight: '700',
    fontSize: 14,
  },
  content: {
    gap: 18,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: AppColors.blue,
  },
  card: {
    backgroundColor: AppColors.white,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: AppColors.grey2,
    padding: 18,
  },
  currentCard: {
    borderColor: AppColors.blue,
    borderWidth: 2,
  },
  pendingCard: {
    borderColor: AppColors.grey3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  cardTitleBlock: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: AppColors.blue,
  },
  cardSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: AppColors.grey3,
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  statusActive: {
    backgroundColor: AppColors.blue,
  },
  statusPending: {
    backgroundColor: AppColors.grey3,
  },
  statusHistory: {
    backgroundColor: AppColors.primary,
  },
  statusText: {
    color: AppColors.white,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  detailGrid: {
    gap: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: AppColors.grey3,
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '700',
    color: AppColors.primary,
    textAlign: 'right',
    flexShrink: 1,
  },
})
