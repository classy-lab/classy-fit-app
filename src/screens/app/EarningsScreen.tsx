// @ts-nocheck
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Animated,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import Feather from '@expo/vector-icons/Feather'
import { BarChart, PieChart } from 'react-native-gifted-charts'
import { AppColors } from '../../styles/colors'
import SignOut from '../../components/utils/SignOut'
import { UserContext } from '../../context/UserContext'
import { formatUsd } from '../../utils/currency'
import {
  NEGATIVE_COLOR,
  PERIOD_OPTIONS,
  POSITIVE_COLOR,
  allEarningsCard,
  categoryCards,
  categoryOrder,
  formatCompactAxis,
  formatDayAndDate,
  formatPercent,
  formatShortDate,
  getDelta,
  parseApiDate,
} from '../../utils/earningsShared'
import type {
  EarningsApiResponse,
  EarningsCategoryKey,
  EarningsPeriod,
} from '../../types/earnings'

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

  if (response.status !== 401) {
    return response
  }

  const refreshedAccessToken = await refreshAccessTokenWithRefresh({
    refreshToken,
    webServer,
    setTokens,
  })

  if (!refreshedAccessToken) {
    return response
  }

  return requestWithToken(refreshedAccessToken)
}

const TREND_Y_AXIS_WIDTH = 42

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
  const [selectedBucket, setSelectedBucket] = useState<number | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<EarningsPeriod>('7d')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const requestSequenceRef = useRef(0)
  const donutAnim = useRef(new Animated.Value(0)).current
  const [isCheckingStripeStatus, setIsCheckingStripeStatus] = useState(true)
  const [isStripeConfigured, setIsStripeConfigured] = useState(false)
  const [isLoadingStripe, setIsLoadingStripe] = useState(false)
  const [stripeErrorMessage, setStripeErrorMessage] = useState('')
  const stripeStatusSequenceRef = useRef(0)
  const stripeOnboardingInFlightRef = useRef(false)

  const isOwner = String(user?.role ?? '').trim().toLowerCase() === 'owner'

  const checkStripeAccountStatus = useCallback(async () => {
    const requestId = ++stripeStatusSequenceRef.current
    setIsStripeConfigured(false)
    setStripeErrorMessage('')

    if (!isOwner) {
      setIsCheckingStripeStatus(false)
      return
    }
    if (!user?.gym_id || !tokens?.access_token || !setTokens) {
      setStripeErrorMessage('Please sign in again to check Stripe setup.')
      setIsCheckingStripeStatus(false)
      return
    }

    setIsCheckingStripeStatus(true)
    try {
      const response = await performAuthenticatedRequest({
        endpoint: `${webServer}/api/v1/gyms/${user.gym_id}/stripe/accounts/status`,
        init: { method: 'GET' },
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        webServer,
        setTokens,
      })
      if (requestId !== stripeStatusSequenceRef.current) return
      if (!response) {
        setStripeErrorMessage('Please sign in again to check Stripe setup.')
        return
      }
      if (response.status === 404) return

      const data = await response.json()
      if (requestId !== stripeStatusSequenceRef.current) return
      if (response.status !== 200) {
        setStripeErrorMessage(data?.message || 'Unable to check Stripe setup. You can retry setup below.')
        return
      }

      const account = data?.account
      const fullyConfigured =
        !!account?.stripe_account_id &&
        account?.onboarding_status === 'complete' &&
        account?.details_submitted === true &&
        account?.charges_enabled === true &&
        account?.payouts_enabled === true
      setIsStripeConfigured(fullyConfigured)
    } catch {
      if (requestId === stripeStatusSequenceRef.current) {
        setStripeErrorMessage('Unable to check Stripe setup. You can retry setup below.')
      }
    } finally {
      if (requestId === stripeStatusSequenceRef.current) setIsCheckingStripeStatus(false)
    }
  }, [isOwner, setTokens, tokens?.access_token, tokens?.refresh_token, user?.gym_id, webServer])

  useFocusEffect(useCallback(() => {
    void checkStripeAccountStatus()
    return () => { stripeStatusSequenceRef.current++ }
  }, [checkStripeAccountStatus]))

  const handleConnectStripe = async () => {
    if (!isOwner || stripeOnboardingInFlightRef.current) return
    if (!user?.gym_id || !tokens?.access_token || !setTokens) {
      Alert.alert('Stripe setup', 'Please sign in again to set up Stripe payments.')
      return
    }

    stripeOnboardingInFlightRef.current = true
    setIsLoadingStripe(true)
    try {
      const response = await performAuthenticatedRequest({
        endpoint: `${webServer}/api/v1/gyms/${user.gym_id}/stripe/accounts/onboarding-link`,
        init: { method: 'GET' },
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        webServer,
        setTokens,
      })
      if (!response) {
        Alert.alert('Stripe setup', 'Please sign in again to set up Stripe payments.')
        return
      }
      const data = await response.json()
      if (response.status !== 200) {
        Alert.alert('Stripe setup', data?.message || 'Failed to get Stripe onboarding link.')
        return
      }

      const onboardingUrl = typeof data?.onboarding_url === 'string' ? data.onboarding_url.trim() : ''
      let validUrl = false
      try {
        const url = new URL(onboardingUrl)
        validUrl = url.protocol === 'https:' && !!url.hostname && !url.username && !url.password
      } catch {
        validUrl = false
      }
      if (!validUrl) {
        Alert.alert('Stripe setup', 'Invalid onboarding link received from server.')
        return
      }

      try {
        await Linking.openURL(onboardingUrl)
      } catch {
        Alert.alert('Stripe setup', 'Unable to open Stripe onboarding link.')
      }
    } catch {
      Alert.alert('Stripe setup', 'Failed to initiate Stripe Connect setup.')
    } finally {
      stripeOnboardingInFlightRef.current = false
      setIsLoadingStripe(false)
    }
  }

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
      setSelectedBucket(null)
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
    void checkStripeAccountStatus()
  }, [checkStripeAccountStatus, loadEarnings])

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

  // USD only: earnings are always formatted as US dollars regardless of device locale.
  const formatCurrency = useCallback((value: number) => formatUsd(value), [])

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
  const bucketSize = selectedPeriod === '90d' ? 7 : selectedPeriod === '1y' ? 30 : 1
  const trendBuckets = useMemo(() => {
    const daily = earnings?.daily ?? []
    const buckets = []

    for (let start = 0; start < daily.length; start += bucketSize) {
      const end = Math.min(start + bucketSize, daily.length)
      const byCategory = {}
      let revenue = 0
      let count = 0

      categoryOrder.forEach((key) => {
        const rows = (earnings?.category_daily?.[key] ?? []).slice(start, end)
        byCategory[key] = rows.reduce((sum, row) => sum + row.revenue, 0)
        revenue += byCategory[key]
        count += rows.reduce((sum, row) => sum + row.transaction_count, 0)
      })

      buckets.push({
        startDate: daily[start].date,
        endDate: daily[end - 1].date,
        byCategory,
        revenue,
        count,
      })
    }

    return buckets
  }, [bucketSize, earnings])
  const activeBucketIndex = selectedBucket ?? trendBuckets.length - 1
  const activeBucket = trendBuckets[activeBucketIndex] ?? null
  const trendInnerWidth = width - 48 - 32 - TREND_Y_AXIS_WIDTH
  const trendMinSlot = bucketSize > 1 ? 56 : selectedPeriod === '7d' ? 0 : 30
  const trendSlot = Math.max(trendInnerWidth / Math.max(trendBuckets.length, 1), trendMinSlot)
  const trendBarWidth = Math.max(Math.floor(trendSlot * 0.55), 4)
  const trendStackData = trendBuckets.map((bucket, index) => {
    const date = parseApiDate(bucket.startDate)
    let label = ''

    if (bucketSize > 1) {
      label = formatShortDate(bucket.startDate)
    } else if (selectedPeriod === '7d') {
      label = date
        ? new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(date)
        : ''
    } else {
      label = date ? String(date.getDate()) : ''
    }

    return {
      label,
      labelTextStyle: index === activeBucketIndex ? styles.trendLabelActive : styles.trendLabel,
      onPress: () => setSelectedBucket(index),
      stacks: categoryOrder.map((key) => ({
        value: bucket.byCategory[key],
        color:
          selectedCategory && selectedCategory !== key
            ? `${categoryCards[key].color}33`
            : categoryCards[key].color,
      })),
    }
  })
  const revenueDelta = getDelta(totalRevenue, earnings?.previous?.revenue)
  const transactionDelta = getDelta(transactionCount, earnings?.previous?.transaction_count)
  const renderDelta = (delta) => {
    if (!delta) {
      return null
    }

    const color =
      delta.direction === 'up'
        ? POSITIVE_COLOR
        : delta.direction === 'down'
          ? NEGATIVE_COLOR
          : AppColors.grey3
    const iconName =
      delta.direction === 'up'
        ? 'arrow-up-right'
        : delta.direction === 'down'
          ? 'arrow-down-right'
          : 'minus'

    return (
      <View style={styles.deltaRow}>
        <Feather name={iconName} size={12} color={color} />
        <Text style={[styles.deltaText, { color }]} numberOfLines={1}>
          {delta.label} <Text style={styles.deltaSuffix}>vs {periodMeta?.previousLabel}</Text>
        </Text>
      </View>
    )
  }
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
          {isOwner && !isCheckingStripeStatus && !isStripeConfigured ? (
            <View style={styles.stripeCard}>
              <TouchableOpacity
                style={styles.stripeAction}
                onPress={handleConnectStripe}
                disabled={isLoadingStripe}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityState={{ disabled: isLoadingStripe, busy: isLoadingStripe }}
              >
                <Feather name="credit-card" size={24} color={AppColors.blue} />
                <View style={styles.stripeText}>
                  <Text style={styles.stripeTitle}>Connect Stripe Account</Text>
                  <Text style={styles.stripeSubtitle}>Set up payments for your gym</Text>
                </View>
                {isLoadingStripe ? (
                  <ActivityIndicator color={AppColors.blue} />
                ) : (
                  <Feather name="arrow-right" size={20} color={AppColors.blue} />
                )}
              </TouchableOpacity>
              {stripeErrorMessage ? (
                <Text style={styles.stripeSubtitle} accessibilityRole="alert">{stripeErrorMessage}</Text>
              ) : null}
            </View>
          ) : null}
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
                {renderDelta(revenueDelta)}
              </View>
              <View style={styles.summaryPill}>
                <Text style={styles.summaryLabel}>Transactions</Text>
                <Text style={styles.summaryValue}>{transactionCount}</Text>
                {renderDelta(transactionDelta)}
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

          {hasData && !isLoading && trendBuckets.length > 0 ? (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Revenue trend</Text>
                <Text style={styles.sectionSubtitle}>
                  {selectedCategory
                    ? `Highlighting ${categoryCards[selectedCategory].title} · tap a bar for details`
                    : 'Tap a bar to see that period\'s breakdown'}
                </Text>
              </View>

              <View style={styles.trendCard}>
                {activeBucket ? (
                  <View style={styles.trendSummary}>
                    <View style={styles.trendSummaryTop}>
                      <View>
                        <Text style={styles.trendSummaryDate}>
                          {bucketSize === 1
                            ? formatDayAndDate(activeBucket.startDate)
                            : `${formatShortDate(activeBucket.startDate)} – ${formatShortDate(activeBucket.endDate)}`}
                        </Text>
                        <Text style={styles.trendSummaryValue}>
                          {formatCurrency(activeBucket.revenue)}
                        </Text>
                      </View>
                      <Text style={styles.trendSummaryCount}>{activeBucket.count} sales</Text>
                    </View>
                    <View style={styles.trendChips}>
                      {categoryOrder.map((key) => (
                        <View key={key} style={styles.trendChip}>
                          <View
                            style={[styles.trendChipDot, { backgroundColor: categoryCards[key].color }]}
                          />
                          <Text style={styles.trendChipText} numberOfLines={1}>
                            {categoryCards[key].title} {formatCurrency(activeBucket.byCategory[key])}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ) : null}

                <BarChart
                  stackData={trendStackData}
                  width={trendInnerWidth}
                  height={160}
                  barWidth={trendBarWidth}
                  spacing={Math.max(trendSlot - trendBarWidth, 2)}
                  initialSpacing={Math.max((trendSlot - trendBarWidth) / 2, 4)}
                  endSpacing={8}
                  labelWidth={trendSlot}
                  noOfSections={4}
                  yAxisLabelWidth={TREND_Y_AXIS_WIDTH}
                  yAxisThickness={0}
                  xAxisColor={AppColors.grey2}
                  rulesColor={AppColors.grey2}
                  yAxisTextStyle={styles.trendAxisText}
                  formatYLabel={formatCompactAxis}
                  showScrollIndicator={false}
                  scrollToEnd={trendBuckets.length * trendSlot > trendInnerWidth}
                  isAnimated
                  animationDuration={500}
                />
              </View>
            </>
          ) : null}

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
              <TouchableOpacity
                key={card.key}
                activeOpacity={0.9}
                style={styles.squareCard}
                onPress={() =>
                  navigation.navigate('CategoryEarningsScreen', {
                    category: card.key,
                    period: selectedPeriod,
                  })
                }
              >
                <View style={styles.iconWrap}>{card.icon}</View>
                <Text style={styles.squareTitle}>{card.title}</Text>
                <Text style={styles.squareValue}>{formatCurrency(card.summary.revenue)}</Text>
                <Text style={styles.squareCount}>{card.summary.transaction_count} transactions</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.wideCard}
              onPress={() =>
                navigation.navigate('AllCategoriesEarningsScreen', { period: selectedPeriod })
              }
            >
              <View style={[styles.iconWrap, styles.wideCardIcon]}>{allEarningsCard.icon}</View>
              <View style={styles.wideCardText}>
                <Text style={styles.wideCardTitle}>{allEarningsCard.title}</Text>
                <Text style={styles.wideCardValue}>{formatCurrency(totalRevenue)}</Text>
                <Text style={styles.wideCardCount}>{transactionCount} transactions</Text>
              </View>
              <Feather name="chevron-right" size={22} color={AppColors.grey2} />
            </TouchableOpacity>
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
  stripeCard: {
    borderWidth: 1,
    borderColor: AppColors.grey2,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    backgroundColor: AppColors.white,
  },
  stripeAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stripeText: { flex: 1 },
  stripeTitle: {
    color: AppColors.blue,
    fontFamily: 'Montserrat-Bold',
    fontSize: 16,
  },
  stripeSubtitle: {
    color: AppColors.grey3,
    fontFamily: 'Montserrat',
    fontSize: 13,
    marginTop: 6,
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
  deltaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 4,
  },
  deltaText: {
    fontSize: 10,
    fontFamily: 'Montserrat-Bold',
  },
  deltaSuffix: {
    color: AppColors.grey3,
    fontFamily: 'Montserrat',
  },
  trendCard: {
    backgroundColor: AppColors.grey,
    borderRadius: 20,
    padding: 16,
    marginBottom: 22,
    shadowColor: AppColors.grey3,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  trendSummary: {
    backgroundColor: AppColors.white,
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
  },
  trendSummaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  trendSummaryDate: {
    color: AppColors.grey3,
    fontSize: 11,
    fontFamily: 'Montserrat',
  },
  trendSummaryValue: {
    color: AppColors.primary,
    fontSize: 20,
    marginTop: 2,
    fontFamily: 'Montserrat-Bold',
  },
  trendSummaryCount: {
    color: AppColors.grey3,
    fontSize: 11,
    fontFamily: 'Montserrat',
  },
  trendChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  trendChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.grey,
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  trendChipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  trendChipText: {
    color: AppColors.blue,
    fontSize: 10,
    fontFamily: 'Montserrat',
  },
  trendAxisText: {
    color: AppColors.grey3,
    fontSize: 10,
    fontFamily: 'Montserrat',
  },
  trendLabel: {
    color: AppColors.grey3,
    fontSize: 10,
    fontFamily: 'Montserrat',
  },
  trendLabelActive: {
    color: AppColors.blue,
    fontSize: 10,
    fontFamily: 'Montserrat-Bold',
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
  wideCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.grey,
    borderRadius: 20,
    padding: 16,
    shadowColor: AppColors.grey3,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  wideCardIcon: {
    marginBottom: 0,
    marginRight: 14,
  },
  wideCardText: {
    flex: 1,
  },
  wideCardTitle: {
    color: AppColors.blue,
    fontSize: 15,
    fontFamily: 'Montserrat',
  },
  wideCardValue: {
    color: AppColors.primary,
    fontSize: 18,
    marginTop: 6,
    fontFamily: 'Montserrat',
  },
  wideCardCount: {
    color: AppColors.grey3,
    fontSize: 11,
    marginTop: 4,
    fontFamily: 'Montserrat',
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