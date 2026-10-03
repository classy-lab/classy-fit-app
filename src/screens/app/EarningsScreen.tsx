// @ts-nocheck
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Feather from '@expo/vector-icons/Feather'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import FontAwesome5 from '@expo/vector-icons/FontAwesome5'
import { PieChart } from 'react-native-gifted-charts'
import { AppColors } from '../../styles/colors'
import SignOut from '../../components/utils/SignOut'
import { UserContext } from '../../context/UserContext'
import { performAuthenticatedRequest } from '../../utils/authenticatedRequest'
import type {
  EarningsApiResponse,
  EarningsCategoryKey,
} from '../../types/earnings'

const categoryOrder: EarningsCategoryKey[] = [
  'classes',
  'memberships',
  'personal_training',
  'products',
]

const categoryCards: Record<
  EarningsCategoryKey,
  {
    title: string
    icon: React.ReactNode
    color: string
  }
> = {
  classes: {
    title: 'Classes',
    icon: <FontAwesome5 name="calendar-alt" size={24} color={AppColors.blue} />,
    color: '#4C6FFF',
  },
  memberships: {
    title: 'Memberships',
    icon: <MaterialCommunityIcons name="credit-card-outline" size={30} color={AppColors.blue} />,
    color: '#FF6C40',
  },
  personal_training: {
    title: 'Personal Training',
    icon: <MaterialCommunityIcons name="dumbbell" size={30} color={AppColors.blue} />,
    color: '#2BB673',
  },
  products: {
    title: 'Products',
    icon: <MaterialCommunityIcons name="shopping" size={30} color={AppColors.blue} />,
    color: '#F5B700',
  },
}

const formatPercent = (value: number) => `${Math.round(value * 100)}%`

