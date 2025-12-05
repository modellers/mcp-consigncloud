/**
 * Caching wrapper around ConsignCloudClient
 * Handles caching, pagination, and cache invalidation
 */

import { ConsignCloudClient } from './client.js';
import { CacheManager } from './cache.js';
import { Item, Sale, Account, Batch, ItemCategory, Location, PaginatedResponse } from './types.js';

// Cache invalidation map
const INVALIDATION_MAP: Record<string, string[]> = {
  // Items
  create_item: ['items', 'item:*'],
  update_item: ['items', 'item:*'],
  delete_item: ['items', 'item:*'],
  restore_item: ['items', 'item:*'],
  bulk_edit_items: ['items', 'item:*'],
  update_item_statuses: ['items', 'item:*'],

  // Sales (affects items too - changes status)
  create_sale: ['sales', 'sale:*', 'items'],
  update_sale: ['sales', 'sale:*', 'items'],
  void_sale: ['sales', 'sale:*', 'items'],
  refund_sale: ['sales', 'sale:*', 'items'],

  // Accounts
  create_account: ['accounts', 'account:*'],
  update_account: ['accounts', 'account:*'],
  delete_account: ['accounts', 'account:*'],

  // Categories
  create_category: ['categories', 'category:*'],
  update_category: ['categories', 'category:*'],
  delete_category: ['categories', 'category:*'],

  // Locations
  create_location: ['locations', 'location:*'],
  update_location: ['locations', 'location:*'],
  delete_location: ['locations', 'location:*'],

  // Batches (affects items)
  create_batch: ['batches', 'batch:*'],
  update_batch: ['batches', 'batch:*'],
  update_batch_status: ['batches', 'batch:*', 'items'],
};

export class CachingClient {
  public lastRequestWasCached = false;
  public lastCacheTimestamp: string | null = null;

  constructor(
    private client: ConsignCloudClient,
    private cache: CacheManager
  ) {}

  // ==================== LIST METHODS (Bulk Data) ====================

  /**
   * List items with caching and automatic pagination
   */
  async listItems(params?: Record<string, any>): Promise<Item[]> {
    return this.fetchListWithCache('items', params, (p) => this.client.listItems(p));
  }

  /**
   * List sales with caching and automatic pagination
   */
  async listSales(params?: Record<string, any>): Promise<Sale[]> {
    return this.fetchListWithCache('sales', params, (p) => this.client.listSales(p));
  }

  /**
   * List accounts with caching and automatic pagination
   */
  async listAccounts(params?: Record<string, any>): Promise<Account[]> {
    return this.fetchListWithCache('accounts', params, (p) => this.client.listAccounts(p));
  }

  /**
   * List categories with caching and automatic pagination
   */
  async listCategories(params?: Record<string, any>): Promise<ItemCategory[]> {
    return this.fetchListWithCache('categories', params, (p) => this.client.listCategories(p));
  }

  /**
   * List locations with caching and automatic pagination
   */
  async listLocations(params?: Record<string, any>): Promise<Location[]> {
    return this.fetchListWithCache('locations', params, (p) => this.client.listLocations(p));
  }

  /**
   * List batches with caching and automatic pagination
   */
  async listBatches(params?: Record<string, any>): Promise<Batch[]> {
    return this.fetchListWithCache('batches', params, (p) => this.client.listBatches(p));
  }

  // ==================== GET BY ID METHODS ====================

  /**
   * Get item by ID with caching
   */
  async getItem(id: string): Promise<Item> {
    return this.fetchByIdWithCache('items', id, () => this.client.getItem(id));
  }

  /**
   * Get sale by ID with caching
   */
  async getSale(id: string): Promise<Sale> {
    return this.fetchByIdWithCache('sales', id, () => this.client.getSale(id));
  }

  /**
   * Get account by ID with caching
   */
  async getAccount(id: string): Promise<Account> {
    return this.fetchByIdWithCache('accounts', id, () => this.client.getAccount(id));
  }

  /**
   * Get batch by ID with caching
   */
  async getBatch(id: string): Promise<Batch> {
    return this.fetchByIdWithCache('batches', id, () => this.client.getBatch(id));
  }

