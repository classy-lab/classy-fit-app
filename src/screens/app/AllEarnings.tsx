import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BarChart, LineChart, type barDataItem, type lineDataItem } from 'react-native-gifted-charts';
import Feather from '@expo/vector-icons/Feather';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { s } from 'react-native-size-matters';
import { AppColors } from '../../styles/colors';
import { UserContext } from '../../context/UserContext';
import SignOut from '../../components/utils/SignOut';
import type {
  EarningsApiResponse,
  EarningsCategoryKey,
  EarningsPeriod,
} from '../../types/earnings';

type UserContextValue = {
  user?: {
    gym_id?: number | string;
    role?: string | null;
  } | null;
  tokens?: {
    access_token?: string;
    refresh_token?: string;
  } | null;
  setTokens: (
    value:
      | {
          access_token?: string;
          refresh_token?: string;
        }
      | null
      | ((
          prev:
            | {
                access_token?: string;
                refresh_token?: string;
              }
            | null
        ) => {
          access_token?: string;
          refresh_token?: string;
        } | null)
  ) => void;
  webServer: string;
};

type AllEarningsNavigation = {
  goBack: () => void;
};

type EarningsLoadState = 'initial' | 'refresh' | 'period';

const PERIOD_OPTIONS: EarningsPeriod[] = ['7d', '30d', '90d', '1y'];

const CATEGORY_META: Record<
  EarningsCategoryKey,
  { label: string; shortLabel: string; color: string }
> = {
  products: {
    label: 'Products',
    shortLabel: 'Products',
    color: AppColors.blue,
  },
  memberships: {
    label: 'Memberships',
    shortLabel: 'Memberships',
    color: AppColors.primary,
  },
  classes: {
    label: 'Classes',
    shortLabel: 'Classes',
    color: AppColors.grey3,
  },
  personal_training: {
    label: 'Personal Training',
    shortLabel: 'Personal Training',
    color: AppColors.grey2,
  },
};

