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

export interface EarningsTransactionCustomer {
  uid: number | null;
  name: string;
  email: string | null;
}

export interface EarningsTransaction {
  payment_uid: number;
  paid_at: string | null;
  amount: number;
  currency: string;
  customer: EarningsTransactionCustomer;
  item_name: string;
  item_detail: string | null;
  quantity: number | null;
  event_at: string | null;
  reference: string | null;
}

export interface EarningsTransactionPage {
  items: EarningsTransaction[];
  page: number;
  per_page: number;
  total: number;
  has_more: boolean;
}

export interface EarningsBreakdownItem {
  name: string;
  revenue: number;
  count: number;
}

export interface EarningsCategoryDetailResponse {
  status: 'success';
  category: EarningsCategoryKey;
  period: EarningsPeriod;
  range: EarningsRange;
  currency: string;
  totals: EarningsCategorySummary & {
    average_sale: number;
    unique_customers: number;
    repeat_customers: number;
  };
  previous: EarningsPreviousPeriod;
  daily: EarningsDailyPoint[];
  breakdown: {
    title: string;
    count_label: string;
    items: EarningsBreakdownItem[];
  };
  transactions: EarningsTransactionPage;
}