  /**
   * Get category by ID with caching
   */
  async getCategory(id: string): Promise<ItemCategory> {
    return this.fetchByIdWithCache('categories', id, () => this.client.getCategory(id));
  }

  /**
   * Get location by ID with caching
   */
  async getLocation(id: string): Promise<Location> {
    return this.fetchByIdWithCache('locations', id, () => this.client.getLocation(id));
  }

  // ==================== STATS/ANALYTICS (Use Cache, Don't Cache Results) ====================

  /**
   * Get item stats (calculated from cached items)
   */
  async getItemStats(): Promise<any> {
    // Use cached items if available
    await this.listItems({});
    // Delegate to client (which will fetch fresh if cache was empty)
    return this.client.getItemStats();
  }

  /**
   * Get account stats (calculated from cached data)
   */
  async getAccountStats(id: string): Promise<any> {
    // Use cached data if available
    await this.listItems({ account: id });
    await this.listSales({});
    // Delegate to client
    return this.client.getAccountStats(id);
  }

  /**
   * Get sales trends (calculated from cached sales)
   */
  async getSalesTrends(params: { start_date: string; end_date: string; bucket_size: 'day' | 'week' | 'month' }): Promise<any> {
    // Use cached sales if available
    await this.listSales({});
    // Delegate to client
    return this.client.getSalesTrends(params);
  }

  /**
   * Calculate inventory value (uses cached items)
   */
  async calculateInventoryValue(params?: Record<string, any>): Promise<any> {
    // Ensure items are cached
    await this.listItems(params || {});
    // Delegate to client which will use the now-cached data
    return this.client.calculateInventoryValue(params);
  }

  /**
   * Calculate sales totals (uses cached sales)
   */
  async calculateSalesTotals(params?: Record<string, any>): Promise<any> {
    // Ensure sales are cached
    await this.listSales(params || {});
    // Delegate to client which will use the now-cached data
    return this.client.calculateSalesTotals(params);
  }

  /**
   * Calculate account metrics (uses cached items + sales)
   */
  async calculateAccountMetrics(params: { account_id: string; date_from?: string; date_to?: string; inventory_type?: string }): Promise<any> {
    // Ensure data is cached
    await this.listItems({ account: params.account_id });
    await this.listSales({});
    // Delegate to client which will use the now-cached data
    return this.client.calculateAccountMetrics(params);
  }

  // ==================== SEARCH (No Cache) ====================

  /**
   * Search (always fresh, no cache)
   */
  async search(query: string, entities?: string[]): Promise<any> {
    this.lastRequestWasCached = false;
    this.lastCacheTimestamp = null;
    return this.client.search(query, entities);
  }

  /**
   * Suggest field values (always fresh, no cache)
   */
  async suggestFieldValues(entity: 'items' | 'accounts', field: string, value: string): Promise<any> {
    this.lastRequestWasCached = false;
    this.lastCacheTimestamp = null;
    return this.client.suggestFieldValues(entity, field, value);
  }

  // ==================== MUTATIONS (Invalidate Cache) ====================

  /**
   * Create item
   */
  async createItem(data: Partial<Item>): Promise<Item> {
    const result = await this.client.createItem(data);
    this.invalidateCache('create_item');
    return result;
  }

  /**
   * Update item
   */
  async updateItem(id: string, data: Partial<Item>): Promise<Item> {
    const result = await this.client.updateItem(id, data);
    this.invalidateCache('update_item');
    return result;
  }

  /**
   * Delete item
   */
  async deleteItem(id: string): Promise<void> {
    await this.client.deleteItem(id);
    this.invalidateCache('delete_item');
  }

  /**
   * Restore item
   */
  async restoreItem(id: string): Promise<Item> {
    const result = await this.client.restoreItem(id);
    this.invalidateCache('restore_item');
    return result;
  }

  /**
   * Bulk edit items
   */
  async bulkEditItems(data: any): Promise<any> {
    const result = await this.client.bulkEditItems(data);
    this.invalidateCache('bulk_edit_items');
    return result;
  }

