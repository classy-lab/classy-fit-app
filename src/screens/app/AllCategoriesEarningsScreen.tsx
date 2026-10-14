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
import {
  NEGATIVE_COLOR,
  PERIOD_OPTIONS,
  POSITIVE_COLOR,
  allEarningsCard,
  categoryCards,
  categoryOrder,
  formatCompactAxis,
  formatDayAndDate,
  formatMoney,
  formatPercent,
  formatShortDate,
  getBucketSize,
  getDelta,
  getInitials,
  parseApiDate,
  roundMoney,
} from '../../utils/earningsShared'
import type {
  EarningsAllResponse,
  EarningsCategoryKey,
  EarningsPeriod,
  EarningsTransaction,
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

const transactionKey = (transaction: EarningsTransaction) =>
  `${transaction.category}-${transaction.payment_uid}`

const AllCategoriesEarningsScreen = ({ navigation, route }) => {
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
  const [detail, setDetail] = useState<EarningsAllResponse | null>(null)
  const [transactions, setTransactions] = useState<EarningsTransaction[]>([])
  const [listTotal, setListTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [filter, setFilter] = useState<EarningsCategoryKey | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isListLoading, setIsListLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [listError, setListError] = useState('')
  const [selectedBucket, setSelectedBucket] = useState<number | null>(null)
  const [expandedKey, setExpandedKey] = useState<string | null>(null)
  const detailRequestRef = useRef(0)
  const listRequestRef = useRef(0)
  const filterRef = useRef<EarningsCategoryKey | null>(null)

  const fetchPage = useCallback(
    async (period: EarningsPeriod, pageNumber: number, filterKey, transactionsOnly = false) => {
      const query = [
        `period=${period}`,
        `page=${pageNumber}`,
        `per_page=${PAGE_SIZE}`,
        filterKey ? `filter=${filterKey}` : '',
        transactionsOnly ? 'section=transactions' : '',
      ]
        .filter(Boolean)
        .join('&')

      const response = await performAuthenticatedRequest({
        endpoint: `${webServer}/api/v1/gyms/${user.gym_id}/earnings/all?${query}`,
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
    [setTokens, tokens?.access_token, tokens?.refresh_token, user?.gym_id, webServer]
  )

  const applyTransactions = (page) => {
    setTransactions(page.items)
    setListTotal(page.total)
    setPage(page.page)
    setHasMore(page.has_more)
    setExpandedKey(null)
  }

  const loadDetail = useCallback(
    async (isPullRefresh = false) => {
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

      const requestId = ++detailRequestRef.current
      // A full reload supersedes any list request that is still running.
      listRequestRef.current += 1
      if (!isPullRefresh) {
        setIsLoading(true)
      }
      setIsListLoading(false)
      setIsLoadingMore(false)
      setErrorMessage('')
      setListError('')

      try {
        const result = await fetchPage(selectedPeriod, 1, filterRef.current)
        if (requestId !== detailRequestRef.current) {
          return
        }

        if (result.error) {
          setErrorMessage(result.error)
          setDetail(null)
          setTransactions([])
          return
        }

        setDetail(result.body)
        applyTransactions(result.body.transactions)
        setSelectedBucket(null)
      } catch {
        if (requestId === detailRequestRef.current) {
          setErrorMessage('Unable to load earnings.')
          setDetail(null)
          setTransactions([])
        }
      } finally {
        if (requestId === detailRequestRef.current) {
          setIsLoading(false)
          setIsRefreshing(false)
        }
      }
    },
    [fetchPage, isOwner, selectedPeriod, setTokens, tokens?.access_token, user?.gym_id]
  )

  useEffect(() => {
    void loadDetail()
  }, [loadDetail])

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true)
    void loadDetail(true)
  }, [loadDetail])

  const handlePeriodChange = (period: EarningsPeriod) => {
    filterRef.current = null
    setFilter(null)
    setSelectedPeriod(period)
  }

  const handleFilterChange = async (nextFilter: EarningsCategoryKey | null) => {
    if (nextFilter === filterRef.current || isLoading) {
      return
    }

    filterRef.current = nextFilter
    setFilter(nextFilter)

    const requestId = ++listRequestRef.current
    setIsListLoading(true)
    setIsLoadingMore(false)
    setListError('')

    try {
      const result = await fetchPage(selectedPeriod, 1, nextFilter, true)
      if (requestId !== listRequestRef.current) {
        return
      }

      if (result.error) {
        setListError(result.error)
        return
      }

      applyTransactions(result.body.transactions)
    } catch {
      if (requestId === listRequestRef.current) {
        setListError('Unable to load transactions.')
      }
    } finally {
      if (requestId === listRequestRef.current) {
        setIsListLoading(false)
      }
    }
  }

  const loadMore = useCallback(async () => {
    if (isLoadingMore || isListLoading || !hasMore || !detail) {
      return
    }

    const requestId = listRequestRef.current
    setIsLoadingMore(true)
    setListError('')

    try {
      const result = await fetchPage(selectedPeriod, page + 1, filterRef.current, true)
      if (requestId !== listRequestRef.current) {
        return
      }

      if (result.error) {
        setListError(result.error)
        return
      }

      const next = result.body.transactions
      setTransactions((current) => {
        const seen = new Set(current.map(transactionKey))
        return [...current, ...next.items.filter((item) => !seen.has(transactionKey(item)))]
      })
      setPage(next.page)
      setHasMore(next.has_more)
    } catch {
      if (requestId === listRequestRef.current) {
        setListError('Unable to load more transactions.')
      }
    } finally {
      if (requestId === listRequestRef.current) {
        setIsLoadingMore(false)
      }
    }
  }, [detail, fetchPage, hasMore, isListLoading, isLoadingMore, page, selectedPeriod])

  const currency = detail?.currency ?? 'USD'
  const periodMeta = PERIOD_OPTIONS.find((option) => option.key === selectedPeriod)
  const totals = detail?.totals
  const totalRevenue = totals?.revenue ?? 0
  const transactionCount = totals?.transaction_count ?? 0
  const isEmpty = Boolean(detail) && transactionCount === 0
  const rangeLabel = detail
    ? `${formatShortDate(detail.range.start_date)} – ${formatShortDate(detail.range.end_date)}`
    : ''

  const categoryRows = useMemo(
    () =>
      categoryOrder
        .map((key) => ({
          key,
          ...categoryCards[key],
          revenue: detail?.by_category?.[key]?.revenue ?? 0,
          count: detail?.by_category?.[key]?.transaction_count ?? 0,
        }))
        .sort((a, b) => b.revenue - a.revenue),
    [detail]
  )
  const maxCategoryRevenue = Math.max(...categoryRows.map((row) => row.revenue), 0)

  const bucketSize = getBucketSize(selectedPeriod)
  const trendBuckets = useMemo(() => {
    const daily = detail?.daily ?? []
    const buckets = []

    for (let start = 0; start < daily.length; start += bucketSize) {
      const end = Math.min(start + bucketSize, daily.length)
      const byCategory = {}
      let revenue = 0
      let count = 0

      categoryOrder.forEach((key) => {
        const rows = (detail?.category_daily?.[key] ?? []).slice(start, end)
        byCategory[key] = roundMoney(rows.reduce((sum, row) => sum + row.revenue, 0))
        revenue += byCategory[key]
        count += rows.reduce((sum, row) => sum + row.transaction_count, 0)
      })

      buckets.push({
        startDate: daily[start].date,
        endDate: daily[end - 1].date,
        byCategory,
        revenue: roundMoney(revenue),
        count,
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
  const trendStackData = trendBuckets.map((bucket, index) => {
    const date = parseApiDate(bucket.startDate)
    let label = ''

    if (bucketSize > 1) {
      label = formatShortDate(bucket.startDate)
    } else if (selectedPeriod === '7d') {
      label = date ? new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(date) : ''
    } else {
      label = date ? String(date.getDate()) : ''
    }

    return {
      label,
      labelTextStyle: index === activeBucketIndex ? styles.trendLabelActive : styles.trendLabel,
      onPress: () => setSelectedBucket(index),
      stacks: categoryOrder.map((key) => ({
        value: bucket.byCategory[key],
        color: filter && filter !== key ? `${categoryCards[key].color}33` : categoryCards[key].color,
      })),
    }
  })

  const revenueDelta = getDelta(totalRevenue, detail?.previous?.revenue)
  const transactionDelta = getDelta(transactionCount, detail?.previous?.transaction_count)
  const topCustomers = detail?.top_customers ?? []

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

  const renderTransactions = () => {
    if (isListLoading) {
      return (
        <View style={styles.listState}>
          <ActivityIndicator color={AppColors.blue} />
        </View>
      )
    }

    if (transactions.length === 0 && !listError) {
      return (
        <View style={styles.listState}>
          <Text style={styles.stateText}>No transactions for this selection.</Text>
        </View>
      )
    }

    return (
      <View style={styles.txList}>
        {transactions.map((transaction) => {
          const key = transactionKey(transaction)

          return (
            <TransactionRow
              key={key}
              transaction={transaction}
              category={transaction.category}
              color={categoryCards[transaction.category]?.color ?? AppColors.blue}
              showCategory={!filter}
              expanded={expandedKey === key}
              onToggle={() => setExpandedKey((current) => (current === key ? null : key))}
            />
          )
        })}
      </View>
    )
  }

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.stateCard}>
          <ActivityIndicator color={AppColors.blue} />
          <Text style={styles.stateText}>Loading all earnings...</Text>
        </View>
      )
    }

    if (errorMessage && !detail) {
      return (
        <View style={styles.stateCard}>
          <Feather name="alert-circle" size={26} color={NEGATIVE_COLOR} />
          <Text style={styles.stateTitle}>Unable to load earnings</Text>
          <Text style={styles.stateText}>{errorMessage}</Text>
          {isOwner ? (
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
            <Text style={styles.summaryLabel}>Total revenue</Text>
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
            <Text style={styles.stateTitle}>No earnings yet</Text>
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
              <Text style={styles.sectionTitle}>Revenue by category</Text>
              <Text style={styles.sectionSubtitle}>Tap a category for its full breakdown</Text>
            </View>

            <View style={styles.card}>
              {categoryRows.map((row, index) => (
                <TouchableOpacity
                  key={row.key}
                  activeOpacity={0.8}
                  style={index > 0 ? styles.categoryRowSpaced : null}
                  onPress={() =>
                    navigation.navigate('CategoryEarningsScreen', {
                      category: row.key,
                      period: selectedPeriod,
                    })
                  }
                >
                  <View style={styles.categoryTop}>
                    <View style={[styles.categoryDot, { backgroundColor: row.color }]} />
                    <Text style={styles.categoryName} numberOfLines={1}>
                      {row.title}
                    </Text>
                    <Text style={styles.categoryRevenue}>{formatMoney(row.revenue, currency)}</Text>
                    <Text style={styles.categoryPercent}>
                      {formatPercent(totalRevenue > 0 ? row.revenue / totalRevenue : 0)}
                    </Text>
                    <Feather name="chevron-right" size={16} color={AppColors.grey2} />
                  </View>
                  <View style={styles.categoryTrack}>
                    <View
                      style={[
                        styles.categoryFill,
                        {
                          width: `${maxCategoryRevenue > 0 ? Math.max((row.revenue / maxCategoryRevenue) * 100, row.revenue > 0 ? 3 : 0) : 0}%`,
                          backgroundColor: row.color,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.categoryCount}>
                    {row.count} {row.count === 1 ? 'transaction' : 'transactions'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Revenue trend</Text>
              <Text style={styles.sectionSubtitle}>
                {filter
                  ? `Highlighting ${categoryCards[filter].title} · tap a bar for details`
                  : "Tap a bar to see that period's breakdown"}
              </Text>
            </View>

            <View style={styles.card}>
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
                        {formatMoney(activeBucket.revenue, currency)}
                      </Text>
                    </View>
                    <Text style={styles.trendSummaryCount}>
                      {activeBucket.count} {activeBucket.count === 1 ? 'sale' : 'sales'}
                    </Text>
                  </View>
                  <View style={styles.trendChips}>
                    {categoryOrder.map((key) => (
                      <View key={key} style={styles.trendChip}>
                        <View
                          style={[styles.trendChipDot, { backgroundColor: categoryCards[key].color }]}
                        />
                        <Text style={styles.trendChipText} numberOfLines={1}>
                          {categoryCards[key].title}{' '}
                          {formatMoney(activeBucket.byCategory[key], currency)}
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
                rulesColor={AppColors.grey4}
                yAxisTextStyle={styles.trendAxisText}
                formatYLabel={formatCompactAxis}
                showScrollIndicator={false}
                scrollToEnd={trendBuckets.length * trendSlot > trendInnerWidth}
                isAnimated
                animationDuration={500}
              />
            </View>

            {topCustomers.length > 0 ? (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Top customers</Text>
                  <Text style={styles.sectionSubtitle}>Biggest spenders across every category</Text>
                </View>

                <View style={styles.card}>
                  {topCustomers.map((customer, index) => (
                    <View
                      key={customer.uid}
                      style={[styles.customerRow, index > 0 && styles.customerRowSpaced]}
                    >
                      <Text style={styles.customerRank}>{index + 1}</Text>
                      <View style={styles.customerAvatar}>
                        <Text style={styles.customerAvatarText}>{getInitials(customer.name)}</Text>
                      </View>
                      <View style={styles.customerBody}>
                        <Text style={styles.customerName} numberOfLines={1}>
                          {customer.name}
                        </Text>
                        <Text style={styles.customerMeta} numberOfLines={1}>
                          {customer.purchases} {customer.purchases === 1 ? 'purchase' : 'purchases'}
                          {customer.email ? ` · ${customer.email}` : ''}
                        </Text>
                      </View>
                      <Text style={styles.customerSpent}>{formatMoney(customer.spent, currency)}</Text>
                    </View>
                  ))}
                </View>
              </>
            ) : null}

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>All transactions</Text>
              <Text style={styles.sectionSubtitle}>
                {listTotal} {listTotal === 1 ? 'transaction' : 'transactions'} · newest first · tap a
                row for details
              </Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterRow}
            >
              {[{ key: null, title: 'All' }, ...categoryOrder.map((key) => ({ key, title: categoryCards[key].title }))].map(
                (option) => {
                  const active = option.key === filter
                  const color = option.key ? categoryCards[option.key].color : AppColors.blue

                  return (
                    <TouchableOpacity
                      key={option.key ?? 'all'}
                      activeOpacity={0.85}
                      style={[
                        styles.filterChip,
                        active && { backgroundColor: color, borderColor: color },
                      ]}
                      onPress={() => void handleFilterChange(option.key)}
                    >
                      <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                        {option.title}
                      </Text>
                    </TouchableOpacity>
                  )
                }
              )}
            </ScrollView>

            {renderTransactions()}

            {listError ? <Text style={styles.listError}>{listError}</Text> : null}

            {hasMore && !isListLoading ? (
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
                    Load more ({listTotal - transactions.length} remaining)
                  </Text>
                )}
              </TouchableOpacity>
            ) : !isListLoading && transactions.length > PAGE_SIZE ? (
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
          <View style={styles.headingIcon}>{allEarningsCard.icon}</View>
          <Text style={styles.title}>{allEarningsCard.title}</Text>
          <Text style={styles.subtitle}>{rangeLabel || 'Every category combined'}</Text>
        </View>

        <View style={styles.body}>
          <View style={styles.periodRow}>
            {PERIOD_OPTIONS.map((option) => {
              const active = option.key === selectedPeriod

              return (
                <TouchableOpacity
                  key={option.key}
                  activeOpacity={0.85}
                  style={[styles.periodButton, active && styles.periodButtonActive]}
                  onPress={() => handlePeriodChange(option.key)}
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

export default AllCategoriesEarningsScreen

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
  categoryRowSpaced: {
    marginTop: 16,
  },
  categoryTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  categoryName: {
    flex: 1,
    color: AppColors.blue,
    fontSize: 13,
    fontFamily: 'Montserrat-Bold',
    marginRight: 8,
  },
  categoryRevenue: {
    color: AppColors.primary,
    fontSize: 13,
    fontFamily: 'Montserrat-Bold',
    marginRight: 8,
  },
  categoryPercent: {
    width: 38,
    textAlign: 'right',
    color: AppColors.grey3,
    fontSize: 12,
    fontFamily: 'Montserrat',
    marginRight: 4,
  },
  categoryTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: AppColors.white,
    marginTop: 8,
    overflow: 'hidden',
  },
  categoryFill: {
    height: '100%',
    borderRadius: 3,
  },
  categoryCount: {
    color: AppColors.grey3,
    fontSize: 10,
    marginTop: 5,
    fontFamily: 'Montserrat',
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
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerRowSpaced: {
    marginTop: 14,
  },
  customerRank: {
    width: 20,
    color: AppColors.grey3,
    fontSize: 12,
    fontFamily: 'Montserrat-Bold',
  },
  customerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${AppColors.blue}1A`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  customerAvatarText: {
    color: AppColors.blue,
    fontSize: 12,
    fontFamily: 'Montserrat-Bold',
  },
  customerBody: {
    flex: 1,
    marginRight: 8,
  },
  customerName: {
    color: AppColors.blue,
    fontSize: 13,
    fontFamily: 'Montserrat-Bold',
  },
  customerMeta: {
    color: AppColors.grey3,
    fontSize: 10,
    marginTop: 2,
    fontFamily: 'Montserrat',
  },
  customerSpent: {
    color: AppColors.primary,
    fontSize: 14,
    fontFamily: 'Montserrat-Bold',
  },
  filterRow: {
    gap: 8,
    paddingBottom: 14,
  },
  filterChip: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: AppColors.grey2,
    paddingVertical: 7,
    paddingHorizontal: 14,
  },
  filterChipText: {
    color: AppColors.grey3,
    fontSize: 12,
    fontFamily: 'Montserrat',
  },
  filterChipTextActive: {
    color: AppColors.white,
    fontFamily: 'Montserrat-Bold',
  },
  txList: {
    gap: 8,
  },
  listState: {
    paddingVertical: 28,
    alignItems: 'center',
  },
  listError: {
    color: NEGATIVE_COLOR,
    fontSize: 12,
    fontFamily: 'Montserrat',
    textAlign: 'center',
    marginTop: 12,
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
  endText: {
    color: AppColors.grey3,
    fontSize: 12,
    fontFamily: 'Montserrat',
    textAlign: 'center',
    marginTop: 16,
  },
})