/**
 * Cache infrastructure for MCP server
 * Implements query-based caching with merge support
 */

export interface QueryMetadata {
  params: Record<string, any>;
  fetchedAt: Date;
}

export interface CacheEntry<T> {
  id: string;
  data: T;
  queries: QueryMetadata[];
}

export interface BulkCacheData<T> {
  entries: Map<string, CacheEntry<T>>;
  lastUpdated: Date;
  expiresAt: Date;
  uniqueQueries: Set<string>; // Serialized query params
}

export interface CacheStats {
  totalItems: number;
  uniqueQueries: number;
  lastUpdated: string;
  expiresAt: string;
  hitRate?: number;
  sizeEstimateMB?: number;
}

export interface CacheConfig {
  enabled: boolean;
  warningThreshold: number;
  ttl: {
    categories: number;
    locations: number;
    accounts: number;
    items: number;
    sales: number;
    batches: number;
    [key: string]: number;
  };
}

/**
 * Manages a single bulk cache for a data type
 */
export class BulkCache<T extends { id: string }> {
  private data: BulkCacheData<T> | null = null;
  private hits = 0;
  private misses = 0;

  constructor(
    private readonly type: string,
    private readonly ttlSeconds: number,
    private readonly warningThreshold: number
  ) {}

  /**
   * Check if cache is valid (not expired)
   */
  isValid(): boolean {
    if (!this.data) return false;
    return new Date() < this.data.expiresAt;
  }

  /**
   * Get all cached entries that match the query params
   */
  get(queryParams: Record<string, any>): T[] | null {
    if (!this.isValid()) {
      this.misses++;
      return null;
    }

    const queryKey = this.serializeQuery(queryParams);

    // Check if we have data for this exact query
    if (this.data!.uniqueQueries.has(queryKey)) {
      this.hits++;

      // Filter entries that were fetched with compatible params
      const results = Array.from(this.data!.entries.values())
        .filter(entry => this.entryMatchesQuery(entry, queryParams))
        .map(entry => entry.data);

      console.log(`[Cache] ${this.type} HIT for query ${queryKey} - ${results.length} items`);
      return results;
    }

    this.misses++;
    console.log(`[Cache] ${this.type} MISS for query ${queryKey}`);
    return null;
  }

  /**
   * Set/merge data into cache with query metadata
   */
  set(queryParams: Record<string, any>, items: T[]): void {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.ttlSeconds * 1000);
    const queryKey = this.serializeQuery(queryParams);

    if (!this.data || !this.isValid()) {
      // Initialize new cache
      this.data = {
        entries: new Map(),
        lastUpdated: now,
        expiresAt,
        uniqueQueries: new Set([queryKey]),
      };
    } else {
      // Merge into existing cache
      this.data.uniqueQueries.add(queryKey);
      this.data.lastUpdated = now;
    }

    // Add/update entries
    const queryMetadata: QueryMetadata = {
      params: queryParams,
      fetchedAt: now,
    };

    for (const item of items) {
      const existing = this.data.entries.get(item.id);
      if (existing) {
        // Update existing entry, add query metadata
        existing.data = item;
        existing.queries.push(queryMetadata);
      } else {
        // New entry
        this.data.entries.set(item.id, {
          id: item.id,
          data: item,
          queries: [queryMetadata],
        });
      }
    }

    const totalItems = this.data.entries.size;
    this.checkThreshold(totalItems);

    console.log(`[Cache] ${this.type} SET for query ${queryKey} - ${items.length} items (total cached: ${totalItems})`);
  }

  /**
   * Get a single item by ID
   */
  getById(id: string): T | null {
    if (!this.isValid()) return null;

    const entry = this.data!.entries.get(id);
    if (entry) {
      this.hits++;
      console.log(`[Cache] ${this.type}:${id} HIT`);
      return entry.data;
    }

    this.misses++;
    return null;
  }

  /**
   * Set a single item by ID
   */
  setById(id: string, item: T, ttlSeconds?: number): void {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + (ttlSeconds || this.ttlSeconds) * 1000);

    if (!this.data || !this.isValid()) {
      this.data = {
        entries: new Map(),
        lastUpdated: now,
        expiresAt,
        uniqueQueries: new Set(),
      };
    }

    this.data.entries.set(id, {
      id,
      data: item,
      queries: [{ params: { id }, fetchedAt: now }],
    });

    console.log(`[Cache] ${this.type}:${id} SET`);
  }

  /**
   * Invalidate (clear) the cache
   */
  invalidate(): void {
    if (this.data) {
      const count = this.data.entries.size;
      console.log(`[Cache] ${this.type} INVALIDATED - cleared ${count} items`);
    }
    this.data = null;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats | null {
    if (!this.data) return null;

    const totalItems = this.data.entries.size;
    const totalRequests = this.hits + this.misses;
    const hitRate = totalRequests > 0 ? this.hits / totalRequests : 0;

    // Rough size estimate (not accurate, but gives an idea)
    const sizeEstimateMB = (totalItems * 2) / 1024; // Assume ~2KB per item

    return {
      totalItems,
      uniqueQueries: this.data.uniqueQueries.size,
      lastUpdated: this.data.lastUpdated.toISOString(),
      expiresAt: this.data.expiresAt.toISOString(),
      hitRate: Math.round(hitRate * 100) / 100,
      sizeEstimateMB: Math.round(sizeEstimateMB * 100) / 100,
    };
  }

  /**
   * Serialize query params to a consistent string key
   */
  private serializeQuery(params: Record<string, any>): string {
    // Sort keys for consistent serialization
    const sortedKeys = Object.keys(params).sort();
    const normalized: Record<string, any> = {};

    for (const key of sortedKeys) {
      // Ignore limit and cursor (pagination params)
      if (key === 'limit' || key === 'cursor') continue;
      normalized[key] = params[key];
    }

    return JSON.stringify(normalized);
  }

  /**
   * Check if a cache entry matches the query params
   */
  private entryMatchesQuery(entry: CacheEntry<T>, queryParams: Record<string, any>): boolean {
    // An entry matches if it was fetched with compatible query params
    return entry.queries.some(q => {
      // Check if the query that fetched this entry is compatible
      for (const [key, value] of Object.entries(queryParams)) {
        // Ignore pagination params
        if (key === 'limit' || key === 'cursor') continue;

        // If the entry's query had this filter and it matches, include it
        if (q.params[key] !== undefined && q.params[key] !== value) {
          return false;
        }
      }
      return true;
    });
  }

  /**
   * Check if cache size exceeds thresholds and log warnings
   */
  private checkThreshold(count: number): void {
    if (count >= 100000) {
      console.warn(`🚨 CRITICAL: ${this.type} cache has ${count.toLocaleString()} items! Consider clearing cache.`);
    } else if (count >= 50000) {
      console.warn(`⚠️  WARNING: ${this.type} cache has ${count.toLocaleString()} items (threshold: ${this.warningThreshold.toLocaleString()})`);
    } else if (count >= this.warningThreshold) {
      console.warn(`⚠️  ${this.type} cache has ${count.toLocaleString()} items (threshold: ${this.warningThreshold.toLocaleString()})`);
    }
  }
}

