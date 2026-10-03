// @ts-nocheck
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Feather from '@expo/vector-icons/Feather'
import { BarChart } from 'react-native-gifted-charts'
import { AppColors } from '../../styles/colors'
import SignOut from '../../components/utils/SignOut'
import TransactionRow from '../../components/earnings/TransactionRow'
import { UserContext } from '../../context/UserContext'
import { performAuthenticatedRequest } from '../../utils/authenticatedRequest'
import {
  NEGATIVE_COLOR,
  PERIOD_OPTIONS,
  POSITIVE_COLOR,
  categoryCards,
  formatCompactAxis,
  formatDayAndDate,
  formatMoney,
  formatPercent,
  formatShortDate,
  getBucketSize,
  getDelta,
  parseApiDate,
  roundMoney,
} from '../../utils/earningsShared'
import type {
  EarningsCategoryDetailResponse,
  EarningsCategoryKey,
  EarningsPeriod,
  EarningsTransaction,
} from '../../types/earnings'

const PAGE_SIZE = 20
const TREND_Y_AXIS_WIDTH = 42

const CategoryEarningsScreen = ({ navigation, route }) => {
  const category: EarningsCategoryKey | undefined = route?.params?.category
  const meta = category ? categoryCards[category] : null

  const authContext = useContext(UserContext)
  const { width } = useWindowDimensions()
  const user = authContext?.user ?? null
  const tokens = authContext?.tokens ?? null
  const webServer = authContext?.webServer ?? ''
  const setTokens = authContext?.setTokens
  const isOwner = String(user?.role ?? '').trim().toLowerCase() === 'owner'

  const [selectedPeriod, setSelectedPeriod] = useState<EarningsPeriod>(
    route?.params?.period ?? '30d'
  )
  const [detail, setDetail] = useState<EarningsCategoryDetailResponse | null>(null)
  const [transactions, setTransactions] = useState<EarningsTransaction[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [loadMoreError, setLoadMoreError] = useState('')
  const [selectedBucket, setSelectedBucket] = useState<number | null>(null)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const requestSequenceRef = useRef(0)

  const fetchPage = useCallback(
    async (period: EarningsPeriod, pageNumber: number) => {
      const response = await performAuthenticatedRequest({
        endpoint: `${webServer}/api/v1/gyms/${user.gym_id}/earnings/${category}?period=${period}&page=${pageNumber}&per_page=${PAGE_SIZE}`,
        init: { method: 'GET' },
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        webServer,
        setTokens,
      })

      if (!response) {
        return { error: 'Please sign in again to view earnings.' }
      }

      const body = await response.json()
      if (response.status !== 200 || body.status !== 'success') {
        return { error: body.message || 'Unable to load earnings.' }
      }

      return { body }
    },
    [category, setTokens, tokens?.access_token, tokens?.refresh_token, user?.gym_id, webServer]
  )

  const loadDetail = useCallback(
    async (isPullRefresh = false) => {
      if (!meta) {
        setErrorMessage('This earnings category could not be found.')
        setIsLoading(false)
        return
      }

      if (!user?.gym_id || !tokens?.access_token || !setTokens) {
        setErrorMessage('Please sign in again to view earnings.')
        setIsLoading(false)
        return
      }

      if (!isOwner) {
        setErrorMessage('Only gym owners can view earnings.')
        setIsLoading(false)
        return
      }

      const requestId = ++requestSequenceRef.current
      if (!isPullRefresh) {
        setIsLoading(true)
      }
      setIsLoadingMore(false)
      setErrorMessage('')
      setLoadMoreError('')

      try {
        const result = await fetchPage(selectedPeriod, 1)
        if (requestId !== requestSequenceRef.current) {
          return
        }

        if (result.error) {
          setErrorMessage(result.error)
          setDetail(null)
          setTransactions([])
          return
        }

        setDetail(result.body)
        setTransactions(result.body.transactions.items)
        setPage(result.body.transactions.page)
        setHasMore(result.body.transactions.has_more)
        setSelectedBucket(null)
        setExpandedId(null)
      } catch {
        if (requestId === requestSequenceRef.current) {
          setErrorMessage('Unable to load earnings.')
          setDetail(null)
          setTransactions([])
        }
      } finally {
        if (requestId === requestSequenceRef.current) {
          setIsLoading(false)
          setIsRefreshing(false)
        }
      }
    },
    [fetchPage, isOwner, meta, selectedPeriod, setTokens, tokens?.access_token, user?.gym_id]
  )

  useEffect(() => {
    void loadDetail()
  }, [loadDetail])

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true)
    void loadDetail(true)
  }, [loadDetail])

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore || !detail) {
      return
    }

    const requestId = requestSequenceRef.current
    setIsLoadingMore(true)
    setLoadMoreError('')

    try {
      const result = await fetchPage(selectedPeriod, page + 1)
      if (requestId !== requestSequenceRef.current) {
        return
      }

      if (result.error) {
        setLoadMoreError(result.error)
        return
      }

      const next = result.body.transactions
      setTransactions((current) => {
        const seen = new Set(current.map((item) => item.payment_uid))
        return [...current, ...next.items.filter((item) => !seen.has(item.payment_uid))]
      })
      setPage(next.page)
      setHasMore(next.has_more)
    } catch {
      if (requestId === requestSequenceRef.current) {
        setLoadMoreError('Unable to load more transactions.')
      }
    } finally {
      if (requestId === requestSequenceRef.current) {
        setIsLoadingMore(false)
      }
    }
  }, [detail, fetchPage, hasMore, isLoadingMore, page, selectedPeriod])

  const currency = detail?.currency ?? 'USD'
  const periodMeta = PERIOD_OPTIONS.find((option) => option.key === selectedPeriod)
  const totals = detail?.totals
  const totalRevenue = totals?.revenue ?? 0
  const transactionCount = totals?.transaction_count ?? 0
  const isEmpty = Boolean(detail) && transactionCount === 0
  const rangeLabel = detail
    ? `${formatShortDate(detail.range.start_date)} – ${formatShortDate(detail.range.end_date)}`
    : ''

  const bucketSize = getBucketSize(selectedPeriod)
  const trendBuckets = useMemo(() => {
    const daily = detail?.daily ?? []
    const buckets = []

    for (let start = 0; start < daily.length; start += bucketSize) {
      const slice = daily.slice(start, start + bucketSize)
      buckets.push({
        startDate: slice[0].date,
        endDate: slice[slice.length - 1].date,
        revenue: roundMoney(slice.reduce((sum, row) => sum + row.revenue, 0)),
        count: slice.reduce((sum, row) => sum + row.transaction_count, 0),
      })
    }

    return buckets
  }, [bucketSize, detail])

  const activeBucketIndex = selectedBucket ?? trendBuckets.length - 1
  const activeBucket = trendBuckets[activeBucketIndex] ?? null
  const trendInnerWidth = width - 48 - 32 - TREND_Y_AXIS_WIDTH
  const trendMinSlot = bucketSize > 1 ? 56 : selectedPeriod === '7d' ? 0 : 30
  const trendSlot = Math.max(trendInnerWidth / Math.max(trendBuckets.length, 1), trendMinSlot)
  const trendBarWidth = Math.max(Math.floor(trendSlot * 0.55), 4)
  const barColor = meta?.color ?? AppColors.blue
  const trendData = trendBuckets.map((bucket, index) => {
    const date = parseApiDate(bucket.startDate)
    let label = ''

    if (bucketSize > 1) {
      label = formatShortDate(bucket.startDate)
    } else if (selectedPeriod === '7d') {
      label = date ? new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(date) : ''
    } else {
      label = date ? String(date.getDate()) : ''
    }

    const isActive = index === activeBucketIndex

    return {
      value: bucket.revenue,
      label,
      frontColor: isActive ? barColor : `${barColor}66`,
      labelTextStyle: isActive ? styles.trendLabelActive : styles.trendLabel,
      onPress: () => setSelectedBucket(index),
    }
  })

  const breakdownItems = detail?.breakdown.items ?? []
  const breakdownMax = Math.max(...breakdownItems.map((item) => item.revenue), 0)

  const revenueDelta = getDelta(totalRevenue, detail?.previous?.revenue)
  const transactionDelta = getDelta(transactionCount, detail?.previous?.transaction_count)

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

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.stateCard}>
          <ActivityIndicator color={AppColors.blue} />
          <Text style={styles.stateText}>Loading {meta?.title.toLowerCase()} earnings...</Text>
        </View>
      )
    }

    if (errorMessage && !detail) {
      return (
        <View style={styles.stateCard}>
          <Feather name="alert-circle" size={26} color={NEGATIVE_COLOR} />
          <Text style={styles.stateTitle}>Unable to load earnings</Text>
          <Text style={styles.stateText}>{errorMessage}</Text>
          {meta && isOwner ? (
            <TouchableOpacity style={styles.retryButton} onPress={() => void loadDetail()}>
              <Text style={styles.retryButtonText}>Try again</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      )
    }

    if (!detail) {
      return null
    }

    return (
      <>
        <View style={styles.summaryRow}>
          <View style={styles.summaryPill}>
            <Text style={styles.summaryLabel}>Revenue</Text>
            <Text style={styles.summaryValue}>{formatMoney(totalRevenue, currency)}</Text>
            {renderDelta(revenueDelta)}
          </View>
          <View style={styles.summaryPill}>
            <Text style={styles.summaryLabel}>Transactions</Text>
            <Text style={styles.summaryValue}>{transactionCount}</Text>
            {renderDelta(transactionDelta)}
          </View>
        </View>

        {isEmpty ? (
          <View style={styles.stateCard}>
            <Feather name="inbox" size={26} color={AppColors.grey2} />
            <Text style={styles.stateTitle}>No {meta.title.toLowerCase()} sales yet</Text>
            <Text style={styles.stateText}>
              Nothing was paid for in this period. Try a longer time range.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.statRow}>
              <View style={styles.statTile}>
                <Text style={styles.statLabel}>Avg. sale</Text>
                <Text style={styles.statValue} numberOfLines={1}>
                  {formatMoney(totals.average_sale, currency)}
                </Text>
              </View>
              <View style={styles.statTile}>
                <Text style={styles.statLabel}>Customers</Text>
                <Text style={styles.statValue}>{totals.unique_customers}</Text>
              </View>
              <View style={styles.statTile}>
                <Text style={styles.statLabel}>Repeat buyers</Text>
                <Text style={styles.statValue}>
                  {totals.unique_customers > 0
                    ? formatPercent(totals.repeat_customers / totals.unique_customers)
                    : '0%'}
                </Text>
              </View>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Revenue trend</Text>
              <Text style={styles.sectionSubtitle}>Tap a bar to see that period</Text>
            </View>

            <View style={styles.card}>
              {activeBucket ? (
                <View style={styles.trendSummary}>
                  <View>
                    <Text style={styles.trendSummaryDate}>
                      {bucketSize === 1
                        ? formatDayAndDate(activeBucket.startDate)
                        : `${formatShortDate(activeBucket.startDate)} – ${formatShortDate(activeBucket.endDate)}`}
                    </Text>
                    <Text style={styles.trendSummaryValue}>
                      {formatMoney(activeBucket.revenue, currency)}
                    </Text>
                  </View>
                  <Text style={styles.trendSummaryCount}>
                    {activeBucket.count} {activeBucket.count === 1 ? 'sale' : 'sales'}
                  </Text>
                </View>
              ) : null}

              <BarChart
                data={trendData}
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
                rulesColor={AppColors.grey4}
                yAxisTextStyle={styles.trendAxisText}
                formatYLabel={formatCompactAxis}
                barBorderTopLeftRadius={4}
                barBorderTopRightRadius={4}
                showScrollIndicator={false}
                scrollToEnd={trendBuckets.length * trendSlot > trendInnerWidth}
                isAnimated
                animationDuration={500}
              />
            </View>

            {breakdownItems.length > 0 ? (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>{detail.breakdown.title}</Text>
                  <Text style={styles.sectionSubtitle}>Ranked by revenue</Text>
                </View>

                <View style={styles.card}>
                  {breakdownItems.map((item, index) => (
                    <View
                      key={`${item.name}-${index}`}
                      style={[styles.breakdownRow, index > 0 && styles.breakdownRowSpaced]}
                    >
                      <View style={styles.breakdownTop}>
                        <Text style={styles.breakdownRank}>{index + 1}</Text>
                        <Text style={styles.breakdownName} numberOfLines={1}>
                          {item.name}
                        </Text>
                        <Text style={styles.breakdownRevenue}>
                          {formatMoney(item.revenue, currency)}
                        </Text>
                      </View>
                      <View style={styles.breakdownTrack}>
                        <View
                          style={[
                            styles.breakdownFill,
                            {
                              width: `${breakdownMax > 0 ? Math.max((item.revenue / breakdownMax) * 100, 3) : 0}%`,
                              backgroundColor: barColor,
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.breakdownCount}>
                        {item.count} {detail.breakdown.count_label}
                      </Text>
                    </View>
                  ))}
                </View>
              </>
            ) : null}

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Customer purchases</Text>
              <Text style={styles.sectionSubtitle}>
                {detail.transactions.total}{' '}
                {detail.transactions.total === 1 ? 'transaction' : 'transactions'} · newest first · tap
                a row for details
              </Text>
            </View>

            <View style={styles.txList}>
              {transactions.map((transaction) => (
                <TransactionRow
                  key={transaction.payment_uid}
                  transaction={transaction}
                  category={category}
                  color={barColor}
                  expanded={expandedId === transaction.payment_uid}
                  onToggle={() =>
                    setExpandedId((current) =>
                      current === transaction.payment_uid ? null : transaction.payment_uid
                    )
                  }
                />
              ))}
            </View>

            {loadMoreError ? <Text style={styles.loadMoreError}>{loadMoreError}</Text> : null}

            {hasMore ? (
              <TouchableOpacity
                style={styles.loadMoreButton}
                activeOpacity={0.85}
                onPress={() => void loadMore()}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? (
                  <ActivityIndicator color={AppColors.white} size="small" />
                ) : (
                  <Text style={styles.loadMoreText}>
                    Load more ({detail.transactions.total - transactions.length} remaining)
                  </Text>
                )}
              </TouchableOpacity>
            ) : transactions.length > PAGE_SIZE ? (
              <Text style={styles.endText}>You've reached the end of the list.</Text>
            ) : null}
          </>
        )}
      </>
    )
  }

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
          <View style={styles.headingIcon}>{meta?.icon}</View>
          <Text style={styles.title}>{meta?.title ?? 'Earnings'}</Text>
          <Text style={styles.subtitle}>{rangeLabel || 'Revenue and transaction details'}</Text>
        </View>

        <View style={styles.body}>
          <View style={styles.periodRow}>
            {PERIOD_OPTIONS.map((option) => {
              const active = option.key === selectedPeriod

              return (
                <TouchableOpacity
                  key={option.key}
                  activeOpacity={0.85}
                  style={[
                    styles.periodButton,
                    active && { backgroundColor: meta?.color ?? AppColors.blue },
                  ]}
                  onPress={() => setSelectedPeriod(option.key)}
                >
                  <Text style={[styles.periodText, active && styles.periodTextActive]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>

          {renderContent()}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

export default CategoryEarningsScreen

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
  headingIcon: {
    width: 58,
    height: 58,
    borderRadius: 16,
    backgroundColor: AppColors.grey,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  title: {
    color: AppColors.blue,
    fontSize: 28,
    fontFamily: 'Montserrat',
    textAlign: 'center',
  },
  subtitle: {
    color: AppColors.grey3,
    fontSize: 14,
    marginTop: 6,
    fontFamily: 'Montserrat',
  },
  body: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  periodRow: {
    flexDirection: 'row',
    backgroundColor: AppColors.grey,
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
  },
  periodButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 10,
  },
  periodText: {
    color: AppColors.grey3,
    fontSize: 12,
    fontFamily: 'Montserrat',
  },
  periodTextActive: {
    color: AppColors.white,
    fontFamily: 'Montserrat-Bold',
  },
  stateCard: {
    backgroundColor: AppColors.grey,
    borderRadius: 20,
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  stateTitle: {
    color: AppColors.blue,
    fontSize: 15,
    fontFamily: 'Montserrat-Bold',
    textAlign: 'center',
  },
  stateText: {
    color: AppColors.grey3,
    fontSize: 13,
    fontFamily: 'Montserrat',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: AppColors.blue,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: 4,
  },
  retryButtonText: {
    color: AppColors.white,
    fontSize: 13,
    fontFamily: 'Montserrat-Bold',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  summaryPill: {
    flex: 1,
    backgroundColor: AppColors.grey,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  summaryLabel: {
    color: AppColors.grey3,
    fontSize: 11,
    fontFamily: 'Montserrat',
  },
  summaryValue: {
    color: AppColors.primary,
    fontSize: 20,
    marginTop: 4,
    fontFamily: 'Montserrat-Bold',
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
  statRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 22,
  },
  statTile: {
    flex: 1,
    backgroundColor: AppColors.grey,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  statLabel: {
    color: AppColors.grey3,
    fontSize: 10,
    fontFamily: 'Montserrat',
  },
  statValue: {
    color: AppColors.blue,
    fontSize: 15,
    marginTop: 3,
    fontFamily: 'Montserrat-Bold',
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    color: AppColors.blue,
    fontSize: 14,
    fontFamily: 'Montserrat-Bold',
  },
  sectionSubtitle: {
    color: AppColors.grey3,
    fontSize: 11,
    marginTop: 4,
    fontFamily: 'Montserrat',
  },
  card: {
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: AppColors.white,
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
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
  breakdownRow: {},
  breakdownRowSpaced: {
    marginTop: 14,
  },
  breakdownTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breakdownRank: {
    width: 20,
    color: AppColors.grey3,
    fontSize: 12,
    fontFamily: 'Montserrat-Bold',
  },
  breakdownName: {
    flex: 1,
    color: AppColors.blue,
    fontSize: 13,
    fontFamily: 'Montserrat-Bold',
    marginRight: 10,
  },
  breakdownRevenue: {
    color: AppColors.primary,
    fontSize: 13,
    fontFamily: 'Montserrat-Bold',
  },
  breakdownTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: AppColors.white,
    marginTop: 8,
    overflow: 'hidden',
  },
  breakdownFill: {
    height: '100%',
    borderRadius: 3,
  },
  breakdownCount: {
    color: AppColors.grey3,
    fontSize: 10,
    marginTop: 5,
    fontFamily: 'Montserrat',
  },
  txList: {
    gap: 8,
  },
  loadMoreButton: {
    backgroundColor: AppColors.blue,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 14,
  },
  loadMoreText: {
    color: AppColors.white,
    fontSize: 13,
    fontFamily: 'Montserrat-Bold',
  },
  loadMoreError: {
    color: NEGATIVE_COLOR,
    fontSize: 12,
    fontFamily: 'Montserrat',
    textAlign: 'center',
    marginTop: 12,
  },
  endText: {
    color: AppColors.grey3,
    fontSize: 12,
    fontFamily: 'Montserrat',
    textAlign: 'center',
    marginTop: 16,
  },
})
