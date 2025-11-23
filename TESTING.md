# Testing with MCP Inspector

This guide shows you how to test the ConsignCloud MCP server using the MCP Inspector tool.

## What is MCP Inspector?

MCP Inspector is an interactive debugging and testing tool for MCP servers. It provides a web interface to:
- View available tools
- Execute tools with custom parameters
- See request/response data
- Debug issues in real-time

## Prerequisites

1. **Node.js** installed (v18 or later)
2. **ConsignCloud API Key** (see main README for setup)
3. **MCP Inspector** - Install globally:
   ```bash
   npm install -g @modelcontextprotocol/inspector
   ```

## Testing Methods

### Method 1: Testing HTTP/SSE Server (Recommended)

This is the easiest way to test with MCP Inspector.

#### Step 1: Start the HTTP Server

```bash
# Make sure your .env file is configured
npm run dev:http
```

You should see:
```
ConsignCloud MCP Server running on http://localhost:3000
SSE endpoint: http://localhost:3000/sse
Health check: http://localhost:3000/health
```

#### Step 2: Launch MCP Inspector

In a new terminal:
```bash
npx @modelcontextprotocol/inspector http://localhost:3000/sse
```

This will:
- Start the MCP Inspector web interface
- Connect to your running server via SSE
- Open your browser automatically (usually http://localhost:5173)

#### Step 3: Test Your Server

In the MCP Inspector web interface:

1. **View Tools** - You'll see all 22 tools listed in the left sidebar:
   - list_items
   - get_item
   - create_item
   - update_item
   - And 18 more...

2. **Execute a Tool** - Click on a tool to see its parameters and test it:
   ```json
   // Example: list_items
   {
     "limit": 10,
     "tag_price_gte": 1000
   }
   ```

3. **View Responses** - See the API response in real-time

### Method 2: Testing STDIO Server

If you need to test the stdio version (used by Claude Desktop):

#### Step 1: Create Inspector Configuration

Create a file `inspector-config.json`:
```json
{
  "command": "npx",
  "args": ["-y", "tsx", "src/index.ts"],
  "env": {
    "CONSIGNCLOUD_API_KEY": "your_api_key_here"
  }
}
```

#### Step 2: Launch Inspector with STDIO

```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

Or in development mode:
```bash
npx @modelcontextprotocol/inspector tsx src/index.ts
```

## Example Test Scenarios

### 1. List Inventory Items

**Tool:** `list_items`

**Parameters:**
```json
{
  "limit": 5
}
```

**Expected Response:**
```json
{
  "data": [
    {
      "id": "uuid-here",
      "title": "Item Name",
      "tag_price": 2999,
      "status": "available",
      ...
    }
  ],
  "next_cursor": "cursor-token-or-null"
}
```

### 2. Search for Items by Price

**Tool:** `list_items`

**Parameters:**
```json
{
  "tag_price_gte": 1000,
  "tag_price_lte": 5000,
  "limit": 10
}
```

### 3. Get Account Statistics

**Tool:** `get_account_stats`

**Parameters:**
```json
{
  "id": "account-uuid-here"
}
```

### 4. Search Across Entities

**Tool:** `search_suggest`

**Parameters:**
```json
{
  "query": "john",
  "types": ["account", "item"]
}
```

### 5. Get Sales Trends

**Tool:** `get_sales_trends`

**Parameters:**
```json
{
  "start_date": "2025-01-01T00:00:00Z",
  "end_date": "2025-01-31T23:59:59Z",
  "interval": "day"
}
```

## Health Check

Before testing, verify the server is healthy:

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "service": "consigncloud-mcp-server"
}
```

## Common Issues

### Issue: "CONSIGNCLOUD_API_KEY is required"

**Solution:** Make sure your `.env` file exists and contains your API key:
```bash
cp .env.example .env
# Edit .env and add your API key
```

### Issue: "Connection refused"

**Solution:** Make sure the HTTP server is running:
```bash
npm run dev:http
```

### Issue: "API Error (401): Invalid API key"

**Solution:**
1. Verify your API key in `.env` is correct
2. Check that the API key is still active in ConsignCloud Settings
3. Ensure the "API & Webhooks" app is enabled

### Issue: "API Error (429): Too many requests"

**Solution:** You've hit the rate limit (100 requests per bucket, 10/sec refill rate). Wait a few seconds and try again.

### Issue: Inspector won't connect

**Solution:**
1. Verify server is running: `curl http://localhost:3000/health`
2. Check the SSE endpoint URL is correct
3. Look for errors in the server console
4. Try restarting both server and inspector

## Advanced Testing

### Testing with curl

You can also test the SSE endpoint directly:

```bash
# Test SSE connection
curl -N http://localhost:3000/sse
```

### Testing Error Handling

Try invalid parameters to test error handling:

```json
// Invalid item ID format
{
  "id": "not-a-uuid"
}
```

### Testing Pagination

```json
{
  "limit": 5,
  "cursor": "cursor-from-previous-response"
}
```

## Inspector Features

### Request History
- View all previous requests
- Replay requests
- Copy request/response data

### Tool Schema Validation
- Inspector validates parameters against tool schemas
- Shows required vs optional fields
- Provides type hints

### Real-time Debugging
- See requests as they happen
- View raw JSON-RPC messages
- Monitor connection status

## Production Testing

For production testing (after building):

```bash
# Build the project
npm run build

# Start HTTP server in production mode
npm run start:http

# In another terminal
npx @modelcontextprotocol/inspector http://localhost:3000/sse
```

## Quick Reference

| Command | Description |
|---------|-------------|
| `npm run dev:http` | Start HTTP/SSE server (dev) |
| `npm run start:http` | Start HTTP/SSE server (prod) |
| `npx @modelcontextprotocol/inspector http://localhost:3000/sse` | Launch inspector for HTTP |
| `curl http://localhost:3000/health` | Check server health |

## Next Steps

After testing with MCP Inspector:
1. Try integrating with Claude Desktop (see main README)
2. Build custom workflows using multiple tools
3. Test error handling and edge cases
4. Monitor API rate limits

## Resources

- [MCP Inspector Documentation](https://modelcontextprotocol.io/docs/tools/inspector)
- [ConsignCloud API Docs](./CONSIGNCLOUD_API_SUMMARY.md)
- [MCP Protocol Specification](https://spec.modelcontextprotocol.io/)
