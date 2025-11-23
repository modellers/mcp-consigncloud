#!/usr/bin/env node

import express from 'express';
import cors from 'cors';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import dotenv from 'dotenv';
import { ConsignCloudClient } from './client.js';
import { setupServer } from './server.js';

// Load environment variables
dotenv.config();

const API_KEY = process.env.CONSIGNCLOUD_API_KEY;
const API_BASE_URL = process.env.CONSIGNCLOUD_API_BASE_URL || 'https://api.consigncloud.com/api/v1';
const PORT = parseInt(process.env.PORT || '3000');
const HOST = process.env.HOST || 'localhost';

if (!API_KEY) {
  console.error('Error: CONSIGNCLOUD_API_KEY environment variable is required');
  process.exit(1);
}

// Initialize ConsignCloud client
const client = new ConsignCloudClient(API_KEY, API_BASE_URL);

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'consigncloud-mcp-server' });
});

// SSE endpoint for MCP
app.get('/sse', async (req, res) => {
  console.log('New SSE connection established');

  const transport = new SSEServerTransport('/message', res);
  const server = setupServer(client);

  await server.connect(transport);

  // Handle client disconnect
  req.on('close', () => {
    console.log('SSE connection closed');
  });
});

// Message endpoint for SSE
app.post('/message', async (req, res) => {
  // This endpoint is handled by the SSE transport
  res.status(200).end();
});

// Start server
app.listen(PORT, HOST, () => {
  console.log(`ConsignCloud MCP Server running on http://${HOST}:${PORT}`);
  console.log(`SSE endpoint: http://${HOST}:${PORT}/sse`);
  console.log(`Health check: http://${HOST}:${PORT}/health`);
});