  /**
   * Update item statuses
   */
  async updateItemStatuses(itemIds: string[], status: string): Promise<any> {
    const result = await this.client.updateItemStatuses(itemIds, status);
    this.invalidateCache('update_item_statuses');
    return result;
  }

  /**
   * Create sale
   */
  async createSale(data: Partial<Sale>): Promise<Sale> {
    const result = await this.client.createSale(data);
    this.invalidateCache('create_sale');
    return result;
  }

  /**
   * Update sale
   */
  async updateSale(id: string, data: Partial<Sale>): Promise<Sale> {
    const result = await this.client.updateSale(id, data);
    this.invalidateCache('update_sale');
    return result;
  }

  /**
   * Void sale
   */
  async voidSale(id: string): Promise<Sale> {
    const result = await this.client.voidSale(id);
    this.invalidateCache('void_sale');
    return result;
  }

  /**
   * Refund sale
   */
  async refundSale(id: string, data?: any): Promise<Sale> {
    const result = await this.client.refundSale(id, data);
    this.invalidateCache('refund_sale');
    return result;
  }

  /**
   * Create account
   */
  async createAccount(data: Partial<Account>): Promise<Account> {
    const result = await this.client.createAccount(data);
    this.invalidateCache('create_account');
    return result;
  }

  /**
   * Update account
   */
  async updateAccount(id: string, data: Partial<Account>): Promise<Account> {
    const result = await this.client.updateAccount(id, data);
    this.invalidateCache('update_account');
    return result;
  }

  /**
   * Delete account
   */
  async deleteAccount(id: string): Promise<void> {
    await this.client.deleteAccount(id);
    this.invalidateCache('delete_account');
  }

  /**
   * Create category
   */
  async createCategory(data: Partial<ItemCategory>): Promise<ItemCategory> {
    const result = await this.client.createCategory(data);
    this.invalidateCache('create_category');
    return result;
  }

  /**
   * Update category
   */
  async updateCategory(id: string, data: Partial<ItemCategory>): Promise<ItemCategory> {
    const result = await this.client.updateCategory(id, data);
    this.invalidateCache('update_category');
    return result;
  }

  /**
   * Delete category
   */
  async deleteCategory(id: string): Promise<void> {
    await this.client.deleteCategory(id);
    this.invalidateCache('delete_category');
  }

  /**
   * Create location
   */
  async createLocation(data: Partial<Location>): Promise<Location> {
    const result = await this.client.createLocation(data);
    this.invalidateCache('create_location');
    return result;
  }

  /**
   * Update location
   */
  async updateLocation(id: string, data: Partial<Location>): Promise<Location> {
    const result = await this.client.updateLocation(id, data);
    this.invalidateCache('update_location');
    return result;
  }

  /**
   * Delete location
   */
  async deleteLocation(id: string): Promise<void> {
    await this.client.deleteLocation(id);
    this.invalidateCache('delete_location');
  }

  /**
   * Create batch
   */
  async createBatch(data: Partial<Batch>): Promise<Batch> {
    const result = await this.client.createBatch(data);
    this.invalidateCache('create_batch');
    return result;
  }

  /**
   * Update batch
   */
  async updateBatch(id: string, data: Partial<Batch>): Promise<Batch> {
    const result = await this.client.updateBatch(id, data);
    this.invalidateCache('update_batch');
    return result;
  }

  /**
   * Update batch status
   */
  async updateBatchStatus(id: string, status: 'draft' | 'submitted'): Promise<Batch> {
    const result = await this.client.updateBatchStatus(id, status);
    this.invalidateCache('update_batch_status');
    return result;
  }

  /**
   * List balance entries (no cache - infrequent use)
   */
  async listBalanceEntries(params?: Record<string, any>): Promise<any> {
    this.lastRequestWasCached = false;
    this.lastCacheTimestamp = null;
    return this.client.listBalanceEntries(params);
  }

  // ==================== CACHE CONTROL ====================

