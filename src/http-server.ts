#!/usr/bin/env node

import express from 'express';
import cors from 'cors';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import dotenv from 'dotenv';
import { ConsignCloudClient } from './client.js';
import { CachingClient } from './cache-wrapper.js';
import { CacheManager } from './cache.js';
import { setupServer } from './server.js';

// Load environment variables
dotenv.config();

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const config: Record<string, string> = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].substring(2);
      const value = args[i + 1];
      if (value && !value.startsWith('--')) {
        config[key] = value;
        i++;
      }
    }
  }

  return config;
}

const cliArgs = parseArgs();

// Prioritize CLI args over environment variables
const API_KEY = cliArgs['api-key'] || process.env.CONSIGNCLOUD_API_KEY;
const API_BASE_URL = cliArgs['api-url'] || process.env.CONSIGNCLOUD_API_BASE_URL || 'https://api.consigncloud.com/api/v1';
const PORT = parseInt(cliArgs['port'] || process.env.PORT || '3000');
const HOST = cliArgs['host'] || process.env.HOST || 'localhost';
const CACHE_ENABLED = process.env.CACHE_ENABLED !== 'false'; // Default: true
const CACHE_WARNING_THRESHOLD = parseInt(process.env.CACHE_WARNING_THRESHOLD || '10000');

if (!API_KEY) {
  console.error('❌ Error: CONSIGNCLOUD_API_KEY is required');
  console.error('   Provide it via:');
  console.error('   - Command line: --api-key YOUR_API_KEY');
  console.error('   - Environment variable: CONSIGNCLOUD_API_KEY');
  console.error('   - .env file');
  process.exit(1);
}

// Log configuration (mask sensitive data)
console.log('📋 Configuration:');
console.log(`   API URL: ${API_BASE_URL}`);
console.log(`   API Key: ${API_KEY.substring(0, 8)}...${API_KEY.substring(API_KEY.length - 4)}`);
console.log(`   Server: http://${HOST}:${PORT}`);
console.log(`   Cache: ${CACHE_ENABLED ? 'enabled' : 'disabled'}, threshold: ${CACHE_WARNING_THRESHOLD}`);

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

// Create Express app
const app = express();

// Middleware
app.use(cors());

// Store transports by session ID
const transports = new Map<string, SSEServerTransport>();

// Health check endpoint
app.get('/health', (_req, res) => {
  console.log('💓 GET /health');
  res.json({ status: 'ok', service: 'consigncloud-mcp-server' });
});

// SSE endpoint for MCP
app.get('/sse', async (req, res) => {
  console.log('🔌 GET /sse - New SSE connection established');

  const transport = new SSEServerTransport('/message', res);
  const server = setupServer(client);

  // Store transport by session ID
  transports.set(transport.sessionId, transport);
  console.log(`✅ Session ${transport.sessionId} registered (total active: ${transports.size})`);

  await server.connect(transport);

  // Handle client disconnect
  req.on('close', () => {
    console.log(`🔌 SSE connection closed for session ${transport.sessionId}`);
    transports.delete(transport.sessionId);
    console.log(`📊 Active sessions: ${transports.size}`);
  });
});

// Message endpoint for SSE
app.post('/message', async (req, res) => {
  const sessionId = req.query.sessionId as string;
  console.log(`📨 POST /message - sessionId: ${sessionId || 'missing'}`);

  if (!sessionId) {
    console.log('❌ Request rejected: Missing sessionId');
    res.status(400).json({ error: 'Missing sessionId query parameter' });
    return;
  }

  const transport = transports.get(sessionId);

  if (transport) {
    console.log(`✅ Routing message to session ${sessionId}`);
    await transport.handlePostMessage(req, res);
  } else {
    console.log(`❌ Session ${sessionId} not found (active sessions: ${transports.size})`);
    res.status(404).json({ error: 'Session not found' });
  }
});

// Start server with validation
async function startServer() {
  try {
    // Validate API connection by making a simple API call
    console.log('\n🔍 Validating API connection...');
    await client.listLocations({ limit: 1 });
    console.log('✅ API connection successful');

    app.listen(PORT, HOST, () => {
      console.log(`\n✅ ConsignCloud MCP Server running`);
      console.log(`   SSE endpoint: http://${HOST}:${PORT}/sse`);
      console.log(`   Health check: http://${HOST}:${PORT}/health`);
      console.log(`\n📘 To test with MCP Inspector:`);
      console.log(`   npx @modelcontextprotocol/inspector http://${HOST}:${PORT}/sse`);
    });
  } catch (error) {
    console.error('\n❌ Failed to validate API connection');
    if (error instanceof Error) {
      console.error(`   Error: ${error.message}`);
    }
    console.error('\n   Please check:');
    console.error('   1. Your API key is valid');
    console.error('   2. The API URL is correct');
    console.error('   3. You have network connectivity');
    process.exit(1);
  }
}

startServer().catch((error) => {
  console.error('❌ Server startup failed:', error);
  process.exit(1);
});
