# Quick Start Guide

Get up and running with ConsignCloud MCP server in 5 minutes.

## Prerequisites

- Node.js 18+ installed
- ConsignCloud account with API access

## Setup in 4 Steps

### 1. Install

```bash
git clone <your-repo-url>
cd mcp-consigncloud
npm install
```

### 2. Configure API Key

```bash
cp .env.example .env
```

Edit `.env` and add your ConsignCloud API key:
```env
CONSIGNCLOUD_API_KEY=your_api_key_here
```

**Get your API key:** ConsignCloud → Settings → Apps → API & Webhooks → Add API Key

### 3. Build

```bash
npm run build
```

### 4. Test

**Option A: Test with MCP Inspector (Recommended First)**

```bash
# Terminal 1
npm run dev:http

# Terminal 2
npx @modelcontextprotocol/inspector http://localhost:3000/sse
```

Browser opens automatically at http://localhost:5173

**Option B: Use with Claude Desktop**

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "consigncloud": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-consigncloud/dist/index.js"],
      "env": {
        "CONSIGNCLOUD_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

Restart Claude Desktop.

## Test It Works

### In MCP Inspector

Try the `list_items` tool with:
```json
{
  "limit": 5
}
```

### In Claude Desktop

Ask: **"List my inventory items"**

## What's Available

**22 Tools Across 6 Categories:**

| Category | Tools | Description |
|----------|-------|-------------|
| **Inventory** | 6 tools | Manage items, prices, stock |
| **Sales** | 4 tools | View sales, void, trends |
| **Accounts** | 5 tools | Vendors, balances, stats |
| **Categories** | 2 tools | Item categories |
| **Locations** | 1 tool | Store locations |
| **Batches** | 3 tools | Item batch management |
| **Search** | 1 tool | Cross-entity search |

## Common Commands

```bash
# Development mode (stdio)
npm run dev

# Development mode (HTTP/SSE)
npm run dev:http

# Build for production
npm run build

# Production mode (stdio)
npm start

# Production mode (HTTP/SSE)
npm run start:http
```

## Key URLs

- **Health Check:** http://localhost:3000/health
- **SSE Endpoint:** http://localhost:3000/sse
- **Inspector:** http://localhost:5173 (auto-opens)

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "API key required" | Add to `.env` file |
| "Connection refused" | Run `npm run dev:http` first |
| "401 Unauthorized" | Check API key is valid |
| "429 Too many requests" | Wait 10 seconds (rate limit) |
| Build fails | Run `npm install` again |
| Inspector won't open | Use `http://localhost:3000/sse` manually |

## Example Queries (Claude Desktop)

1. "Show me inventory items under $50"
2. "List sales from this week"
3. "Create a vendor account for Jane Doe"
4. "What are my top-selling categories?"
5. "Show me items that haven't sold"

## Next Steps

- 📖 Read [TESTING.md](./TESTING.md) for detailed testing guide
- 🖥️ Read [CLAUDE_DESKTOP_SETUP.md](./CLAUDE_DESKTOP_SETUP.md) for Claude integration
- 📚 Read [CONSIGNCLOUD_API_SUMMARY.md](./CONSIGNCLOUD_API_SUMMARY.md) for API details
- 📘 Read [README.md](./README.md) for full documentation

## Support

- ConsignCloud API: team@consigncloud.com
- MCP Inspector: [MCP Docs](https://modelcontextprotocol.io/docs/tools/inspector)

---

**Ready to go!** Start with MCP Inspector to test, then integrate with Claude Desktop for AI-powered inventory management.
