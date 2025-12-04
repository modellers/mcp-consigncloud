import axios, { AxiosInstance, AxiosError } from 'axios';
import { Item, Sale, Account, Batch, ItemCategory, Location, PaginatedResponse, InventoryValueResult, SalesTotalsResult, AccountMetricsResult } from './types.js';

export class ConsignCloudClient {
  private client: AxiosInstance;

  constructor(apiKey: string, baseURL: string = 'https://api.consigncloud.com/api/v1') {
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
    return response.data;
  }

  async getItem(id: string): Promise<Item> {
    const response = await this.client.get(`/items/${id}`);
    return response.data;
  }

  async createItem(data: Partial<Item>): Promise<Item> {
    const response = await this.client.post('/items', data);
    return response.data;
  }

  async updateItem(id: string, data: Partial<Item>): Promise<Item> {
    const response = await this.client.patch(`/items/${id}`, data);
    return response.data;
  }

  async deleteItem(id: string): Promise<void> {
    await this.client.delete(`/items/${id}`);
  }

  async restoreItem(id: string): Promise<Item> {
    const response = await this.client.post(`/items/${id}/restore`);
    return response.data;
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
    return response.data;
  }

  async getSale(id: string): Promise<Sale> {
    const response = await this.client.get(`/sales/${id}`);
    return response.data;
  }

  async createSale(data: Partial<Sale>): Promise<Sale> {
    const response = await this.client.post('/sales', data);
    return response.data;
  }

  async updateSale(id: string, data: Partial<Sale>): Promise<Sale> {
    const response = await this.client.patch(`/sales/${id}`, data);
    return response.data;
  }

  async voidSale(id: string): Promise<Sale> {
    const response = await this.client.post(`/sales/${id}/void`);
    return response.data;
  }

  async refundSale(id: string, data?: any): Promise<Sale> {
    const response = await this.client.post(`/sales/${id}/refund`, data);
    return response.data;
  }

  // Accounts
  async listAccounts(params?: Record<string, any>): Promise<PaginatedResponse<Account>> {
    const response = await this.client.get('/accounts', { params });
    return response.data;
  }

  async getAccount(id: string): Promise<Account> {
    const response = await this.client.get(`/accounts/${id}`);
    return response.data;
  }

  async createAccount(data: Partial<Account>): Promise<Account> {
    const response = await this.client.post('/accounts', data);
    return response.data;
  }

