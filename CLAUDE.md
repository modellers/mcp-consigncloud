# ConsignCloud MCP Server - AI Assistant Summary

This document provides a comprehensive overview for AI assistants (like Claude) working with the ConsignCloud MCP Server codebase.

## Project Overview

**Type:** Model Context Protocol (MCP) Server
**Purpose:** Enable AI assistants to manage ConsignCloud inventory, sales, and accounts
**Language:** TypeScript
**Runtime:** Node.js
**Location:** `/Users/administrators/Documents/Workspace/github/mcp-consigncloud`

## Architecture

### Core Components

1. **[src/index.ts](src/index.ts)** - STDIO mode server (for Claude Desktop)
   - Uses `StdioServerTransport` for communication
   - Reads env vars from `.env` file or process environment
   - Validates API key on startup

2. **[src/http-server.ts](src/http-server.ts)** - HTTP/SSE mode server (for MCP Inspector)
   - Uses `SSEServerTransport` with Express.js
   - Supports CLI arguments: `--api-key`, `--api-url`, `--port`, `--host`
   - Session-based transport management
   - Validates API connection on startup
   - Health check endpoint at `/health`

3. **[src/server.ts](src/server.ts)** - MCP server setup and tool definitions
   - Defines 23 tools for ConsignCloud API
   - Handles tool execution and error formatting
   - Shared by both stdio and HTTP modes

4. **[src/client.ts](src/client.ts)** - ConsignCloud API client
   - Axios-based HTTP client
   - Comprehensive error handling with detailed messages
   - Rate limiting support (100 req bucket, 10 req/sec refill)

5. **[src/types.ts](src/types.ts)** - TypeScript type definitions

## Recent Improvements (2025-12-04)

### HTTP/SSE Server Enhancements

✅ **CLI Argument Support**
- Override env vars: `node dist/http-server.js --api-key KEY --port 3001`
- Priority: CLI args > env vars > .env file

✅ **Enhanced Error Logging**
- HTTP status code explanations (401, 403, 404, 422, 429, 500+)
- Request context (method, URL)
- Validation error parsing
- Network error detection

✅ **Startup Validation**
- Tests API connection before accepting requests
- Calls `client.listLocations({ limit: 1 })` to verify credentials
- Clear error messages if validation fails

✅ **Session Management**
- Fixed SSE transport to use session-based routing
- `/message` endpoint routes by `sessionId` query parameter
- Removed `express.json()` middleware (was consuming request streams)

✅ **Security**
- API keys masked in logs (shows first 8 and last 4 chars)
- Configuration displayed on startup for transparency

## Usage Patterns

### Running with Full Paths

**STDIO mode with MCP Inspector:**
```bash
npx @modelcontextprotocol/inspector /opt/homebrew/bin/node /Users/administrators/Documents/Workspace/github/mcp-consigncloud/dist/index.js
```

**HTTP/SSE mode with absolute path:**
```bash
/opt/homebrew/bin/node /Users/administrators/Documents/Workspace/github/mcp-consigncloud/dist/http-server.js --api-key YOUR_KEY --port 3000
```

**HTTP/SSE with MCP Inspector:**
```bash
# Terminal 1
npm run start:http

# Terminal 2
npx @modelcontextprotocol/inspector http://localhost:3000/sse
```

### Environment Variables

**Priority order (HTTP mode only):**
1. CLI arguments (`--api-key`)
2. Environment variables (`CONSIGNCLOUD_API_KEY`)
3. `.env` file

**STDIO mode:**
- Only reads from environment variables and `.env` file
- No CLI argument support

**Required:**
- `CONSIGNCLOUD_API_KEY` - API key from ConsignCloud Settings → Apps → API & Webhooks

**Optional:**
- `CONSIGNCLOUD_API_BASE_URL` - Defaults to `https://api.consigncloud.com/api/v1`
- `PORT` - HTTP server port (default: 3000)
- `HOST` - HTTP server host (default: localhost)

## Available Tools (23 total)

### Inventory (6 tools)
- `list_items` - List with filters (price, category, account, status, location)
- `get_item` - Get by ID
- `create_item` - Create new item
- `update_item` - Update existing
- `delete_item` - Soft delete
- `get_item_stats` - Overall statistics

