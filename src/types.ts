// ConsignCloud API Types

export interface Item {
  id: string;
  title: string;
  description: string | null;
  tag_price: number; // in cents
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
  total: number; // in cents
  subtotal: number; // in cents
  tax: number; // in cents
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
  balance: number; // in cents
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
  total_items: number;
  average_value: number; // in cents
  breakdown?: {
    [key: string]: {
      value: number;
      count: number;
    };
  };
  filters_applied: string[];
}

export interface SalesTotalsResult {
  total_revenue: number; // in cents
  total_tax: number; // in cents
  total_sales: number; // count
  average_sale: number; // in cents
  breakdown?: {
    [key: string]: {
      revenue: number;
      tax: number;
      count: number;
    };
  };
  filters_applied: string[];
}

export interface AccountMetricsResult {
  account_id: string;
  account_name: string;
  current_balance: number; // in cents
  inventory_value: number; // in cents (available items)
  items_available: number;
  items_sold: number;
  total_sales_revenue: number; // in cents
  commission_owed: number; // in cents (calculated from splits)
  filters_applied: string[];
}