/**
 * Manages all caches for the MCP server
 */
export class CacheManager {
  private caches = new Map<string, BulkCache<any>>();
  private config: CacheConfig;

  constructor(config: Partial<CacheConfig> = {}) {
    // Default configuration
    this.config = {
      enabled: config.enabled !== undefined ? config.enabled : true,
      warningThreshold: config.warningThreshold || 10000,
      ttl: {
        categories: 24 * 60 * 60,    // 24h
        locations: 24 * 60 * 60,     // 24h
        accounts: 4 * 60 * 60,       // 4h
        items: 2 * 60 * 60,          // 2h
        sales: 1 * 60 * 60,          // 1h
        batches: 2 * 60 * 60,        // 2h
        'item:id': 30 * 60,          // 30m
        'sale:id': 15 * 60,          // 15m
        'account:id': 1 * 60 * 60,   // 1h
        'batch:id': 30 * 60,         // 30m
        'category:id': 24 * 60 * 60, // 24h
        'location:id': 24 * 60 * 60, // 24h
        ...config.ttl,
      },
    };

    console.log(`[Cache] Initialized - enabled: ${this.config.enabled}, threshold: ${this.config.warningThreshold}`);
  }

  /**
   * Get or create a cache for a data type
   */
  private getCache<T extends { id: string }>(type: string): BulkCache<T> {
    if (!this.caches.has(type)) {
      const ttl = this.config.ttl[type] || this.config.ttl.items;
      this.caches.set(type, new BulkCache<T>(type, ttl, this.config.warningThreshold));
    }
    return this.caches.get(type)!;
  }

  /**
   * Get cached data for a query
   */
  get<T extends { id: string }>(type: string, queryParams: Record<string, any>): T[] | null {
    if (!this.config.enabled) return null;
    return this.getCache<T>(type).get(queryParams);
  }

  /**
   * Set/merge cached data for a query
   */
  set<T extends { id: string }>(type: string, queryParams: Record<string, any>, items: T[]): void {
    if (!this.config.enabled) return;
    this.getCache<T>(type).set(queryParams, items);
  }

  /**
   * Get a single cached item by ID
   */
  getById<T extends { id: string }>(type: string, id: string): T | null {
    if (!this.config.enabled) return null;
    return this.getCache<T>(type).getById(id);
  }

  /**
   * Set a single cached item by ID
   */
  setById<T extends { id: string }>(type: string, id: string, item: T): void {
    if (!this.config.enabled) return;
    const ttl = this.config.ttl[`${type}:id`];
    this.getCache<T>(type).setById(id, item, ttl);
  }

  /**
   * Invalidate one or more cache types
   */
  invalidate(types: string | string[]): void {
    const typeArray = Array.isArray(types) ? types : [types];

    for (const type of typeArray) {
      if (type.endsWith(':*')) {
        // Invalidate all single-entity caches for this type
        const baseType = type.slice(0, -2);
        this.getCache(baseType).invalidate();
      } else {
        this.getCache(type).invalidate();
      }
    }
  }

  /**
   * Clear all caches
   */
  clearAll(): void {
    for (const cache of this.caches.values()) {
      cache.invalidate();
    }
    console.log('[Cache] Cleared all caches');
  }

  /**
   * Get statistics for all caches
   */
  getAllStats(): Record<string, CacheStats | null> {
    const stats: Record<string, CacheStats | null> = {};

    for (const [type, cache] of this.caches.entries()) {
      stats[type] = cache.getStats();
    }

    return stats;
  }

  /**
   * Check if caching is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }
}