const refreshAccessToken = async (
  authContext: Pick<UserContextValue, 'tokens' | 'setTokens' | 'webServer'>
): Promise<string | null> => {
  if (!authContext.tokens?.refresh_token) {
    return null;
  }

  const refreshResponse = await fetch(`${authContext.webServer}/api/v1/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      token: authContext.tokens.refresh_token,
    }),
  });

  if (refreshResponse.status !== 200) {
    return null;
  }

  const refreshObj = (await refreshResponse.json()) as {
    access_token?: string;
    refresh_token?: string;
  };

  if (!refreshObj.access_token || !refreshObj.refresh_token) {
    return null;
  }

  authContext.setTokens((prev) => ({
    ...prev,
    access_token: refreshObj.access_token,
    refresh_token: refreshObj.refresh_token,
  }));

  return refreshObj.access_token;
};

const performAuthenticatedRequest = async (
  authContext: Pick<UserContextValue, 'tokens' | 'setTokens' | 'webServer'>,
  endpoint: string,
  init: RequestInit = {}
): Promise<Response | null> => {
  if (!authContext.tokens?.access_token) {
    return null;
  }

  const requestWithToken = async (accessToken: string) => {
    return fetch(endpoint, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init.headers ?? {}),
        Authorization: `Bearer ${accessToken}`,
      },
    });
  };

  let response = await requestWithToken(authContext.tokens.access_token);

  if (response.status === 401 || response.status === 403) {
    const refreshedAccessToken = await refreshAccessToken(authContext);
    if (!refreshedAccessToken) {
      return response;
    }

    response = await requestWithToken(refreshedAccessToken);
  }

  return response;
};

const formatApiDate = (value: string): string => {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat(undefined, {
        month: 'short',
        day: 'numeric',
      }).format(date);
};

const formatRangeDate = (value: string): string => {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(date);
};

const AllEarnings = ({ navigation }: { navigation: AllEarningsNavigation }) => {
  const authContext = useContext(UserContext) as UserContextValue | null;
  const { width } = useWindowDimensions();
  const [selectedPeriod, setSelectedPeriod] = useState<EarningsPeriod>('30d');
  const [earnings, setEarnings] = useState<EarningsApiResponse | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isChangingPeriod, setIsChangingPeriod] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const requestSequenceRef = useRef(0);

  const user = authContext?.user ?? null;
  const tokens = authContext?.tokens ?? null;
  const webServer = authContext?.webServer ?? '';
  const setTokens = authContext?.setTokens;
  const isOwner = String(user?.role ?? '').trim().toLowerCase() === 'owner';

  const currencyCode = earnings?.currency ?? 'USD';

  const currencyFormatter = useMemo(() => {
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    } catch {
      return new Intl.NumberFormat(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }
  }, [currencyCode]);

  const formatCurrency = useCallback(
    (value: number) => currencyFormatter.format(value),
    [currencyFormatter]
  );

  const loadEarnings = useCallback(
    async (mode: EarningsLoadState) => {
      if (!authContext || !setTokens) {
        setErrorMessage('Please sign in again to view earnings.');
        setIsInitialLoading(false);
        setIsRefreshing(false);
        setIsChangingPeriod(false);
        return;
      }

      if (!isOwner) {
        setErrorMessage('Only gym owners can view earnings.');
        setIsInitialLoading(false);
        setIsRefreshing(false);
        setIsChangingPeriod(false);
        setEarnings(null);
        return;
      }

      if (!user?.gym_id || !tokens?.access_token) {
        setErrorMessage('Please sign in again to view earnings.');
        setIsInitialLoading(false);
        setIsRefreshing(false);
        setIsChangingPeriod(false);
        return;
      }

      const requestId = ++requestSequenceRef.current;
      if (mode === 'initial') {
        setIsInitialLoading(true);
      } else if (mode === 'refresh') {
        setIsRefreshing(true);
      } else {
        setIsChangingPeriod(true);
      }

      setErrorMessage('');

      try {
        const endpoint = `${webServer}/api/v1/gyms/${user.gym_id}/earnings?period=${selectedPeriod}`;
        const response = await performAuthenticatedRequest(
          { tokens, setTokens, webServer },
          endpoint,
          { method: 'GET' }
        );

        if (!response) {
          if (requestId === requestSequenceRef.current) {
            setErrorMessage('Please sign in again to view earnings.');
            if (mode === 'initial') {
              setEarnings(null);
            }
          }
          return;
        }

        const responseBody = (await response.json()) as Partial<EarningsApiResponse> & {
          message?: string;
        };

        if (requestId !== requestSequenceRef.current) {
          return;
        }

        if (response.status !== 200 || responseBody.status !== 'success') {
          setErrorMessage(responseBody.message || 'Unable to load earnings.');
          if (mode === 'initial') {
            setEarnings(null);
          }
          return;
        }

        setEarnings(responseBody as EarningsApiResponse);
      } catch (error) {
        if (requestId !== requestSequenceRef.current) {
          return;
        }

        setErrorMessage('Unable to load earnings.');
        if (mode === 'initial') {
          setEarnings(null);
        }
      } finally {
        if (requestId === requestSequenceRef.current) {
          setIsInitialLoading(false);
          setIsRefreshing(false);
          setIsChangingPeriod(false);
        }
      }
    },
    [authContext, isOwner, selectedPeriod, setTokens, tokens?.access_token, user?.gym_id, webServer]
  );

  useEffect(() => {
    void loadEarnings(earnings ? 'period' : 'initial');
  }, [loadEarnings, selectedPeriod]);

  const categoryOrder: EarningsCategoryKey[] = [
    'products',
    'memberships',
    'classes',
    'personal_training',
  ];

  const lineChartData: lineDataItem[] = useMemo(() => {
    return (
      earnings?.daily.map((item) => ({
        value: item.revenue,
        label: formatApiDate(item.date),
      })) ?? []
    );
  }, [earnings?.daily]);

  const barChartData: barDataItem[] = useMemo(() => {
    if (!earnings) {
      return [];
    }

    return categoryOrder.map((categoryKey) => {
      const category = earnings.by_category[categoryKey];
      const meta = CATEGORY_META[categoryKey];

      return {
        value: category.revenue,
        label: meta.shortLabel,
        frontColor: meta.color,
        topLabelComponent: () => (
          <Text style={styles.barValueLabel}>{formatCurrency(category.revenue)}</Text>
        ),
      };
    });
  }, [earnings, formatCurrency]);

  const dailySpacing = useMemo(() => {
    const pointCount = earnings?.daily.length ?? 0;
    if (pointCount > 180) {
      return 8;
    }
    if (pointCount > 60) {
      return 10;
    }
    if (pointCount > 30) {
      return 14;
    }
    return 24;
  }, [earnings?.daily.length]);

  const hasRevenue = (earnings?.totals.revenue ?? 0) > 0;
  const isEmptyState = Boolean(earnings) && !hasRevenue;

  if (!isOwner) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10}>
            <Feather name="arrow-left" color={AppColors.blue} size={34} />
          </TouchableOpacity>
          <SignOut />
        </View>
        <View style={styles.accessDeniedWrap}>
          <View style={styles.accessDeniedCard}>
            <MaterialIcons name="lock" color={AppColors.blue} size={28} />
            <Text style={styles.accessDeniedTitle}>Owner access only</Text>
            <Text style={styles.accessDeniedText}>
              Earnings is available to gym owners only.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const renderContent = () => {
    if (isInitialLoading && !earnings) {
      return (
        <View style={styles.stateCard}>
          <ActivityIndicator color={AppColors.blue} />
          <Text style={styles.stateText}>Loading earnings dashboard...</Text>
        </View>
      );
    }

    if (errorMessage && !earnings) {
      return (
        <View style={styles.stateCard}>
          <MaterialIcons name="error-outline" color={AppColors.red} size={28} />
          <Text style={styles.stateTitle}>Unable to load earnings</Text>
          <Text style={styles.stateText}>{errorMessage}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => void loadEarnings('initial')}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <>
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, styles.summaryCardPrimary]}>
            <Text style={styles.summaryLabelOnPrimary}>Total Revenue</Text>
            <Text style={styles.summaryValueOnPrimary}>
              {formatCurrency(earnings?.totals.revenue ?? 0)}
            </Text>
            <Text style={styles.summaryHintOnPrimary}>
              {earnings
                ? `${formatRangeDate(earnings.range.start_date)} - ${formatRangeDate(earnings.range.end_date)}`
                : ''}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Transactions</Text>
            <Text style={styles.summaryValue}>
              {earnings?.totals.transaction_count ?? 0}
            </Text>
            <Text style={styles.summaryHint}>Successful only</Text>
          </View>
        </View>

        {isChangingPeriod ? (
          <View style={styles.inlineLoadingCard}>
            <ActivityIndicator color={AppColors.blue} size="small" />
            <Text style={styles.inlineLoadingText}>Updating {selectedPeriod.toUpperCase()} earnings...</Text>
          </View>
        ) : null}

        {isEmptyState ? (
          <View style={styles.stateCard}>
            <MaterialIcons name="stacked-line-chart" color={AppColors.grey3} size={28} />
            <Text style={styles.stateTitle}>No earnings yet</Text>
            <Text style={styles.stateText}>
              There were no successful earnings for this period.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionTitle}>Revenue Trend</Text>
                  <Text style={styles.sectionSubtitle}>Daily revenue from paid_at</Text>
                </View>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chartScrollContainer}
              >
                <View style={{ width: Math.max(width - 48, (earnings?.daily.length ?? 0) * 12 + 120) }}>
                  <LineChart
                    data={lineChartData}
                    height={220}
                    spacing={dailySpacing}
                    initialSpacing={16}
                    endSpacing={20}
                    curved
                    isAnimated={false}
                    hideDataPoints
                    hideRules={false}
                    hideYAxisText={false}
                    showVerticalLines={false}
                    yAxisColor={AppColors.grey2}
                    xAxisColor={AppColors.grey2}
                    color={AppColors.blue}
                    thickness={2}
                    yAxisTextStyle={styles.chartAxisText}
                    xAxisLabelTextStyle={styles.chartAxisText}
                    yAxisLabelPrefix=""
                    roundToDigits={2}
                    noOfSections={4}
                  />
                </View>
              </ScrollView>
            </View>

            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionTitle}>Revenue by Category</Text>
                  <Text style={styles.sectionSubtitle}>Successful revenue only</Text>
                </View>
              </View>
              <BarChart
                data={barChartData}
                height={240}
                barWidth={26}
                spacing={24}
                initialSpacing={16}
                endSpacing={12}
                isAnimated={false}
                hideRules={false}
                hideAxesAndRules={false}
                showValuesAsTopLabel
                roundedTop
                yAxisColor={AppColors.grey2}
                xAxisColor={AppColors.grey2}
                yAxisTextStyle={styles.chartAxisText}
                xAxisLabelTextStyle={styles.categoryAxisText}
                noOfSections={4}
                roundToDigits={2}
                frontColor={AppColors.blue}
              />
            </View>

            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionTitle}>Category Summary</Text>
                  <Text style={styles.sectionSubtitle}>Revenue and transaction counts</Text>
                </View>
              </View>
              <View style={styles.categoryList}>
                {categoryOrder.map((categoryKey) => {
                  const category = earnings?.by_category[categoryKey];
                  const meta = CATEGORY_META[categoryKey];

                  if (!category) {
                    return null;
                  }

                  return (
                    <View key={categoryKey} style={styles.categoryRow}>
                      <View style={styles.categoryLeft}>
                        <View
                          style={[
                            styles.categoryDot,
                            { backgroundColor: meta.color },
                          ]}
                        />
                        <Text style={styles.categoryName}>{meta.label}</Text>
                      </View>
                      <View style={styles.categoryRight}>
                        <Text style={styles.categoryRevenue}>
                          {formatCurrency(category.revenue)}
                        </Text>
                        <Text style={styles.categoryCount}>
                          {category.transaction_count} transactions
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          </>
        )}
      </>
    );
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10}>
          <Feather name="arrow-left" color={AppColors.blue} size={34} />
        </TouchableOpacity>
        <SignOut />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => void loadEarnings('refresh')}
            tintColor={AppColors.blue}
            colors={[AppColors.blue]}
          />
        }
      >
        <View style={styles.pageHeading}>
          <Text style={styles.pageTitle}>Earnings</Text>
          <Text style={styles.pageSubtitle}>Owner revenue dashboard</Text>
          <Text style={styles.rangeText}>
            {earnings
              ? `${formatRangeDate(earnings.range.start_date)} - ${formatRangeDate(earnings.range.end_date)}`
              : ''}
          </Text>
        </View>

        <View style={styles.periodRow}>
          {PERIOD_OPTIONS.map((period) => {
            const active = selectedPeriod === period;
            return (
              <TouchableOpacity
                key={period}
                style={[styles.periodButton, active && styles.periodButtonActive]}
                onPress={() => setSelectedPeriod(period)}
                activeOpacity={0.85}
              >
                <Text style={[styles.periodButtonText, active && styles.periodButtonTextActive]}>
                  {period.toUpperCase()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {errorMessage && earnings ? (
          <View style={styles.inlineErrorCard}>
            <MaterialIcons name="error-outline" color={AppColors.red} size={22} />
            <Text style={styles.inlineErrorText}>{errorMessage}</Text>
            <TouchableOpacity onPress={() => void loadEarnings('period')}>
              <Text style={styles.inlineErrorRetry}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {renderContent()}
      </ScrollView>
    </SafeAreaView>
  );
};

export default AllEarnings;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: AppColors.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  pageHeading: {
    marginTop: 12,
    marginBottom: 20,
  },
  pageTitle: {
    fontFamily: 'Montserrat',
    fontSize: 32,
    color: AppColors.blue,
  },
  pageSubtitle: {
    marginTop: 4,
    fontFamily: 'Montserrat',
    fontSize: 14,
    color: AppColors.grey3,
  },
  rangeText: {
    marginTop: 6,
    fontFamily: 'Montserrat',
    fontSize: 13,
    color: AppColors.grey2,
  },
  periodRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
    flexWrap: 'wrap',
  },
  periodButton: {
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: AppColors.grey,
  },
  periodButtonActive: {
    backgroundColor: AppColors.blue,
  },
  periodButtonText: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 12,
    color: AppColors.primary,
  },
  periodButtonTextActive: {
    color: AppColors.white,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: AppColors.white,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: AppColors.grey,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    elevation: 2,
  },
  summaryCardPrimary: {
    backgroundColor: AppColors.blue,
    borderColor: AppColors.blue,
  },
  summaryLabel: {
    fontFamily: 'Montserrat',
    fontSize: 13,
    color: AppColors.grey3,
  },
  summaryLabelOnPrimary: {
    fontFamily: 'Montserrat',
    fontSize: 13,
    color: AppColors.white,
  },
  summaryValue: {
    marginTop: 10,
    fontFamily: 'Montserrat-Bold',
    fontSize: 24,
    color: AppColors.primary,
  },
  summaryValueOnPrimary: {
    marginTop: 10,
    fontFamily: 'Montserrat-Bold',
    fontSize: 24,
    color: AppColors.white,
  },
  summaryHint: {
    marginTop: 6,
    fontFamily: 'Montserrat',
    fontSize: 11,
    color: AppColors.grey3,
  },
  summaryHintOnPrimary: {
    marginTop: 6,
    fontFamily: 'Montserrat',
    fontSize: 11,
    color: AppColors.grey,
  },
  inlineLoadingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: AppColors.grey,
    marginBottom: 16,
  },
  inlineLoadingText: {
    marginLeft: 10,
    fontFamily: 'Montserrat',
    fontSize: 13,
    color: AppColors.primary,
  },
  sectionCard: {
    backgroundColor: AppColors.white,
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: AppColors.grey,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    elevation: 2,
  },
  sectionHeader: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 18,
    color: AppColors.primary,
  },
  sectionSubtitle: {
    marginTop: 4,
    fontFamily: 'Montserrat',
    fontSize: 12,
    color: AppColors.grey3,
  },
  chartScrollContainer: {
    paddingBottom: 6,
  },
  chartAxisText: {
    fontFamily: 'Montserrat',
    fontSize: 10,
    color: AppColors.grey3,
  },
  categoryAxisText: {
    fontFamily: 'Montserrat',
    fontSize: 10,
    color: AppColors.grey3,
  },
  barValueLabel: {
    marginBottom: 6,
    fontFamily: 'Montserrat-Bold',
    fontSize: 10,
    color: AppColors.primary,
    textAlign: 'center',
  },
  categoryList: {
    gap: 12,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: AppColors.grey,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 10,
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    marginRight: 10,
  },
  categoryName: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 13,
    color: AppColors.primary,
  },
  categoryRight: {
    alignItems: 'flex-end',
  },
  categoryRevenue: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 13,
    color: AppColors.primary,
  },
  categoryCount: {
    marginTop: 2,
    fontFamily: 'Montserrat',
    fontSize: 11,
    color: AppColors.grey3,
  },
  stateCard: {
    backgroundColor: AppColors.white,
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
    borderWidth: 1,
    borderColor: AppColors.grey,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    elevation: 2,
  },
  stateTitle: {
    marginTop: 10,
    fontFamily: 'Montserrat-Bold',
    fontSize: 18,
    color: AppColors.primary,
    textAlign: 'center',
  },
  stateText: {
    marginTop: 8,
    fontFamily: 'Montserrat',
    fontSize: 13,
    color: AppColors.grey3,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: AppColors.blue,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
  },
  retryButtonText: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 13,
    color: AppColors.white,
  },
  inlineErrorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 18,
    backgroundColor: '#FFF4F4',
    marginBottom: 14,
    gap: 10,
  },
  inlineErrorText: {
    flex: 1,
    fontFamily: 'Montserrat',
    fontSize: 12,
    color: AppColors.primary,
  },
  inlineErrorRetry: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 12,
    color: AppColors.blue,
  },
  accessDeniedWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  accessDeniedCard: {
    backgroundColor: AppColors.white,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: AppColors.grey,
  },
  accessDeniedTitle: {
    marginTop: 10,
    fontFamily: 'Montserrat-Bold',
    fontSize: 18,
    color: AppColors.primary,
    textAlign: 'center',
  },
  accessDeniedText: {
    marginTop: 8,
    fontFamily: 'Montserrat',
    fontSize: 13,
    color: AppColors.grey3,
    textAlign: 'center',
    lineHeight: 20,
  },
});
