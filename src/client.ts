import axios, { AxiosInstance, AxiosError } from 'axios';
import { Item, Sale, Account, Batch, ItemCategory, Location, PaginatedResponse, InventoryValueResult, SalesTotalsResult, AccountMetricsResult } from './types.js';

export class ConsignCloudClient {
  private client: AxiosInstance;
  private locale: string;
  private currency: string;
  private currencyDecimals: number;

  constructor(apiKey: string, baseURL: string = 'https://api.consigncloud.com/api/v1') {
    // Initialize locale and currency settings
    this.locale = process.env.STORE_LOCALE || 'en-US';
    this.currency = process.env.STORE_CURRENCY || 'USD';

    // Determine decimal places for currency (some currencies like JPY, ISK have 0 decimals)
    const zeroDecimalCurrencies = ['JPY', 'KRW', 'ISK', 'CLP', 'VND', 'XAF', 'XOF', 'XPF'];
    this.currencyDecimals = zeroDecimalCurrencies.includes(this.currency) ? 0 : 2;

    this.client = axios.create({
      baseURL,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response) {
          const data = error.response.data as any;
          const status = error.response.status;
          const method = error.config?.method?.toUpperCase();
          const url = error.config?.url;

          let errorMessage = `API Error ${status}`;

          // Add context
          if (method && url) {
            errorMessage += ` (${method} ${url})`;
          }

          // Add specific error details
          if (status === 401) {
            errorMessage += ': Authentication failed - Invalid API key';
          } else if (status === 403) {
            errorMessage += ': Access forbidden - Check permissions';
          } else if (status === 404) {
            errorMessage += ': Resource not found';
          } else if (status === 422) {
            errorMessage += ': Validation error';
          } else if (status === 429) {
            errorMessage += ': Rate limit exceeded';
          } else if (status >= 500) {
            errorMessage += ': Server error';
          }

          // Add API error message if available
          if (data?.error) {
            errorMessage += ` - ${data.error}`;
          } else if (data?.message) {
            errorMessage += ` - ${data.message}`;
          }

          // Add validation errors if present
          if (data?.errors && typeof data.errors === 'object') {
            const validationErrors = Object.entries(data.errors)
              .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
              .join('; ');
            errorMessage += ` | Validation: ${validationErrors}`;
          }

          throw new Error(errorMessage);
        } else if (error.request) {
          // Request made but no response received
          throw new Error(`Network error: No response from ${this.client.defaults.baseURL} - Check your internet connection`);
        } else {
          // Error in request configuration
          throw new Error(`Request error: ${error.message}`);
        }
      }
    );
  }

  // Items (Inventory)
  async listItems(params?: Record<string, any>): Promise<PaginatedResponse<Item>> {
    const response = await this.client.get('/items', { params });
    return {
      data: response.data.data.map((item: any) => this.convertItemResponse(item)),
      next_cursor: response.data.next_cursor,
    };
  }

  async getItem(id: string): Promise<Item> {
    const response = await this.client.get(`/items/${id}`);
    return this.convertItemResponse(response.data);
  }

  async createItem(data: Partial<Item>): Promise<Item> {
    // Convert user input to API cents
    const apiData = {
      ...data,
      tag_price: data.tag_price ? this.convertToApiCents(data.tag_price) : undefined,
      cost: data.cost ? this.convertToApiCents(data.cost) : undefined,
    };
    const response = await this.client.post('/items', apiData);
    return this.convertItemResponse(response.data);
  }

  async updateItem(id: string, data: Partial<Item>): Promise<Item> {
    // Convert user input to API cents
    const apiData = {
      ...data,
      tag_price: data.tag_price ? this.convertToApiCents(data.tag_price) : undefined,
      cost: data.cost ? this.convertToApiCents(data.cost) : undefined,
    };
    const response = await this.client.patch(`/items/${id}`, apiData);
    return this.convertItemResponse(response.data);
  }

  async deleteItem(id: string): Promise<void> {
    await this.client.delete(`/items/${id}`);
  }

  async restoreItem(id: string): Promise<Item> {
    const response = await this.client.post(`/items/${id}/restore`);
    return this.convertItemResponse(response.data);
  }

  async getItemStats(): Promise<any> {
    const response = await this.client.get('/items/stats');
    return response.data;
  }

  async bulkEditItems(data: any): Promise<any> {
    const response = await this.client.post('/items/bulk-edits', data);
    return response.data;
  }

  async updateItemStatuses(itemIds: string[], status: string): Promise<any> {
    const response = await this.client.post('/items/update-statuses-bulk', { items: itemIds, status });
    return response.data;
  }

  // Sales
  async listSales(params?: Record<string, any>): Promise<PaginatedResponse<Sale>> {
    const response = await this.client.get('/sales', { params });
    return {
      data: response.data.data.map((sale: any) => this.convertSaleResponse(sale)),
      next_cursor: response.data.next_cursor,
    };
  }

  async getSale(id: string): Promise<Sale> {
    const response = await this.client.get(`/sales/${id}`);
    return this.convertSaleResponse(response.data);
  }

  async createSale(data: Partial<Sale>): Promise<Sale> {
    // Convert user input to API cents
    const apiData = {
      ...data,
      total: data.total ? this.convertToApiCents(data.total) : undefined,
      subtotal: data.subtotal ? this.convertToApiCents(data.subtotal) : undefined,
      tax: data.tax ? this.convertToApiCents(data.tax) : undefined,
    };
    const response = await this.client.post('/sales', apiData);
    return this.convertSaleResponse(response.data);
  }

  async updateSale(id: string, data: Partial<Sale>): Promise<Sale> {
    // Convert user input to API cents
    const apiData = {
      ...data,
      total: data.total ? this.convertToApiCents(data.total) : undefined,
      subtotal: data.subtotal ? this.convertToApiCents(data.subtotal) : undefined,
      tax: data.tax ? this.convertToApiCents(data.tax) : undefined,
    };
    const response = await this.client.patch(`/sales/${id}`, apiData);
    return this.convertSaleResponse(response.data);
  }

  async voidSale(id: string): Promise<Sale> {
    const response = await this.client.post(`/sales/${id}/void`);
    return this.convertSaleResponse(response.data);
  }

  async refundSale(id: string, data?: any): Promise<Sale> {
    const response = await this.client.post(`/sales/${id}/refund`, data);
    return this.convertSaleResponse(response.data);
  }

  // Accounts
  async listAccounts(params?: Record<string, any>): Promise<PaginatedResponse<Account>> {
    const response = await this.client.get('/accounts', { params });
    return {
      data: response.data.data.map((account: any) => this.convertAccountResponse(account)),
      next_cursor: response.data.next_cursor,
    };
  }

  async getAccount(id: string): Promise<Account> {
    const response = await this.client.get(`/accounts/${id}`);
    return this.convertAccountResponse(response.data);
  }

  async createAccount(data: Partial<Account>): Promise<Account> {
    // Convert user input to API cents
    const apiData = {
      ...data,
      balance: data.balance ? this.convertToApiCents(data.balance) : undefined,
    };
    const response = await this.client.post('/accounts', apiData);
    return this.convertAccountResponse(response.data);
  }

  async updateAccount(id: string, data: Partial<Account>): Promise<Account> {
    // Convert user input to API cents
    const apiData = {
      ...data,
      balance: data.balance ? this.convertToApiCents(data.balance) : undefined,
    };
    const response = await this.client.patch(`/accounts/${id}`, apiData);
    return this.convertAccountResponse(response.data);
  }

  async deleteAccount(id: string): Promise<void> {
    await this.client.delete(`/accounts/${id}`);
  }

  async getAccountStats(id: string): Promise<any> {
    const response = await this.client.get(`/accounts/${id}/stats`);
    return response.data;
  }

  // Batches
  async listBatches(params?: Record<string, any>): Promise<PaginatedResponse<Batch>> {
    const response = await this.client.get('/batches', { params });
    return response.data;
  }

  async getBatch(id: string): Promise<Batch> {
    const response = await this.client.get(`/batches/${id}`);
    return response.data;
  }

  async createBatch(data: Partial<Batch>): Promise<Batch> {
    const response = await this.client.post('/batches', data);
    return response.data;
  }

  async updateBatch(id: string, data: Partial<Batch>): Promise<Batch> {
    const response = await this.client.patch(`/batches/${id}`, data);
    return response.data;
  }

  async updateBatchStatus(id: string, status: 'draft' | 'submitted'): Promise<Batch> {
    const response = await this.client.post(`/batches/${id}/status`, { status });
    return response.data;
  }

  // Item Categories
  async listCategories(params?: Record<string, any>): Promise<PaginatedResponse<ItemCategory>> {
    const response = await this.client.get('/item-categories', { params });
    return response.data;
  }

  async getCategory(id: string): Promise<ItemCategory> {
    const response = await this.client.get(`/item-categories/${id}`);
    return response.data;
  }

  async createCategory(data: Partial<ItemCategory>): Promise<ItemCategory> {
    const response = await this.client.post('/item-categories', data);
    return response.data;
  }

  async updateCategory(id: string, data: Partial<ItemCategory>): Promise<ItemCategory> {
    const response = await this.client.patch(`/item-categories/${id}`, data);
    return response.data;
  }

  async deleteCategory(id: string): Promise<void> {
    await this.client.delete(`/item-categories/${id}`);
  }

  // Locations
  async listLocations(params?: Record<string, any>): Promise<PaginatedResponse<Location>> {
    const response = await this.client.get('/locations', { params });
    return response.data;
  }

  async getLocation(id: string): Promise<Location> {
    const response = await this.client.get(`/locations/${id}`);
    return response.data;
  }

  async createLocation(data: Partial<Location>): Promise<Location> {
    const response = await this.client.post('/locations', data);
    return response.data;
  }

  async updateLocation(id: string, data: Partial<Location>): Promise<Location> {
    const response = await this.client.patch(`/locations/${id}`, data);
    return response.data;
  }

  async deleteLocation(id: string): Promise<void> {
    await this.client.delete(`/locations/${id}`);
  }

  // Search & Suggestions
  async search(query: string, entities?: string[]): Promise<any> {
    const params: any = { query };
    if (entities && entities.length > 0) {
      // ConsignCloud expects entities[] as array parameter
      params.entities = entities;
    }
    const response = await this.client.get('/search', { params });
    return response.data;
  }

  async suggestFieldValues(entity: 'items' | 'accounts', field: string, value: string): Promise<any> {
    const params = { entity, field, value };
    const response = await this.client.get('/suggest', { params });
    return response.data;
  }

  // Sales Trends
  async getSalesTrends(params?: {
    start_date: string;
    end_date: string;
    bucket_size: 'day' | 'week' | 'month';
  }): Promise<any> {
    const response = await this.client.get('/trends/sales', { params });
    return response.data;
  }

  // Balance Entries
  async listBalanceEntries(params?: Record<string, any>): Promise<any> {
    const response = await this.client.get('/balance-entries', { params });
    return response.data;
  }

  // Utility Methods

  /**
   * Convert API cents to store currency (numeric value)
   * @param apiCents - Amount in cents from API (100 cents = 1.00 USD)
   * @returns Numeric value in store currency
   */
  private convertFromApiCents(apiCents: number | null | undefined): number {
    if (apiCents == null) return 0;
    // API stores in cents (100 cents = 1.00 USD = 1 ISK)
    return apiCents / 100;
  }

  /**
   * Convert store currency to API cents
   * @param amount - Amount in store currency (e.g., 1000 ISK or 10.00 USD)
   * @returns Amount in API cents
   */
  private convertToApiCents(amount: number | null | undefined): number {
    if (amount == null) return 0;
    // Convert to API cents (1000 ISK = 100000 cents, 10.00 USD = 1000 cents)
    return Math.round(amount * 100);
  }

  /**
   * Format currency value without symbol (locale-aware number formatting)
   * @param apiCents - Amount in cents from API (API always uses 2-decimal system)
   * @returns Formatted number string (e.g., "1,234.56" for USD, "1.234" for ISK)
   */
  private formatCurrency(apiCents: number): string {
    const amount = this.convertFromApiCents(apiCents);
    return new Intl.NumberFormat(this.locale, {
      minimumFractionDigits: this.currencyDecimals,
      maximumFractionDigits: this.currencyDecimals,
      useGrouping: true,
    }).format(amount);
  }

  /**
   * Format already-converted currency value (for calculation results)
   * @param amount - Amount already in store currency (ISK, USD, etc.)
   * @returns Formatted number string
   */
  private formatAmount(amount: number): string {
    return new Intl.NumberFormat(this.locale, {
      minimumFractionDigits: this.currencyDecimals,
      maximumFractionDigits: this.currencyDecimals,
      useGrouping: true,
    }).format(amount);
  }

  /**
   * Convert Item response from API (cents) to store currency
   */
  private convertItemResponse(item: any): Item {
    return {
      ...item,
      tag_price: this.convertFromApiCents(item.tag_price),
      cost: item.cost ? this.convertFromApiCents(item.cost) : undefined,
    };
  }

  /**
   * Convert Sale response from API (cents) to store currency
   */
  private convertSaleResponse(sale: any): Sale {
    return {
      ...sale,
      total: this.convertFromApiCents(sale.total),
      subtotal: this.convertFromApiCents(sale.subtotal),
      tax: this.convertFromApiCents(sale.tax),
      items: sale.items?.map((item: any) => ({
        ...item,
        tag_price: item.tag_price ? this.convertFromApiCents(item.tag_price) : undefined,
        total: item.total ? this.convertFromApiCents(item.total) : undefined,
      })),
      payments: sale.payments?.map((payment: any) => ({
        ...payment,
        amount: payment.amount ? this.convertFromApiCents(payment.amount) : undefined,
      })),
    };
  }

  /**
   * Convert Account response from API (cents) to store currency
   */
  private convertAccountResponse(account: any): Account {
    return {
      ...account,
      balance: this.convertFromApiCents(account.balance),
    };
  }

  // Aggregation Methods

  /**
   * Fetch all items with pagination and calculate inventory value
   */
  async calculateInventoryValue(params?: {
    status?: string;
    category?: string;
    account?: string;
    location?: string;
    inventory_type?: string;
    tag_price_gte?: number;
    tag_price_lte?: number;
    date_from?: string;
    date_to?: string;
    batch?: string;
    group_by?: 'category' | 'location' | 'account' | 'inventory_type' | 'status';
  }): Promise<InventoryValueResult> {
    const { group_by, ...filterParams } = params || {};
    const filters: string[] = [];

    // Track applied filters
    if (filterParams.status) filters.push(`status=${filterParams.status}`);
    if (filterParams.category) filters.push(`category=${filterParams.category}`);
    if (filterParams.account) filters.push(`account=${filterParams.account}`);
    if (filterParams.location) filters.push(`location=${filterParams.location}`);
    if (filterParams.inventory_type) filters.push(`inventory_type=${filterParams.inventory_type}`);
    if (filterParams.tag_price_gte) filters.push(`tag_price>=${filterParams.tag_price_gte}`);
    if (filterParams.tag_price_lte) filters.push(`tag_price<=${filterParams.tag_price_lte}`);
    if (filterParams.date_from) filters.push(`date_from=${filterParams.date_from}`);
    if (filterParams.date_to) filters.push(`date_to=${filterParams.date_to}`);
    if (filterParams.batch) filters.push(`batch=${filterParams.batch}`);

    let allItems: Item[] = [];
    let cursor: string | null = null;

    // Build query params with only defined values (excluding date filters - not supported by API)
    const queryParams: Record<string, any> = { limit: 100 };
    if (filterParams.status) queryParams.status = filterParams.status;
    if (filterParams.category) queryParams.category = filterParams.category;
    if (filterParams.account) queryParams.account = filterParams.account;
    if (filterParams.location) queryParams.location = filterParams.location;
    if (filterParams.inventory_type) queryParams.inventory_type = filterParams.inventory_type;
    if (filterParams.tag_price_gte !== undefined) queryParams.tag_price_gte = filterParams.tag_price_gte;
    if (filterParams.tag_price_lte !== undefined) queryParams.tag_price_lte = filterParams.tag_price_lte;
    if (filterParams.batch) queryParams.batch = filterParams.batch;
    // NOTE: date_from/date_to NOT sent to API (not supported) - will filter client-side

    // Fetch all pages
    do {
      if (cursor) queryParams.cursor = cursor;
      const response = await this.listItems(queryParams);
      allItems = allItems.concat(response.data);
      cursor = response.next_cursor;
    } while (cursor);

    // Apply client-side date filtering (API doesn't support this)
    if (filterParams.date_from || filterParams.date_to) {
      allItems = allItems.filter(item => {
        if (!item.created) return false;
        const itemDate = new Date(item.created);
        if (filterParams.date_from && itemDate < new Date(filterParams.date_from)) return false;
        if (filterParams.date_to && itemDate > new Date(filterParams.date_to)) return false;
        return true;
      });
    }

    // Calculate totals
    let totalValue = 0;
    let totalItems = 0;
    const breakdown: Record<string, { value: number; value_formatted: string; count: number }> = {};

    for (const item of allItems) {
      // Items don't have a simple quantity field - use 1 as default or count from status
      const quantity = item.quantity || 1;
      const itemValue = item.tag_price * quantity;
      totalValue += itemValue;
      totalItems += quantity;

      // Group by if specified
      if (group_by) {
        let groupKey: string;
        switch (group_by) {
          case 'category':
            groupKey = item.category || 'uncategorized';
            break;
          case 'location':
            groupKey = item.location || 'no_location';
            break;
          case 'account':
            groupKey = item.account || 'no_account';
            break;
          case 'inventory_type':
            groupKey = item.inventory_type;
            break;
          case 'status':
            groupKey = item.status;
            break;
          default:
            groupKey = 'all';
        }

        if (!breakdown[groupKey]) {
          breakdown[groupKey] = { value: 0, value_formatted: '', count: 0 };
        }
        breakdown[groupKey].value += itemValue;
        breakdown[groupKey].count += quantity;
      }
    }

    // Format breakdown values
    const formattedBreakdown: Record<string, { value: number; value_formatted: string; count: number }> | undefined =
      group_by ? Object.fromEntries(
        Object.entries(breakdown).map(([key, data]) => [
          key,
          {
            value: data.value,
            value_formatted: this.formatAmount(data.value),
            count: data.count
          }
        ])
      ) : undefined;

    const avgValue = totalItems > 0 ? Math.round(totalValue / totalItems) : 0;

    return {
      total_value: totalValue,
      total_value_formatted: this.formatAmount(totalValue),
      total_items: totalItems,
      average_value: avgValue,
      average_value_formatted: this.formatAmount(avgValue),
      breakdown: formattedBreakdown,
      filters_applied: filters,
      currency: this.currency,
      locale: this.locale,
    };
  }

  /**
   * Fetch all sales with pagination and calculate totals
   */
  async calculateSalesTotals(params?: {
    status?: string;
    location?: string;
    customer?: string;
    date_from?: string;
    date_to?: string;
    payment_type?: string;
    total_gte?: number;
    total_lte?: number;
    group_by?: 'status' | 'location' | 'date';
    date_interval?: 'day' | 'week' | 'month';
  }): Promise<SalesTotalsResult> {
    const { group_by, date_interval, ...filterParams } = params || {};
    const filters: string[] = [];

    // Track applied filters
    if (filterParams.status) filters.push(`status=${filterParams.status}`);
    if (filterParams.location) filters.push(`location=${filterParams.location}`);
    if (filterParams.customer) filters.push(`customer=${filterParams.customer}`);
    if (filterParams.date_from) filters.push(`date_from=${filterParams.date_from}`);
    if (filterParams.date_to) filters.push(`date_to=${filterParams.date_to}`);
    if (filterParams.payment_type) filters.push(`payment_type=${filterParams.payment_type}`);
    if (filterParams.total_gte !== undefined) filters.push(`total>=${filterParams.total_gte}`);
    if (filterParams.total_lte !== undefined) filters.push(`total<=${filterParams.total_lte}`);

    let allSales: Sale[] = [];
    let cursor: string | null = null;

    // Build query params with only defined values (excluding date filters - not supported by API)
    const queryParams: Record<string, any> = { limit: 100 };
    if (filterParams.status) queryParams.status = filterParams.status;
    if (filterParams.location) queryParams.location = filterParams.location;
    if (filterParams.customer) queryParams.customer = filterParams.customer;
    if (filterParams.payment_type) queryParams.payment_type = filterParams.payment_type;
    if (filterParams.total_gte !== undefined) queryParams.total_gte = filterParams.total_gte;
    if (filterParams.total_lte !== undefined) queryParams.total_lte = filterParams.total_lte;
    // NOTE: date_from/date_to NOT sent to API (not supported) - will filter client-side

    // Fetch all pages
    do {
      if (cursor) queryParams.cursor = cursor;
      const response = await this.listSales(queryParams);
      allSales = allSales.concat(response.data);
      cursor = response.next_cursor;
    } while (cursor);

    // Apply client-side date filtering (API doesn't support this)
    if (filterParams.date_from || filterParams.date_to) {
      allSales = allSales.filter(sale => {
        if (!sale.created) return false;
        const saleDate = new Date(sale.created);
        if (filterParams.date_from && saleDate < new Date(filterParams.date_from)) return false;
        if (filterParams.date_to && saleDate > new Date(filterParams.date_to)) return false;
        return true;
      });
    }

    // Calculate totals
    let totalRevenue = 0;
    let totalTax = 0;
    let totalSales = 0;
    const breakdown: Record<string, { revenue: number; revenue_formatted: string; tax: number; tax_formatted: string; count: number }> = {};

    for (const sale of allSales) {
      totalRevenue += sale.total || 0;
      totalTax += sale.tax || 0;
      totalSales += 1;

      // Group by if specified
      if (group_by) {
        let groupKey: string;
        switch (group_by) {
          case 'status':
            groupKey = sale.status;
            break;
          case 'location':
            groupKey = sale.location || 'no_location';
            break;
          case 'date':
            if (date_interval) {
              const date = new Date(sale.created);
              if (date_interval === 'day') {
                groupKey = date.toISOString().split('T')[0];
              } else if (date_interval === 'week') {
                const weekStart = new Date(date);
                weekStart.setDate(date.getDate() - date.getDay());
                groupKey = weekStart.toISOString().split('T')[0];
              } else if (date_interval === 'month') {
                groupKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
              } else {
                groupKey = date.toISOString().split('T')[0];
              }
            } else {
              groupKey = sale.created.split('T')[0];
            }
            break;
          default:
            groupKey = 'all';
        }

        if (!breakdown[groupKey]) {
          breakdown[groupKey] = { revenue: 0, revenue_formatted: '', tax: 0, tax_formatted: '', count: 0 };
        }
        breakdown[groupKey].revenue += sale.total || 0;
        breakdown[groupKey].tax += sale.tax || 0;
        breakdown[groupKey].count += 1;
      }
    }

    // Format breakdown values
    const formattedBreakdown: Record<string, { revenue: number; revenue_formatted: string; tax: number; tax_formatted: string; count: number }> | undefined =
      group_by ? Object.fromEntries(
        Object.entries(breakdown).map(([key, data]) => [
          key,
          {
            revenue: data.revenue,
            revenue_formatted: this.formatAmount(data.revenue),
            tax: data.tax,
            tax_formatted: this.formatAmount(data.tax),
            count: data.count
          }
        ])
      ) : undefined;

    const avgSale = totalSales > 0 ? Math.round(totalRevenue / totalSales) : 0;

    return {
      total_revenue: totalRevenue,
      total_revenue_formatted: this.formatAmount(totalRevenue),
      total_tax: totalTax,
      total_tax_formatted: this.formatAmount(totalTax),
      total_sales: totalSales,
      average_sale: avgSale,
      average_sale_formatted: this.formatAmount(avgSale),
      breakdown: formattedBreakdown,
      filters_applied: filters,
      currency: this.currency,
      locale: this.locale,
    };
  }

  /**
   * Calculate metrics for a specific account
   */
  async calculateAccountMetrics(params: {
    account_id: string;
    date_from?: string;
    date_to?: string;
    inventory_type?: string;
  }): Promise<AccountMetricsResult> {
    const { account_id, date_from, date_to, inventory_type } = params;
    const filters: string[] = [`account_id=${account_id}`];

    if (date_from) filters.push(`date_from=${date_from}`);
    if (date_to) filters.push(`date_to=${date_to}`);
    if (inventory_type) filters.push(`inventory_type=${inventory_type}`);

    // Fetch account details
    const account = await this.getAccount(account_id);

    // Fetch all items for this account
    let allItems: Item[] = [];
    let cursor: string | null = null;
    const itemQueryParams: Record<string, any> = { limit: 100, account: account_id };
    if (inventory_type) itemQueryParams.inventory_type = inventory_type;

    do {
      if (cursor) itemQueryParams.cursor = cursor;
      const response = await this.listItems(itemQueryParams);
      allItems = allItems.concat(response.data);
      cursor = response.next_cursor;
    } while (cursor);

    // Calculate inventory metrics
    let inventoryValue = 0;
    let itemsAvailable = 0;
    let itemsSold = 0;

    for (const item of allItems) {
      const quantity = item.quantity || 1;
      if (item.status === 'sold') {
        itemsSold += quantity;
      } else if (item.status === 'available') {
        inventoryValue += item.tag_price * quantity;
        itemsAvailable += quantity;
      }
    }

    // Fetch sales for this account (items sold by this consignor)
    let totalSalesRevenue = 0;
    let commissionOwed = 0;

    // Fetch all sales (no date filter - API doesn't support it)
    let allSales: Sale[] = [];
    cursor = null;
    const salesQueryParams: Record<string, any> = { limit: 100 };
    // NOTE: date_from/date_to NOT sent to API (not supported) - will filter client-side

    do {
      if (cursor) salesQueryParams.cursor = cursor;
      const response = await this.listSales(salesQueryParams);
      allSales = allSales.concat(response.data);
      cursor = response.next_cursor;
    } while (cursor);

    // Apply client-side date filtering (API doesn't support this)
    if (date_from || date_to) {
      allSales = allSales.filter(sale => {
        if (!sale.created) return false;
        const saleDate = new Date(sale.created);
        if (date_from && saleDate < new Date(date_from)) return false;
        if (date_to && saleDate > new Date(date_to)) return false;
        return true;
      });
    }

    // Calculate sales revenue for items from this account
    for (const sale of allSales) {
      if (sale.status === 'completed' && sale.items) {
        for (const saleItem of sale.items) {
          // Check if this sale item belongs to our account
          const matchingItem = allItems.find(i => i.id === saleItem.item);
          if (matchingItem) {
            const itemRevenue = saleItem.price || 0;
            totalSalesRevenue += itemRevenue;
            // Calculate commission based on split
            commissionOwed += Math.round(itemRevenue * matchingItem.split);
          }
        }
      }
    }

    return {
      account_id: account.id,
      account_name: [account.first_name, account.last_name].filter(Boolean).join(' ') || account.company || account.number,
      current_balance: account.balance,
      current_balance_formatted: this.formatAmount(account.balance),
      inventory_value: inventoryValue,
      inventory_value_formatted: this.formatAmount(inventoryValue),
      items_available: itemsAvailable,
      items_sold: itemsSold,
      total_sales_revenue: totalSalesRevenue,
      total_sales_revenue_formatted: this.formatAmount(totalSalesRevenue),
      commission_owed: commissionOwed,
      commission_owed_formatted: this.formatAmount(commissionOwed),
      filters_applied: filters,
      currency: this.currency,
      locale: this.locale,
    };
  }
}
