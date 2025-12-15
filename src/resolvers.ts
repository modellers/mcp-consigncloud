/**
 * Resolvers for converting names to IDs with fuzzy matching
 */

import fuzzysort from 'fuzzysort';
import { CachingClient } from './cache-wrapper.js';
import { ItemCategory, Location, Account } from './types.js';

export class EntityResolver {
  constructor(private client: CachingClient) {}

  /**
   * Resolve category name or ID to category ID
   * Supports:
   * - Direct ID match (UUID format)
   * - Exact name match (case-insensitive)
   * - Fuzzy name match
   */
  async resolveCategoryId(input: string): Promise<string | null> {
    // If it looks like a UUID, return as-is
    if (this.isUuid(input)) {
      return input;
    }

    // Fetch all categories (cached)
    const categories = await this.client.listCategories({});

    // Try exact match first (case-insensitive)
    const exactMatch = categories.find(
      c => c.name?.toLowerCase() === input.toLowerCase()
    );
    if (exactMatch) {
      return exactMatch.id;
    }

    // Fuzzy match
    const results = fuzzysort.go(input, categories, {
      key: 'name',
      limit: 1,
      threshold: -10000, // Accept reasonable matches
    });

    if (results.length > 0) {
      const match = results[0];
      console.log(`[Resolver] Fuzzy matched category "${input}" to "${match.obj.name}" (score: ${match.score})`);
      return match.obj.id;
    }

    return null;
  }

  /**
   * Resolve location name or ID to location ID
   */
  async resolveLocationId(input: string): Promise<string | null> {
    if (this.isUuid(input)) {
      return input;
    }

    const locations = await this.client.listLocations({});

    // Try exact match first
    const exactMatch = locations.find(
      l => l.name?.toLowerCase() === input.toLowerCase()
    );
    if (exactMatch) {
      return exactMatch.id;
    }

    // Fuzzy match
    const results = fuzzysort.go(input, locations, {
      key: 'name',
      limit: 1,
      threshold: -10000,
    });

    if (results.length > 0) {
      const match = results[0];
      console.log(`[Resolver] Fuzzy matched location "${input}" to "${match.obj.name}" (score: ${match.score})`);
      return match.obj.id;
    }

    return null;
  }

  /**
   * Resolve account name/number/email or ID to account ID
   * Searches: first_name, last_name, company, email, number
   */
  async resolveAccountId(input: string): Promise<string | null> {
    if (this.isUuid(input)) {
      return input;
    }

    const accounts = await this.client.listAccounts({});

    // Try exact matches first
    const exactMatch = accounts.find(a => {
      const fullName = [a.first_name, a.last_name].filter(Boolean).join(' ').toLowerCase();
      const company = a.company?.toLowerCase() || '';
      const email = a.email?.toLowerCase() || '';
      const number = a.number?.toLowerCase() || '';
      const inputLower = input.toLowerCase();

      return (
        fullName === inputLower ||
        company === inputLower ||
        email === inputLower ||
        number === inputLower
      );
    });

    if (exactMatch) {
      return exactMatch.id;
    }

    // Fuzzy match on multiple fields
    const searchableAccounts = accounts.map(a => ({
      ...a,
      searchableText: [
        a.first_name,
        a.last_name,
        a.company,
        a.email,
        a.number,
      ].filter(Boolean).join(' '),
    }));

    const results = fuzzysort.go(input, searchableAccounts, {
      key: 'searchableText',
      limit: 1,
      threshold: -10000,
    });

    if (results.length > 0) {
      const match = results[0];
      const displayName = [match.obj.first_name, match.obj.last_name].filter(Boolean).join(' ')
        || match.obj.company
        || match.obj.number;
      console.log(`[Resolver] Fuzzy matched account "${input}" to "${displayName}" (score: ${match.score})`);
      return match.obj.id;
    }

    return null;
  }

  /**
   * Resolve multiple categories at once (for batch operations)
   */
  async resolveCategoryIds(inputs: string[]): Promise<Map<string, string | null>> {
    const results = new Map<string, string | null>();

    for (const input of inputs) {
      const resolved = await this.resolveCategoryId(input);
      results.set(input, resolved);
    }

    return results;
  }

  /**
   * Check if string looks like a UUID
   */
  private isUuid(str: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  }

  /**
   * Get category name from ID (for display purposes)
   */
  async getCategoryName(id: string): Promise<string | null> {
    const categories = await this.client.listCategories({});
    const category = categories.find(c => c.id === id);
    return category?.name || null;
  }

  /**
   * Get location name from ID
   */
  async getLocationName(id: string): Promise<string | null> {
    const locations = await this.client.listLocations({});
    const location = locations.find(l => l.id === id);
    return location?.name || null;
  }

  /**
   * Get account display name from ID
   */
  async getAccountName(id: string): Promise<string | null> {
    const accounts = await this.client.listAccounts({});
    const account = accounts.find(a => a.id === id);
    if (!account) return null;

    return [account.first_name, account.last_name].filter(Boolean).join(' ')
      || account.company
      || account.number
      || id;
  }
}
