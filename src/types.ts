// ConsignCloud API Types

export interface Item {
  id: string;
  title: string;
  description: string | null;
  tag_price: number; // converted to store currency (e.g., ISK, USD)
  cost?: number; // converted to store currency
  category: string | null;
  account: string | null;
  inventory_type: 'consignment' | 'buy_outright' | 'retail';
  split: number; // 0-1
  quantity: number;
  status: string;
  location: string | null;
  batch: string | null;
  created: string;
  sold: string | null;
  custom_fields?: any[];
}

export interface Sale {
  id: string;
  created: string;
  total: number; // converted to store currency
  subtotal: number; // converted to store currency
  tax: number; // converted to store currency
  customer: string | null;
  location: string | null;
  items: any[];
  payments: any[];
  status: 'completed' | 'voided' | 'returned';
}

export interface Account {
  id: string;
  number: string;
  first_name: string | null;
  last_name: string | null;
  company: string | null;
  email: string | null;
  phone_number: string | null;
  balance: number; // converted to store currency
  default_split: number;
  default_inventory_type: 'consignment' | 'buy_outright' | 'retail';
  is_vendor: boolean;
  created: string;
}

export interface Batch {
  id: string;
  created: string;
  status: 'submitted' | 'draft';
  platform_editing_on: 'portal' | 'consigncloud';
  number: string;
  description: string | null;
  account: string | null;
}

export interface ItemCategory {
  id: string;
  name: string;
  created: string;
  deleted: string | null;
}

export interface Location {
  id: string;
  name: string;
  address_line_1: string | null;
  address_line_2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  next_cursor: string | null;
}

export interface ApiError {
  error: string;
  code: string;
  details?: any[];
}

// Calculation Result Types
export interface InventoryValueResult {
  total_value: number; // in cents
  total_value_formatted: string; // locale-formatted (e.g., "1,234.56" or "1.234")
  total_items: number;
  average_value: number; // in cents
  average_value_formatted: string; // locale-formatted
  breakdown?: {
    [key: string]: {
      value: number;
      value_formatted: string;
      count: number;
    };
  };
  filters_applied: string[];
  currency: string; // ISO currency code (e.g., "ISK", "USD")
  locale: string; // BCP 47 locale (e.g., "is-IS", "en-US")
}

export interface SalesTotalsResult {
  total_revenue: number; // in cents
  total_revenue_formatted: string; // locale-formatted
  total_tax: number; // in cents
  total_tax_formatted: string; // locale-formatted
  total_sales: number; // count
  average_sale: number; // in cents
  average_sale_formatted: string; // locale-formatted
  breakdown?: {
    [key: string]: {
      revenue: number;
      revenue_formatted: string;
      tax: number;
      tax_formatted: string;
      count: number;
    };
  };
  filters_applied: string[];
  currency: string; // ISO currency code
  locale: string; // BCP 47 locale
}

export interface AccountMetricsResult {
  account_id: string;
  account_name: string;
  current_balance: number; // in cents
  current_balance_formatted: string; // locale-formatted
  inventory_value: number; // in cents (available items)
  inventory_value_formatted: string; // locale-formatted
  items_available: number;
  items_sold: number;
  total_sales_revenue: number; // in cents
  total_sales_revenue_formatted: string; // locale-formatted
  commission_owed: number; // in cents (calculated from splits)
  commission_owed_formatted: string; // locale-formatted
  filters_applied: string[];
  currency: string; // ISO currency code
  locale: string; // BCP 47 locale
}
