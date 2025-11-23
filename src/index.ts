#!/usr/bin/env node

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import dotenv from 'dotenv';
import { ConsignCloudClient } from './client.js';
import { setupServer } from './server.js';

// Load environment variables
dotenv.config();

const API_KEY = process.env.CONSIGNCLOUD_API_KEY;
const API_BASE_URL = process.env.CONSIGNCLOUD_API_BASE_URL || 'https://api.consigncloud.com/api/v1';

if (!API_KEY) {
  console.error('Error: CONSIGNCLOUD_API_KEY environment variable is required');
  process.exit(1);
}

// Initialize ConsignCloud client
const client = new ConsignCloudClient(API_KEY, API_BASE_URL);

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