  async updateAccount(id: string, data: Partial<Account>): Promise<Account> {
    const response = await this.client.patch(`/accounts/${id}`, data);
    return response.data;
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
  async getSalesTrends(params?: Record<string, any>): Promise<any> {
    const response = await this.client.get('/trends/sales', { params });
    return response.data;
  }

  // Balance Entries
  async listBalanceEntries(params?: Record<string, any>): Promise<any> {
    const response = await this.client.get('/balance-entries', { params });
    return response.data;
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
    created_gte?: string;
    created_lte?: string;
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
    if (filterParams.created_gte) filters.push(`created>=${filterParams.created_gte}`);
    if (filterParams.created_lte) filters.push(`created<=${filterParams.created_lte}`);
    if (filterParams.batch) filters.push(`batch=${filterParams.batch}`);

    let allItems: Item[] = [];
    let cursor: string | null = null;

    // Build query params with only defined values
    const queryParams: Record<string, any> = { limit: 100 };
    if (filterParams.status) queryParams.status = filterParams.status;
    if (filterParams.category) queryParams.category = filterParams.category;
    if (filterParams.account) queryParams.account = filterParams.account;
    if (filterParams.location) queryParams.location = filterParams.location;
    if (filterParams.inventory_type) queryParams.inventory_type = filterParams.inventory_type;
    if (filterParams.tag_price_gte !== undefined) queryParams.tag_price_gte = filterParams.tag_price_gte;
    if (filterParams.tag_price_lte !== undefined) queryParams.tag_price_lte = filterParams.tag_price_lte;
    if (filterParams.created_gte) queryParams.created_gte = filterParams.created_gte;
    if (filterParams.created_lte) queryParams.created_lte = filterParams.created_lte;
    if (filterParams.batch) queryParams.batch = filterParams.batch;

    // Fetch all pages
    do {
      if (cursor) queryParams.cursor = cursor;
      const response = await this.listItems(queryParams);
      allItems = allItems.concat(response.data);
      cursor = response.next_cursor;
    } while (cursor);

    // Calculate totals
    let totalValue = 0;
    let totalItems = 0;
    const breakdown: Record<string, { value: number; count: number }> = {};

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
          breakdown[groupKey] = { value: 0, count: 0 };
        }
        breakdown[groupKey].value += itemValue;
        breakdown[groupKey].count += quantity;
      }
    }

    return {
      total_value: totalValue,
      total_items: totalItems,
      average_value: totalItems > 0 ? Math.round(totalValue / totalItems) : 0,
      breakdown: group_by ? breakdown : undefined,
      filters_applied: filters,
    };
  }

  /**
   * Fetch all sales with pagination and calculate totals
   */
  async calculateSalesTotals(params?: {
    status?: string;
    location?: string;
    customer?: string;
    created_gte?: string;
    created_lte?: string;
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
    if (filterParams.created_gte) filters.push(`created>=${filterParams.created_gte}`);
    if (filterParams.created_lte) filters.push(`created<=${filterParams.created_lte}`);
    if (filterParams.payment_type) filters.push(`payment_type=${filterParams.payment_type}`);
    if (filterParams.total_gte !== undefined) filters.push(`total>=${filterParams.total_gte}`);
    if (filterParams.total_lte !== undefined) filters.push(`total<=${filterParams.total_lte}`);

    let allSales: Sale[] = [];
    let cursor: string | null = null;

    // Build query params with only defined values
    const queryParams: Record<string, any> = { limit: 100 };
    if (filterParams.status) queryParams.status = filterParams.status;
    if (filterParams.location) queryParams.location = filterParams.location;
    if (filterParams.customer) queryParams.customer = filterParams.customer;
    if (filterParams.created_gte) queryParams.created_gte = filterParams.created_gte;
    if (filterParams.created_lte) queryParams.created_lte = filterParams.created_lte;
    if (filterParams.payment_type) queryParams.payment_type = filterParams.payment_type;
    if (filterParams.total_gte !== undefined) queryParams.total_gte = filterParams.total_gte;
    if (filterParams.total_lte !== undefined) queryParams.total_lte = filterParams.total_lte;

    // Fetch all pages
    do {
      if (cursor) queryParams.cursor = cursor;
      const response = await this.listSales(queryParams);
      allSales = allSales.concat(response.data);
      cursor = response.next_cursor;
    } while (cursor);

    // Calculate totals
    let totalRevenue = 0;
    let totalTax = 0;
    let totalSales = 0;
    const breakdown: Record<string, { revenue: number; tax: number; count: number }> = {};

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
          breakdown[groupKey] = { revenue: 0, tax: 0, count: 0 };
        }
        breakdown[groupKey].revenue += sale.total || 0;
        breakdown[groupKey].tax += sale.tax || 0;
        breakdown[groupKey].count += 1;
      }
    }

    return {
      total_revenue: totalRevenue,
      total_tax: totalTax,
      total_sales: totalSales,
      average_sale: totalSales > 0 ? Math.round(totalRevenue / totalSales) : 0,
      breakdown: group_by ? breakdown : undefined,
      filters_applied: filters,
    };
  }

  /**
   * Calculate metrics for a specific account
   */
  async calculateAccountMetrics(params: {
    account_id: string;
    created_gte?: string;
    created_lte?: string;
    inventory_type?: string;
  }): Promise<AccountMetricsResult> {
    const { account_id, created_gte, created_lte, inventory_type } = params;
    const filters: string[] = [`account_id=${account_id}`];

    if (created_gte) filters.push(`created>=${created_gte}`);
    if (created_lte) filters.push(`created<=${created_lte}`);
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

    // Fetch all sales
    let allSales: Sale[] = [];
    cursor = null;
    const salesQueryParams: Record<string, any> = { limit: 100 };
    if (created_gte) salesQueryParams.created_gte = created_gte;
    if (created_lte) salesQueryParams.created_lte = created_lte;

    do {
      if (cursor) salesQueryParams.cursor = cursor;
      const response = await this.listSales(salesQueryParams);
      allSales = allSales.concat(response.data);
      cursor = response.next_cursor;
    } while (cursor);

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
      inventory_value: inventoryValue,
      items_available: itemsAvailable,
      items_sold: itemsSold,
      total_sales_revenue: totalSalesRevenue,
      commission_owed: commissionOwed,
      filters_applied: filters,
    };
  }
}