### Sales (4 tools)
- `list_sales` - List with filters
- `get_sale` - Get by ID
- `void_sale` - Void transaction
- `get_sales_trends` - Analytics

### Accounts (5 tools)
- `list_accounts` - List vendors/consignors
- `get_account` - Get by ID
- `create_account` - Create new
- `update_account` - Update existing
- `get_account_stats` - Account statistics

### Categories & Locations (3 tools)
- `list_categories` - List categories
- `create_category` - Create new
- `list_locations` - List store locations

### Batches (3 tools)
- `list_batches` - List batches
- `create_batch` - Create new
- `update_batch_status` - Update status

### Search (2 tools)
- `search_suggest` - Full-text search
- `suggest_field_values` - Auto-complete

## Error Handling

### Client-Side (src/client.ts)

Comprehensive error messages with:
- HTTP status code and meaning
- Request method and URL
- API error message
- Validation errors (parsed from response)
- Network error detection

**Examples:**
```
API Error 401 (GET /items): Authentication failed - Invalid API key
API Error 422 (POST /items): Validation error | Validation: title: required, price: must be positive
Network error: No response from https://api.consigncloud.com/api/v1 - Check your internet connection
```

### Server-Side

**Startup validation:**
- Tests API connection before starting
- Shows configuration (masked API key)
- Clear error messages with troubleshooting steps

**Runtime errors:**
- Caught by tool handler
- Returned as MCP error responses with `isError: true`

## Testing

### Quick Test
```bash
npm run build
curl http://localhost:3000/health  # Should return {"status":"ok","service":"consigncloud-mcp-server"}
```

### Full Test with Inspector
```bash
# Build
npm run build

# Start server
node dist/http-server.js

# In another terminal
npx @modelcontextprotocol/inspector http://localhost:3000/sse
```

Should list 23 tools and allow testing each one.

## Common Issues & Solutions

### "stream is not readable" error
**Cause:** `express.json()` middleware consuming request body
**Solution:** Removed in latest version (2025-12-04)

### "Session not found" error
**Cause:** Session-based routing not implemented
**Solution:** Added session Map and routing by `sessionId` query param

### API validation fails on startup
**Cause:** Invalid API key or network issues
**Solution:** Check `.env` file, verify API key in ConsignCloud dashboard

### SSE connection closes immediately
**Cause:** Response stream closed before messages sent
**Solution:** Session-based transport keeps connection alive

## Development Workflow

### Making Changes

1. Edit TypeScript files in `src/`
2. Build: `npm run build`
3. Test with inspector or stdio mode
4. Check error logs for issues

### Adding New Tools

1. Add tool definition in `createTools()` in [src/server.ts](src/server.ts)
2. Add client method in [src/client.ts](src/client.ts) if needed
3. Add case in switch statement in [src/server.ts](src/server.ts) tool handler
4. Update types in [src/types.ts](src/types.ts) if needed
5. Build and test

### Debugging

**HTTP mode:**
- Check console output (shows masked API key, validation results)
- Hit `/health` endpoint to verify server is running
- Check session logs for SSE connections

**STDIO mode:**
- Errors go to stderr
- Claude Desktop logs: `~/Library/Logs/Claude/mcp*.log` (macOS)

## File Checklist

**Never commit:**
- `.env` - Contains API keys
- `node_modules/` - Dependencies
- `dist/` - Generated code

**Always commit:**
- `src/` - Source code
- `package.json` - Dependencies
- `tsconfig.json` - TypeScript config
- `README.md` - Documentation
- `.env.example` - Template

## Quick Reference

**Project location:** `/Users/administrators/Documents/Workspace/github/mcp-consigncloud`

**Start HTTP server:**
```bash
node dist/http-server.js
# or with flags
node dist/http-server.js --api-key KEY --port 3001
```

**Test with inspector (stdio):**
```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

**Test with inspector (HTTP):**
```bash
npx @modelcontextprotocol/inspector http://localhost:3000/sse
```

**Build:**
```bash
npm run build
```

**Currency format:**
All prices in cents (1000 = $10.00)

**Rate limits:**
100 request bucket, 10/sec refill
