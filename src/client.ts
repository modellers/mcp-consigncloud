import axios, { AxiosInstance, AxiosError } from 'axios';
import { Item, Sale, Account, Batch, ItemCategory, Location, PaginatedResponse } from './types.js';

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
          throw new Error(`API Error (${error.response.status}): ${data.error || error.message}`);
        }
        throw error;
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
}
