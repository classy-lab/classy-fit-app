// @ts-nocheck
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Animated,
  RefreshControl,
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
  EarningsPeriod,
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

const PERIOD_OPTIONS: { key: EarningsPeriod; label: string; title: string }[] = [
  { key: '7d', label: '7D', title: 'Last 7 days' },
  { key: '30d', label: '30D', title: 'Last 30 days' },
  { key: '90d', label: '90D', title: 'Last 90 days' },
  { key: '1y', label: '1Y', title: 'Last 12 months' },
]

const formatPercent = (value: number) => `${Math.round(value * 100)}%`

const parseApiDate = (value?: string) => {
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

const formatShortDate = (value?: string) => {
  const date = parseApiDate(value)
  return date
    ? new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date)
    : value ?? '—'
}

const formatDayAndDate = (value?: string) => {
  const date = parseApiDate(value)
  return date
    ? new Intl.DateTimeFormat(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }).format(date)
    : value ?? '—'
}

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
  const [selectedPeriod, setSelectedPeriod] = useState<EarningsPeriod>('7d')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const requestSequenceRef = useRef(0)
  const donutAnim = useRef(new Animated.Value(0)).current

  const isOwner = String(user?.role ?? '').trim().toLowerCase() === 'owner'

  const loadEarnings = useCallback(async (isPullRefresh = false) => {
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

    const requestId = ++requestSequenceRef.current
    if (!isPullRefresh) {
      setIsLoading(true)
    }
    setErrorMessage('')

    try {
      const response = await performAuthenticatedRequest({
        endpoint: `${webServer}/api/v1/gyms/${user.gym_id}/earnings?period=${selectedPeriod}`,
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

      if (requestId !== requestSequenceRef.current) {
        return
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
      if (requestId === requestSequenceRef.current) {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    }
  }, [
    isOwner,
    selectedPeriod,
    setTokens,
    tokens?.access_token,
    tokens?.refresh_token,
    user?.gym_id,
    webServer,
  ])

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true)
    void loadEarnings(true)
  }, [loadEarnings])

  useEffect(() => {
    void loadEarnings()
  }, [loadEarnings])

  useEffect(() => {
    if (isLoading || !earnings) {
      return
    }

    donutAnim.setValue(0)
    Animated.spring(donutAnim, {
      toValue: 1,
      friction: 7,
      tension: 60,
      useNativeDriver: true,
    }).start()
  }, [donutAnim, earnings, isLoading])

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
  const periodMeta = PERIOD_OPTIONS.find((option) => option.key === selectedPeriod)
  const rangeLabel = earnings
    ? `${formatShortDate(earnings.range.start_date)} – ${formatShortDate(earnings.range.end_date)}`
    : ''
  const insights = useMemo(() => {
    if (!earnings || totalRevenue <= 0) {
      return []
    }

    const topCategory = [...categoryBreakdown].sort(
      (a, b) => b.summary.revenue - a.summary.revenue
    )[0]
    const bestDay = (earnings.daily ?? []).reduce(
      (best, day) => (!best || day.revenue > best.revenue ? day : best),
      null
    )
    const dayCount = Math.max(earnings.daily?.length ?? 0, 1)

    return [
      {
        key: 'top',
        icon: 'award',
        label: 'Top earner',
        value: topCategory.title,
        hint: `${formatPercent(topCategory.summary.revenue / totalRevenue)} of revenue`,
        color: topCategory.color,
      },
      {
        key: 'best',
        icon: 'trending-up',
        label: 'Best day',
        value: bestDay ? formatDayAndDate(bestDay.date) : '—',
        hint: bestDay ? formatCurrency(bestDay.revenue) : '',
        color: AppColors.blue,
      },
      {
        key: 'avg',
        icon: 'dollar-sign',
        label: 'Avg. sale',
        value: formatCurrency(transactionCount > 0 ? totalRevenue / transactionCount : 0),
        hint: `${transactionCount} sales`,
        color: AppColors.blue,
      },
      {
        key: 'daily',
        icon: 'calendar',
        label: 'Daily average',
        value: formatCurrency(totalRevenue / dayCount),
        hint: `over ${dayCount} days`,
        color: AppColors.blue,
      },
    ]
  }, [categoryBreakdown, earnings, formatCurrency, totalRevenue, transactionCount])
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

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={AppColors.blue}
            colors={[AppColors.blue]}
          />
        }
      >
        <View style={styles.headingContainer}>
          <Text style={styles.title}>Earnings</Text>
          <Text style={styles.subtitle}>{rangeLabel || 'Revenue snapshot'}</Text>
        </View>

        <View style={styles.body}>
          <View style={styles.heroCard}>
            <View style={styles.heroHeader}>
              <View style={styles.heroTextBlock}>
                <Text style={styles.heroEyebrow}>{periodMeta?.title}</Text>
                <Text style={styles.heroTitle}>Combined total sales</Text>
                <Text style={styles.heroDescription}>
                  Tap a slice or legend row to focus on one category.
                </Text>
              </View>
            </View>

            <View style={styles.periodRow}>
              {PERIOD_OPTIONS.map((option) => {
                const active = option.key === selectedPeriod

                return (
                  <TouchableOpacity
                    key={option.key}
                    activeOpacity={0.85}
                    style={[styles.periodButton, active && styles.periodButtonActive]}
                    onPress={() => {
                      setSelectedCategory(null)
                      setSelectedPeriod(option.key)
                    }}
                  >
                    <Text style={[styles.periodText, active && styles.periodTextActive]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                )
              })}
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
                  <Animated.View
                    style={[
                      styles.donutWrap,
                      {
                        opacity: donutAnim,
                        transform: [
                          {
                            scale: donutAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0.85, 1],
                            }),
                          },
                        ],
                      },
                    ]}
                  >
                    <PieChart
                      donut
                      data={donutData}
                      radius={donutRadius}
                      innerRadius={Math.round(donutRadius * 0.65)}
                      innerCircleColor={AppColors.white}
                      extraRadius={8}
                      strokeWidth={3}
                      strokeColor={AppColors.white}
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
                  </Animated.View>

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
                          <View style={styles.legendTopLine}>
                            <View style={[styles.legendDot, { backgroundColor: card.color }]} />
                            <View style={styles.legendNameBlock}>
                              <Text style={styles.legendName}>{card.title}</Text>
                              <Text style={styles.legendMeta}>
                                {card.summary.transaction_count} transactions
                              </Text>
                            </View>
                            <Text style={styles.legendValue}>
                              {formatCurrency(card.summary.revenue)}
                            </Text>
                            <Text style={styles.legendPercent}>{formatPercent(share)}</Text>
                          </View>
                          <View style={styles.legendBarTrack}>
                            <View
                              style={[
                                styles.legendBarFill,
                                { width: `${Math.max(share * 100, share > 0 ? 3 : 0)}%`, backgroundColor: card.color },
                              ]}
                            />
                          </View>
                        </TouchableOpacity>
                      )
                    })}
                  </View>

                  {!hasData ? (
                    <Text style={styles.emptyText}>No sales data for this period.</Text>
                  ) : null}
                </>
              )}
            </View>
          </View>

          {insights.length > 0 ? (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Highlights</Text>
                <Text style={styles.sectionSubtitle}>{periodMeta?.title} at a glance</Text>
              </View>

              <View style={[styles.grid, styles.insightGrid]}>
                {insights.map((item) => (
                  <View key={item.key} style={styles.insightTile}>
                    <View style={[styles.insightIcon, { backgroundColor: `${item.color}22` }]}>
                      <Feather name={item.icon} size={16} color={item.color} />
                    </View>
                    <Text style={styles.insightLabel}>{item.label}</Text>
                    <Text style={styles.insightValue} numberOfLines={1}>
                      {item.value}
                    </Text>
                    <Text style={styles.insightHint} numberOfLines={1}>
                      {item.hint}
                    </Text>
                  </View>
                ))}
              </View>
            </>
          ) : null}

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
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  legendRowActive: {
    backgroundColor: AppColors.grey,
  },
  legendTopLine: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  legendNameBlock: {
    flex: 1,
  },
  legendName: {
    color: AppColors.blue,
    fontSize: 13,
    fontFamily: 'Montserrat-Bold',
  },
  legendMeta: {
    color: AppColors.grey3,
    fontSize: 10,
    marginTop: 1,
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
  legendBarTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: AppColors.grey,
    marginTop: 8,
    overflow: 'hidden',
  },
  legendBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  periodRow: {
    flexDirection: 'row',
    backgroundColor: AppColors.white,
    borderRadius: 14,
    padding: 4,
    marginTop: 16,
  },
  periodButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 10,
  },
  periodButtonActive: {
    backgroundColor: AppColors.blue,
  },
  periodText: {
    color: AppColors.grey3,
    fontSize: 12,
    fontFamily: 'Montserrat',
  },
  periodTextActive: {
    color: AppColors.white,
  },
  insightGrid: {
    marginBottom: 22,
  },
  insightTile: {
    width: '48%',
    backgroundColor: AppColors.grey,
    borderRadius: 18,
    padding: 14,
    shadowColor: AppColors.grey3,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  insightIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  insightLabel: {
    color: AppColors.grey3,
    fontSize: 11,
    fontFamily: 'Montserrat',
  },
  insightValue: {
    color: AppColors.blue,
    fontSize: 15,
    marginTop: 3,
    fontFamily: 'Montserrat',
  },
  insightHint: {
    color: AppColors.primary,
    fontSize: 11,
    marginTop: 2,
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
