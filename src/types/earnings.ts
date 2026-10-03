export type EarningsPeriod = '7d' | '30d' | '90d' | '1y';

export type EarningsCategoryKey =
  | 'products'
  | 'memberships'
  | 'classes'
  | 'personal_training';

export interface EarningsCategorySummary {
  revenue: number;
  transaction_count: number;
}

export interface EarningsDailyPoint {
  date: string;
  revenue: number;
  transaction_count: number;
}

export interface EarningsRange {
  start_date: string;
  end_date: string;
}

export interface EarningsPreviousPeriod extends EarningsRange, EarningsCategorySummary {}

export interface EarningsApiResponse {
  status: 'success';
  period: EarningsPeriod;
  range: EarningsRange;
  currency: string;
  totals: EarningsCategorySummary;
  by_category: Record<EarningsCategoryKey, EarningsCategorySummary>;
  daily: EarningsDailyPoint[];
  category_daily: Record<EarningsCategoryKey, EarningsDailyPoint[]>;
  previous?: EarningsPreviousPeriod;
}
