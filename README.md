# ConsignCloud MCP Server

A Model Context Protocol (MCP) server for the ConsignCloud API, enabling AI assistants to manage inventory, sales, accounts, and more in your consignment/retail business.

> **🚀 Quick Start:** New to this project? See [QUICK_START.md](./QUICK_START.md) to get running in 5 minutes!

## 📚 Documentation

- **[QUICK_START.md](./QUICK_START.md)** - Get up and running in 5 minutes
- **[TESTING.md](./TESTING.md)** - Test with MCP Inspector
- **[CLAUDE_DESKTOP_SETUP.md](./CLAUDE_DESKTOP_SETUP.md)** - Integrate with Claude Desktop
- **[CONSIGNCLOUD_API_SUMMARY.md](./CONSIGNCLOUD_API_SUMMARY.md)** - Complete API reference
- **[PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)** - Technical overview

## Features

This MCP server provides tools for:

### Inventory Management
- List, create, update, and delete items
- Filter items by price, category, account, status, location
- Get inventory statistics
- Bulk edit items
- Update item statuses

### Sales Management
- List and view sales
- Void and refund sales
- Filter sales by date, customer, location, status
- Get sales trends and analytics

### Account Management
- Manage vendor/consignor accounts
- View account balances and statistics
- Track purchases and items per account

### Additional Features
- Manage item categories
- Manage store locations
- Create and manage batches of items
- Search and suggestions across entities

## Installation

1. Clone this repository:
```bash
git clone <repository-url>
cd mcp-consigncloud
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with your ConsignCloud API credentials:
```bash
cp .env.example .env
```

4. Edit `.env` and add your API key:
```env
CONSIGNCLOUD_API_KEY=your_api_key_here
CONSIGNCLOUD_API_BASE_URL=https://api.consigncloud.com/api/v1
```

## Getting Your API Key

1. Log in to your ConsignCloud account
2. Navigate to **Settings → Apps**
3. Enable the **API & Webhooks** app
4. Click **Add API Key**
5. Copy the generated API key to your `.env` file

## Usage

The server supports two modes:

### 1. STDIO Mode (for Claude Desktop)

This is the default mode for integration with Claude Desktop and other MCP clients.

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm run build
npm start
```

### 2. HTTP/SSE Mode (for testing with MCP Inspector)

This mode runs an HTTP server with Server-Sent Events for easy testing.

**Development:**
```bash
npm run dev:http
```

**Production:**
```bash
npm run build
npm run start:http
```

**With custom configuration (CLI flags override environment variables):**
```bash
node dist/http-server.js --api-key YOUR_KEY --port 3001 --host localhost
```

**With absolute path:**
```bash
/opt/homebrew/bin/node /absolute/path/to/dist/http-server.js --api-key YOUR_KEY
```

The server will run on `http://localhost:3000` (configurable via `.env` or CLI flags).

### Testing with MCP Inspector

See [TESTING.md](./TESTING.md) for detailed instructions on testing with MCP Inspector.

Quick start:
```bash
# Option 1: HTTP/SSE mode
# Terminal 1: Start the HTTP server
npm run start:http

# Terminal 2: Launch MCP Inspector
npx @modelcontextprotocol/inspector http://localhost:3000/sse

# Option 2: stdio mode (uses .env file)
npx @modelcontextprotocol/inspector node /absolute/path/to/dist/index.js

# Option 3: stdio mode with environment variable
CONSIGNCLOUD_API_KEY=your_key npx @modelcontextprotocol/inspector node dist/index.js
```

### Using with Claude Desktop

Add this to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

**Recommended: Using .env file**
```json
{
  "mcpServers": {
    "consigncloud": {
      "command": "node",
      "args": ["/Users/administrators/Documents/Workspace/github/mcp-consigncloud/dist/index.js"]
    }
  }
}
```

**Alternative: Inline environment variables**
```json
{
  "mcpServers": {
    "consigncloud": {
      "command": "node",
      "args": ["/Users/administrators/Documents/Workspace/github/mcp-consigncloud/dist/index.js"],
      "env": {
        "CONSIGNCLOUD_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

See [CLAUDE_DESKTOP_SETUP.md](./CLAUDE_DESKTOP_SETUP.md) for detailed setup instructions.

## Available Tools

### Inventory Tools

- `list_items` - List inventory items with filters
- `get_item` - Get specific item details
- `create_item` - Create new inventory item
- `update_item` - Update existing item
- `delete_item` - Delete (soft delete) an item
- `get_item_stats` - Get inventory statistics

### Sales Tools

- `list_sales` - List sales with filters
- `get_sale` - Get specific sale details
- `void_sale` - Void a sale
- `get_sales_trends` - Get sales analytics

### Account Tools

- `list_accounts` - List vendor/consignor accounts
- `get_account` - Get specific account details
- `create_account` - Create new account
- `update_account` - Update existing account
- `get_account_stats` - Get account statistics

### Category & Location Tools

- `list_categories` - List item categories
- `create_category` - Create new category
- `list_locations` - List store locations

### Batch Tools

- `list_batches` - List item batches
- `create_batch` - Create new batch
- `update_batch_status` - Change batch status

### Utility Tools

- `search_suggest` - Search across entities

## Example Prompts

Once configured with Claude Desktop, you can use prompts like:

- "List all inventory items under $50"
- "Show me sales from last week"
- "Create a new vendor account for John Doe"
- "What are the top selling items?"
- "Show me the current balance for account ABC123"
- "Create a new batch for vendor XYZ"

## API Documentation

For detailed API documentation, see [CONSIGNCLOUD_API_SUMMARY.md](./CONSIGNCLOUD_API_SUMMARY.md)

## Currency Format

All monetary amounts are in the smallest denomination (cents for USD):
- $10.00 = 1000 cents
- $0.50 = 50 cents

## Rate Limiting

The ConsignCloud API uses a leaky bucket algorithm:
- Bucket capacity: 100 requests
- Leak rate: 10 requests/second
- Exceeding limit returns 429 status

## Development

### Project Structure

```
mcp-consigncloud/
├── src/
│   ├── index.ts        # MCP server implementation
│   ├── client.ts       # ConsignCloud API client
│   └── types.ts        # TypeScript type definitions
├── dist/               # Compiled JavaScript (generated)
├── .env.example        # Environment variable template
├── package.json
├── tsconfig.json
└── README.md
```

### Building

```bash
npm run build
```

### Watch Mode

```bash
npm run watch
```

## Troubleshooting

### API Key Issues

If you get authentication errors:
1. Verify your API key is correct in `.env`
2. Check that the API key hasn't been revoked in ConsignCloud
3. Ensure the API & Webhooks app is enabled in your ConsignCloud settings

### Connection Issues

If the server won't start:
1. Check your `.env` file exists and contains valid values
2. Verify network connectivity to `api.consigncloud.com`
3. The HTTP server validates API connection on startup and shows clear error messages

### HTTP/SSE Server Features

The HTTP server includes:
- ✅ **Startup validation** - Tests API connection before accepting requests
- ✅ **CLI arguments** - Override env vars with `--api-key`, `--port`, `--host`
- ✅ **Detailed errors** - Comprehensive error messages with HTTP status codes
- ✅ **Session management** - Proper SSE session handling
- ✅ **Health endpoint** - `/health` for monitoring
- ✅ **Masked logging** - API keys are partially hidden in logs

## License

ISC

## Support

For ConsignCloud API issues, contact: team@consigncloud.com
For MCP server issues, please open a GitHub issue.
