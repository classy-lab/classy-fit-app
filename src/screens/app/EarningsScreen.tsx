// @ts-nocheck
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Feather from '@expo/vector-icons/Feather'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import FontAwesome5 from '@expo/vector-icons/FontAwesome5'
import { AppColors } from '../../styles/colors'
import SignOut from '../../components/utils/SignOut'
import { UserContext } from '../../context/UserContext'
import { performAuthenticatedRequest } from '../../utils/authenticatedRequest'
import type { EarningsApiResponse, EarningsDailyPoint } from '../../types/earnings'

const categoryCards = [
  {
    title: 'Memberships',
    subtitle: 'Recurring revenue',
    icon: <MaterialCommunityIcons name="credit-card-outline" size={30} color={AppColors.blue} />,
  },
  {
    title: 'Products',
    subtitle: 'Retail sales',
    icon: <MaterialCommunityIcons name="shopping" size={30} color={AppColors.blue} />,
  },
  {
    title: 'Classes',
    subtitle: 'Group sessions',
    icon: <FontAwesome5 name="calendar-alt" size={24} color={AppColors.blue} />,
  },
  {
    title: 'Personal Training',
    subtitle: '1-on-1 revenue',
    icon: <MaterialCommunityIcons name="dumbbell" size={30} color={AppColors.blue} />,
  },
]

const formatDateLabel = (value?: string) => {
  if (!value) {
    return '—'
  }

  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(date)
}

const formatDayAndDate = (value?: string) => {
  if (!value) {
    return '—'
  }

  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

const EarningsScreen = ({ navigation }) => {
  const authContext = useContext(UserContext)
  const user = authContext?.user ?? null
  const tokens = authContext?.tokens ?? null
  const webServer = authContext?.webServer ?? ''
  const setTokens = authContext?.setTokens

  const [earnings, setEarnings] = useState<EarningsApiResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)

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
      setSelectedIndex(Math.max(nextEarnings.daily.length - 1, 0))
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

  const dailyData: EarningsDailyPoint[] = earnings?.daily ?? []
  const selectedPoint = dailyData[selectedIndex] ?? dailyData[dailyData.length - 1] ?? null
  const maxRevenue = useMemo(() => {
    const maxValue = Math.max(...dailyData.map((item) => item.revenue), 0)
    return maxValue > 0 ? maxValue : 1
  }, [dailyData])

  const hasData = dailyData.length > 0
  const totalRevenue = earnings?.totals.revenue ?? 0
  const transactionCount = earnings?.totals.transaction_count ?? 0

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
                  Tap a bar to see the actual sales for that day.
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
                  <Text style={styles.loadingText}>Loading actual sales...</Text>
                </View>
              ) : errorMessage && !earnings ? (
                <View style={styles.loadingWrap}>
                  <Text style={styles.loadingText}>{errorMessage}</Text>
                </View>
              ) : (
                <>
                  <View style={styles.selectedDayCard}>
                    <Text style={styles.selectedDayLabel}>
                      {selectedPoint ? formatDayAndDate(selectedPoint.date) : 'Select a day'}
                    </Text>
                    <Text style={styles.selectedDayValue}>
                      {selectedPoint ? formatCurrency(selectedPoint.revenue) : formatCurrency(0)}
                    </Text>
                  </View>

                  <View style={styles.chartRow}>
                    {dailyData.map((item, index) => {
                      const isSelected = index === selectedIndex
                      const heightPercent = Math.max((item.revenue / maxRevenue) * 100, 8)

                      return (
                        <Pressable
                          key={item.date}
                          onPress={() => setSelectedIndex(index)}
                          style={styles.barColumn}
                        >
                          <Text style={[styles.barAmount, isSelected && styles.barAmountSelected]}>
                            {formatCurrency(item.revenue)}
                          </Text>
                          <View style={styles.barTrack}>
                            <View
                              style={[
                                styles.barFill,
                                {
                                  height: `${heightPercent}%`,
                                  backgroundColor: isSelected ? AppColors.primary : AppColors.blue,
                                },
                              ]}
                            />
                          </View>
                          <Text style={[styles.barLabel, isSelected && styles.barLabelSelected]}>
                            {formatDateLabel(item.date)}
                          </Text>
                        </Pressable>
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
          </View>

          <View style={styles.grid}>
            {categoryCards.map((card) => (
              <TouchableOpacity key={card.title} activeOpacity={0.9} style={styles.squareCard}>
                <View style={styles.iconWrap}>{card.icon}</View>
                <Text style={styles.squareTitle}>{card.title}</Text>
                <Text style={styles.squareSubtitle}>{card.subtitle}</Text>
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
  selectedDayCard: {
    alignSelf: 'flex-start',
    backgroundColor: AppColors.grey,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  selectedDayLabel: {
    color: AppColors.grey3,
    fontSize: 11,
    fontFamily: 'Montserrat',
  },
  selectedDayValue: {
    color: AppColors.primary,
    fontSize: 18,
    fontFamily: 'Montserrat',
    marginTop: 4,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    width: '100%',
    minHeight: 180,
    marginTop: 4,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 2,
  },
  barAmount: {
    color: AppColors.grey3,
    fontSize: 9,
    fontFamily: 'Montserrat',
    marginBottom: 6,
    textAlign: 'center',
    minHeight: 12,
  },
  barAmountSelected: {
    color: AppColors.primary,
    fontFamily: 'Montserrat',
  },
  barTrack: {
    width: '100%',
    flex: 1,
    minHeight: 120,
    justifyContent: 'flex-end',
    alignItems: 'center',
    borderRadius: 999,
    overflow: 'hidden',
  },
  barFill: {
    width: '72%',
    borderRadius: 999,
  },
  barLabel: {
    marginTop: 8,
    color: AppColors.grey3,
    fontSize: 11,
    fontFamily: 'Montserrat',
    textAlign: 'center',
  },
  barLabelSelected: {
    color: AppColors.blue,
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
    marginBottom: 12,
  },
  squareTitle: {
    color: AppColors.blue,
    fontSize: 15,
    fontFamily: 'Montserrat',
    textAlign: 'center',
  },
  squareSubtitle: {
    color: AppColors.grey3,
    fontSize: 11,
    marginTop: 4,
    fontFamily: 'Montserrat',
    textAlign: 'center',
  },
})
