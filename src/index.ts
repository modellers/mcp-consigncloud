#!/usr/bin/env node

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import dotenv from 'dotenv';
import { ConsignCloudClient } from './client.js';
import { CachingClient } from './cache-wrapper.js';
import { CacheManager } from './cache.js';
import { setupServer } from './server.js';

// Load environment variables
dotenv.config();

const API_KEY = process.env.CONSIGNCLOUD_API_KEY;
const API_BASE_URL = process.env.CONSIGNCLOUD_API_BASE_URL || 'https://api.consigncloud.com/api/v1';
const CACHE_ENABLED = process.env.CACHE_ENABLED !== 'false'; // Default: true
const CACHE_WARNING_THRESHOLD = parseInt(process.env.CACHE_WARNING_THRESHOLD || '10000');

if (!API_KEY) {
  console.error('Error: CONSIGNCLOUD_API_KEY environment variable is required');
  process.exit(1);
}

// Initialize ConsignCloud client
const baseClient = new ConsignCloudClient(API_KEY, API_BASE_URL);

// Initialize cache manager
const cacheConfig = {
  enabled: CACHE_ENABLED,
  warningThreshold: CACHE_WARNING_THRESHOLD,
  ttl: {
    categories: parseInt(process.env.CACHE_TTL_CATEGORIES || String(24 * 60 * 60)),
    locations: parseInt(process.env.CACHE_TTL_LOCATIONS || String(24 * 60 * 60)),
    accounts: parseInt(process.env.CACHE_TTL_ACCOUNTS || String(4 * 60 * 60)),
    items: parseInt(process.env.CACHE_TTL_ITEMS || String(2 * 60 * 60)),
    sales: parseInt(process.env.CACHE_TTL_SALES || String(1 * 60 * 60)),
    batches: parseInt(process.env.CACHE_TTL_BATCHES || String(2 * 60 * 60)),
  },
};

const cacheManager = new CacheManager(cacheConfig);
const client = new CachingClient(baseClient, cacheManager);

console.error(`[Config] Cache enabled: ${CACHE_ENABLED}, threshold: ${CACHE_WARNING_THRESHOLD}`);

// Create and configure server
const server = setupServer(client);

// Start server with stdio transport
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('ConsignCloud MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