const EarningsScreen = ({ navigation }) => {
  const authContext = useContext(UserContext)
  const { width } = useWindowDimensions()
  const user = authContext?.user ?? null
  const tokens = authContext?.tokens ?? null
  const webServer = authContext?.webServer ?? ''
  const setTokens = authContext?.setTokens

  const [earnings, setEarnings] = useState<EarningsApiResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<EarningsCategoryKey | null>(null)

  const isOwner = String(user?.role ?? '').trim().toLowerCase() === 'owner'

  const loadEarnings = useCallback(async () => {
    if (!user?.gym_id || !tokens?.access_token || !setTokens) {
      setErrorMessage('Please sign in again to view earnings.')
      setIsLoading(false)
      return
    }

    if (!isOwner) {
      setErrorMessage('Only gym owners can view earnings.')
      setIsLoading(false)
      setEarnings(null)
      return
    }

    setIsLoading(true)
    setErrorMessage('')

    try {
      const response = await performAuthenticatedRequest({
        endpoint: `${webServer}/api/v1/gyms/${user.gym_id}/earnings?period=7d`,
        init: { method: 'GET' },
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        webServer,
        setTokens,
      })

      if (!response) {
        setErrorMessage('Please sign in again to view earnings.')
        setEarnings(null)
        return
      }

      const responseBody = (await response.json()) as Partial<EarningsApiResponse> & {
        message?: string
      }

      if (response.status !== 200 || responseBody.status !== 'success') {
        setErrorMessage(responseBody.message || 'Unable to load earnings.')
        setEarnings(null)
        return
      }

      const nextEarnings = responseBody as EarningsApiResponse
      setEarnings(nextEarnings)
      setSelectedCategory(null)
    } catch {
      setErrorMessage('Unable to load earnings.')
      setEarnings(null)
    } finally {
      setIsLoading(false)
    }
  }, [isOwner, setTokens, tokens?.access_token, tokens?.refresh_token, user?.gym_id, webServer])

  useEffect(() => {
    void loadEarnings()
  }, [loadEarnings])

  const currencyFormatter = useMemo(() => {
    const currencyCode = earnings?.currency ?? 'USD'
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    } catch {
      return new Intl.NumberFormat(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    }
  }, [earnings?.currency])

  const formatCurrency = useCallback(
    (value: number) => currencyFormatter.format(value),
    [currencyFormatter]
  )

  const totalRevenue = earnings?.totals.revenue ?? 0
  const transactionCount = earnings?.totals.transaction_count ?? 0
  const hasData = totalRevenue > 0
  const categoryBreakdown = useMemo(
    () =>
      categoryOrder.map((categoryKey) => ({
        key: categoryKey,
        ...categoryCards[categoryKey],
        summary: earnings?.by_category[categoryKey] ?? {
          revenue: 0,
          transaction_count: 0,
        },
      })),
    [earnings]
  )
  const activeCategory = categoryBreakdown.find((card) => card.key === selectedCategory) ?? null
  const donutRadius = Math.min(110, Math.floor((width - 48 - 40) / 2))
  const donutData = hasData
    ? categoryBreakdown
        .filter((card) => card.summary.revenue > 0)
        .map((card) => ({
          value: card.summary.revenue,
          color: card.color,
          focused: card.key === selectedCategory,
          onPress: () =>
            setSelectedCategory((current) => (current === card.key ? null : card.key)),
        }))
    : [{ value: 1, color: AppColors.grey2 }]

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.navs}>
        <Feather
          name="arrow-left"
          color={AppColors.blue}
          size={36}
          onPress={() => navigation.goBack()}
        />
        <SignOut />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.headingContainer}>
          <Text style={styles.title}>Earnings</Text>
          <Text style={styles.subtitle}>Weekly revenue snapshot</Text>
        </View>

        <View style={styles.body}>
          <View style={styles.heroCard}>
            <View style={styles.heroHeader}>
              <View style={styles.heroTextBlock}>
                <Text style={styles.heroEyebrow}>This week</Text>
                <Text style={styles.heroTitle}>Combined total sales</Text>
                <Text style={styles.heroDescription}>
                  Tap a slice or legend row to see that category's share of revenue.
                </Text>
              </View>
            </View>

            <View style={styles.summaryRow}>
              <View style={styles.summaryPill}>
                <Text style={styles.summaryLabel}>Total revenue</Text>
                <Text style={styles.summaryValue}>{formatCurrency(totalRevenue)}</Text>
              </View>
              <View style={styles.summaryPill}>
                <Text style={styles.summaryLabel}>Transactions</Text>
                <Text style={styles.summaryValue}>{transactionCount}</Text>
              </View>
            </View>

            <View style={styles.graphCard}>
              {isLoading ? (
                <View style={styles.loadingWrap}>
                  <ActivityIndicator color={AppColors.blue} />
                  <Text style={styles.loadingText}>Loading revenue breakdown...</Text>
                </View>
              ) : errorMessage && !earnings ? (
                <View style={styles.loadingWrap}>
                  <Text style={styles.loadingText}>{errorMessage}</Text>
                </View>
              ) : (
                <>
                  <View style={styles.donutWrap}>
                    <PieChart
                      donut
                      data={donutData}
                      radius={donutRadius}
                      innerRadius={Math.round(donutRadius * 0.65)}
                      innerCircleColor={AppColors.white}
                      isAnimated={false}
                      centerLabelComponent={() => (
                        <View style={styles.donutCenter}>
                          <Text style={styles.donutCenterLabel}>
                            {activeCategory ? activeCategory.title : 'Total'}
                          </Text>
                          <Text style={styles.donutCenterValue}>
                            {formatCurrency(
                              activeCategory ? activeCategory.summary.revenue : totalRevenue
                            )}
                          </Text>
                          <Text style={styles.donutCenterMeta}>
                            {activeCategory
                              ? `${formatPercent(
                                  totalRevenue > 0 ? activeCategory.summary.revenue / totalRevenue : 0
                                )} of revenue`
                              : `${transactionCount} transactions`}
                          </Text>
                        </View>
                      )}
                    />
                  </View>

                  <View style={styles.legend}>
                    {categoryBreakdown.map((card) => {
                      const share = totalRevenue > 0 ? card.summary.revenue / totalRevenue : 0
                      const isActive = card.key === selectedCategory

                      return (
                        <TouchableOpacity
                          key={card.key}
                          activeOpacity={0.8}
                          style={[styles.legendRow, isActive && styles.legendRowActive]}
                          onPress={() =>
                            setSelectedCategory((current) =>
                              current === card.key ? null : card.key
                            )
                          }
                        >
                          <View
                            style={[styles.legendDot, { backgroundColor: card.color }]}
                          />
                          <Text style={styles.legendName}>{card.title}</Text>
                          <Text style={styles.legendValue}>
                            {formatCurrency(card.summary.revenue)}
                          </Text>
                          <Text style={styles.legendPercent}>{formatPercent(share)}</Text>
                        </TouchableOpacity>
                      )
                    })}
                  </View>

                  {!hasData ? (
                    <Text style={styles.emptyText}>No sales data for this week.</Text>
                  ) : null}
                </>
              )}
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Earnings categories</Text>
            <Text style={styles.sectionSubtitle}>Revenue and transaction counts by category</Text>
          </View>

          <View style={styles.grid}>
            {categoryBreakdown.map((card) => (
              <TouchableOpacity key={card.key} activeOpacity={0.9} style={styles.squareCard}>
                <View style={styles.iconWrap}>{card.icon}</View>
                <Text style={styles.squareTitle}>{card.title}</Text>
                <Text style={styles.squareValue}>{formatCurrency(card.summary.revenue)}</Text>
                <Text style={styles.squareCount}>{card.summary.transaction_count} transactions</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

export default EarningsScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.white,
  },
  navs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  scrollView: {
    flex: 1,
  },
  headingContainer: {
    paddingHorizontal: 24,
    marginTop: 8,
    marginBottom: 18,
    alignItems: 'center',
  },
  title: {
    color: AppColors.blue,
    fontSize: 32,
    fontFamily: 'Montserrat',
  },
  subtitle: {
    color: AppColors.grey3,
    fontSize: 14,
    marginTop: 6,
    fontFamily: 'Montserrat',
  },
  body: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  heroCard: {
    backgroundColor: AppColors.grey,
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    shadowColor: AppColors.grey3,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  heroTextBlock: {
    flex: 1,
  },
  heroEyebrow: {
    color: AppColors.blue,
    fontSize: 12,
    fontFamily: 'Montserrat',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    opacity: 0.85,
  },
  heroTitle: {
    color: AppColors.primary,
    fontSize: 22,
    fontFamily: 'Montserrat',
    marginTop: 4,
  },
  heroDescription: {
    color: AppColors.grey3,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  summaryPill: {
    flex: 1,
    backgroundColor: AppColors.white,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  summaryLabel: {
    color: AppColors.grey3,
    fontSize: 11,
    fontFamily: 'Montserrat',
  },
  summaryValue: {
    color: AppColors.blue,
    fontSize: 16,
    fontFamily: 'Montserrat',
    marginTop: 4,
  },
  graphCard: {
    backgroundColor: AppColors.white,
    borderRadius: 18,
    marginTop: 16,
    paddingHorizontal: 10,
    paddingTop: 12,
    paddingBottom: 10,
    width: '100%',
  },
  loadingWrap: {
    minHeight: 210,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    color: AppColors.grey3,
    fontSize: 13,
    fontFamily: 'Montserrat',
    textAlign: 'center',
  },
  donutWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  donutCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  donutCenterLabel: {
    color: AppColors.grey3,
    fontSize: 11,
    fontFamily: 'Montserrat',
    textAlign: 'center',
  },
  donutCenterValue: {
    color: AppColors.primary,
    fontSize: 18,
    marginTop: 2,
    fontFamily: 'Montserrat',
    textAlign: 'center',
  },
  donutCenterMeta: {
    color: AppColors.grey3,
    fontSize: 10,
    marginTop: 2,
    fontFamily: 'Montserrat',
    textAlign: 'center',
  },
  legend: {
    marginTop: 8,
    gap: 6,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  legendRowActive: {
    backgroundColor: AppColors.grey,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  legendName: {
    flex: 1,
    color: AppColors.blue,
    fontSize: 13,
    fontFamily: 'Montserrat',
  },
  legendValue: {
    color: AppColors.primary,
    fontSize: 13,
    fontFamily: 'Montserrat',
    marginRight: 10,
  },
  legendPercent: {
    width: 40,
    textAlign: 'right',
    color: AppColors.grey3,
    fontSize: 12,
    fontFamily: 'Montserrat',
  },
  emptyText: {
    marginTop: 12,
    color: AppColors.grey3,
    fontSize: 12,
    fontFamily: 'Montserrat',
    textAlign: 'center',
  },
  sectionHeader: {
    marginBottom: 14,
  },
  sectionTitle: {
    color: AppColors.blue,
    fontSize: 14,
    fontFamily: 'Montserrat',
  },
  sectionSubtitle: {
    color: AppColors.grey3,
    fontSize: 11,
    marginTop: 4,
    fontFamily: 'Montserrat',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  squareCard: {
    width: '48%',
    aspectRatio: 1,
    backgroundColor: AppColors.grey,
    borderRadius: 20,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: AppColors.grey3,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  iconWrap: {
    width: 58,
    height: 58,
    borderRadius: 16,
    backgroundColor: AppColors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  squareTitle: {
    color: AppColors.blue,
    fontSize: 15,
    fontFamily: 'Montserrat',
    textAlign: 'center',
  },
  squareValue: {
    color: AppColors.primary,
    fontSize: 16,
    marginTop: 10,
    fontFamily: 'Montserrat',
    textAlign: 'center',
  },
  squareCount: {
    color: AppColors.grey3,
    fontSize: 11,
    marginTop: 4,
    fontFamily: 'Montserrat',
    textAlign: 'center',
  },
})