  /**
   * Clear specific cache types
   */
  clearCache(types: string | string[]): void {
    const typeArray = Array.isArray(types) ? types : [types];

    if (typeArray.includes('all')) {
      this.cache.clearAll();
      console.log('[CachingClient] Cleared all caches');
    } else {
      for (const type of typeArray) {
        this.cache.invalidate(type);
        console.log(`[CachingClient] Cleared ${type} cache`);
      }
    }
  }

  /**
   * Refresh cache for a specific type (clear + fetch)
   */
  async refreshCache(type: string): Promise<void> {
    this.cache.invalidate(type);
    console.log(`[CachingClient] Refreshing ${type} cache...`);

    // Fetch fresh data
    switch (type) {
      case 'items':
        await this.listItems({});
        break;
      case 'sales':
        await this.listSales({});
        break;
      case 'accounts':
        await this.listAccounts({});
        break;
      case 'categories':
        await this.listCategories({});
        break;
      case 'locations':
        await this.listLocations({});
        break;
      case 'batches':
        await this.listBatches({});
        break;
      default:
        throw new Error(`Unknown cache type: ${type}`);
    }

    console.log(`[CachingClient] ${type} cache refreshed`);
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): Record<string, any> {
    const stats = this.cache.getAllStats();

    // Log stats
    console.log('[CachingClient] Cache Statistics:');
    for (const [type, stat] of Object.entries(stats)) {
      if (stat) {
        console.log(`  ${type}:`, {
          items: stat.totalItems,
          queries: stat.uniqueQueries,
          hitRate: `${(stat.hitRate! * 100).toFixed(1)}%`,
          sizeMB: stat.sizeEstimateMB,
          expires: stat.expiresAt,
        });
      } else {
        console.log(`  ${type}: empty`);
      }
    }

    return stats;
  }

  // ==================== PRIVATE HELPERS ====================

  /**
   * Generic list fetching with cache support
   */
  private async fetchListWithCache<T extends { id: string }>(
    type: string,
    params: Record<string, any> = {},
    fetchFn: (params: Record<string, any>) => Promise<PaginatedResponse<T>>
  ): Promise<T[]> {
    // Try cache first
    const cached = this.cache.get<T>(type, params);
    if (cached) {
      this.lastRequestWasCached = true;
      const stats = this.cache.getAllStats()[type];
      this.lastCacheTimestamp = stats?.lastUpdated || null;
      return cached;
    }

    // Cache miss - fetch all pages
    console.log(`[CachingClient] Fetching ${type} from API...`);
    let allItems: T[] = [];
    let cursor: string | null = null;
    const queryParams: Record<string, any> = { limit: 100, ...params };

    do {
      if (cursor) queryParams.cursor = cursor;
      const response = await fetchFn(queryParams);
      allItems = allItems.concat(response.data);
      cursor = response.next_cursor;
    } while (cursor);

    console.log(`[CachingClient] Fetched ${allItems.length} ${type} from API`);

    // Cache the results
    this.cache.set(type, params, allItems);
    this.lastRequestWasCached = false;
    this.lastCacheTimestamp = new Date().toISOString();

    return allItems;
  }

  /**
   * Generic single entity fetching with cache support
   */
  private async fetchByIdWithCache<T extends { id: string }>(
    type: string,
    id: string,
    fetchFn: () => Promise<T>
  ): Promise<T> {
    // Try cache first
    const cached = this.cache.getById<T>(type, id);
    if (cached) {
      this.lastRequestWasCached = true;
      const stats = this.cache.getAllStats()[type];
      this.lastCacheTimestamp = stats?.lastUpdated || null;
      return cached;
    }

    // Cache miss - fetch from API
    console.log(`[CachingClient] Fetching ${type}:${id} from API...`);
    const item = await fetchFn();

    // Cache the result
    this.cache.setById(type, id, item);
    this.lastRequestWasCached = false;
    this.lastCacheTimestamp = new Date().toISOString();

    return item;
  }

  /**
   * Invalidate caches based on operation
   */
  private invalidateCache(operation: string): void {
    const types = INVALIDATION_MAP[operation];
    if (types) {
      this.cache.invalidate(types);
    }
  }
}
