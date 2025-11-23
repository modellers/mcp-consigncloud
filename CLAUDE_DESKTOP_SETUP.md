# Claude Desktop Setup Guide

This guide explains how to configure the ConsignCloud MCP server with Claude Desktop for seamless AI-powered inventory management.

## Quick Setup

### Step 1: Get Your API Key

1. Log in to [ConsignCloud](https://consigncloud.com)
2. Go to **Settings → Apps**
3. Enable **API & Webhooks** app
4. Click **Add API Key**
5. Copy the generated API key

### Step 2: Build the Server

```bash
cd /path/to/mcp-consigncloud
npm install
npm run build
```

### Step 3: Configure Claude Desktop

Open your Claude Desktop configuration file:

**macOS:**
```bash
open ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

**Windows:**
```bash
notepad %APPDATA%\Claude\claude_desktop_config.json
```

Add this configuration (replace the paths and API key):

```json
{
  "mcpServers": {
    "consigncloud": {
      "command": "node",
      "args": [
        "/absolute/path/to/mcp-consigncloud/dist/index.js"
      ],
      "env": {
        "CONSIGNCLOUD_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

**Important:** Use absolute paths, not relative paths like `~/` or `./`

### Step 4: Restart Claude Desktop

Close and reopen Claude Desktop completely.

### Step 5: Verify Connection

In Claude Desktop, you should now see:
- A 🔌 (plug) icon indicating MCP servers are connected
- "consigncloud" listed in the available tools

## Example Configuration (macOS)

```json
{
  "mcpServers": {
    "consigncloud": {
      "command": "node",
      "args": [
        "/Users/yourname/projects/mcp-consigncloud/dist/index.js"
      ],
      "env": {
        "CONSIGNCLOUD_API_KEY": "cc_sk_1234567890abcdef"
      }
    }
  }
}
```

## Example Configuration (Windows)

```json
{
  "mcpServers": {
    "consigncloud": {
      "command": "node",
      "args": [
        "C:\\Users\\YourName\\projects\\mcp-consigncloud\\dist\\index.js"
      ],
      "env": {
        "CONSIGNCLOUD_API_KEY": "cc_sk_1234567890abcdef"
      }
    }
  }
}
```

## Development Mode

For development with hot reload (not recommended for production use):

```json
{
  "mcpServers": {
    "consigncloud": {
      "command": "npx",
      "args": [
        "-y",
        "tsx",
        "/absolute/path/to/mcp-consigncloud/src/index.ts"
      ],
      "env": {
        "CONSIGNCLOUD_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

## What You Can Do

Once configured, you can ask Claude to:

### Inventory Management
- "Show me all inventory items under $50"
- "List items in the 'Clothing' category"
- "Create a new item: Vintage Lamp, price $75"
- "Update item XYZ with a new price of $120"
- "What are my current inventory statistics?"

### Sales Operations
- "Show me sales from last week"
- "Get details of sale ABC123"
- "Void sale XYZ789"
- "What are the sales trends for this month?"

### Account Management
- "List all vendor accounts"
- "Create a new vendor account for John Smith"
- "Show me the balance for account 000123"
- "Get statistics for vendor ABC"

### Search & Discovery
- "Search for items matching 'vintage'"
- "Find accounts with 'John' in the name"
- "Show me items from vendor XYZ"

### Batch Operations
- "List all item batches"
- "Create a new batch for vendor ABC"
- "Show me draft batches"

## Troubleshooting

### "Server not found" or No Connection

**Check:**
1. ✅ Path to `index.js` is absolute (starts with `/` on Mac/Linux or `C:\` on Windows)
2. ✅ File exists: `ls /path/to/mcp-consigncloud/dist/index.js`
3. ✅ Node.js is installed: `node --version`
4. ✅ Project is built: `npm run build`

**Fix:**
```bash
cd /path/to/mcp-consigncloud
npm run build
# Verify dist/index.js exists
ls dist/index.js
```

### "API Key Invalid"

**Check:**
1. ✅ API key is correct in config
2. ✅ API key hasn't been revoked in ConsignCloud
3. ✅ "API & Webhooks" app is enabled

**Fix:** Generate a new API key in ConsignCloud and update config

### "Permission Denied"

**On macOS/Linux:**
```bash
chmod +x /path/to/mcp-consigncloud/dist/index.js
```

### Server Starts But No Tools Appear

**Check Claude Desktop logs:**

**macOS:**
```bash
tail -f ~/Library/Logs/Claude/mcp*.log
```

**Windows:**
```bash
type %APPDATA%\Claude\logs\mcp*.log
```

### Rate Limit Errors

ConsignCloud API has rate limits:
- 100 requests bucket capacity
- 10 requests/second refill rate

**Solution:** Wait a few seconds between requests

## Multiple MCP Servers

You can run multiple MCP servers alongside ConsignCloud:

```json
{
  "mcpServers": {
    "consigncloud": {
      "command": "node",
      "args": ["/path/to/mcp-consigncloud/dist/index.js"],
      "env": {
        "CONSIGNCLOUD_API_KEY": "your_key"
      }
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/workspace"]
    }
  }
}
```

## Best Practices

### Security
- ✅ Never commit API keys to version control
- ✅ Use environment variables for sensitive data
- ✅ Regularly rotate API keys
- ✅ Monitor API usage in ConsignCloud dashboard

### Performance
- ✅ Use built version (`dist/index.js`) not dev mode for daily use
- ✅ Be mindful of rate limits
- ✅ Use pagination for large datasets

### Updates
When you update the server code:
```bash
cd /path/to/mcp-consigncloud
git pull  # if using git
npm install  # update dependencies
npm run build  # rebuild
# Restart Claude Desktop
```

## Example Prompts

Try these prompts in Claude Desktop once configured:

1. **"List my top 10 most expensive inventory items"**
2. **"Show me all items that haven't sold in the last 30 days"**
3. **"Create a report of sales for vendor ABC this month"**
4. **"What's the total value of my current inventory?"**
5. **"Find all items priced between $20 and $50"**
6. **"Show me account balances for all vendors"**

## Advanced Configuration

### Custom Base URL (for testing)

```json
{
  "mcpServers": {
    "consigncloud": {
      "command": "node",
      "args": ["/path/to/dist/index.js"],
      "env": {
        "CONSIGNCLOUD_API_KEY": "your_key",
        "CONSIGNCLOUD_API_BASE_URL": "https://staging-api.consigncloud.com/api/v1"
      }
    }
  }
}
```

### Enable Debug Logging

Add to your config:
```json
{
  "mcpServers": {
    "consigncloud": {
      "command": "node",
      "args": ["/path/to/dist/index.js"],
      "env": {
        "CONSIGNCLOUD_API_KEY": "your_key",
        "DEBUG": "true"
      }
    }
  }
}
```

## Getting Help

- **ConsignCloud API Issues:** team@consigncloud.com
- **MCP Server Issues:** Check GitHub issues
- **Claude Desktop Help:** [Claude Help Center](https://support.anthropic.com)

## Resources

- [Main README](./README.md) - Full documentation
- [Testing Guide](./TESTING.md) - Test with MCP Inspector
- [API Reference](./CONSIGNCLOUD_API_SUMMARY.md) - API details
- [MCP Documentation](https://modelcontextprotocol.io/)
