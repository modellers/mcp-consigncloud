import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { ConsignCloudClient } from './client.js';

export function createTools(): Tool[] {
  return [
    {
      name: 'list_items',
      description: 'List inventory items with optional filters. Supports filtering by price, category, account, status, location, and more.',
      inputSchema: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Number of results to return (default: 1000) pagination is we need more' },
          cursor: { type: 'string', description: 'Pagination cursor' },
          status: { type: 'string', description: 'Filter by status' },
          category: { type: 'string', description: 'Filter by category ID' },
          account: { type: 'string', description: 'Filter by account ID' },
          location: { type: 'string', description: 'Filter by location ID' },
          tag_price_gte: { type: 'number', description: 'Filter items with price >= this value (in cents)' },
          tag_price_lte: { type: 'number', description: 'Filter items with price <= this value (in cents)' },
        },
      },
    },
    {
      name: 'get_item',
      description: 'Get details of a specific inventory item by ID',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Item ID (UUID)' },
        },
        required: ['id'],
      },
    },
    {
      name: 'create_item',
      description: 'Create a new inventory item',
      inputSchema: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Item title' },
          description: { type: 'string', description: 'Item description' },
          tag_price: { type: 'number', description: 'Price in cents' },
          category: { type: 'string', description: 'Category ID' },
          account: { type: 'string', description: 'Account ID (vendor/consignor)' },
          inventory_type: {
            type: 'string',
            enum: ['consignment', 'buy_outright', 'retail'],
            description: 'Type of inventory'
          },
          split: { type: 'number', description: 'Split percentage (0-1)' },
          quantity: { type: 'number', description: 'Quantity' },
          location: { type: 'string', description: 'Location ID' },
        },
        required: ['title', 'tag_price'],
      },
    },
    {
      name: 'update_item',
      description: 'Update an existing inventory item',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Item ID' },
          title: { type: 'string' },
          description: { type: 'string' },
          tag_price: { type: 'number', description: 'Price in cents' },
          category: { type: 'string' },
          split: { type: 'number', description: 'Split percentage (0-1)' },
          quantity: { type: 'number' },
        },
        required: ['id'],
      },
    },
    {
      name: 'delete_item',
      description: 'Delete (soft delete) an inventory item',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Item ID' },
        },
        required: ['id'],
      },
    },
    {
      name: 'get_item_stats',
      description: 'Get overall inventory statistics',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'list_sales',
      description: 'List sales with optional filters',
      inputSchema: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Number of results (default: 1000)' },
          cursor: { type: 'string', description: 'Pagination cursor' },
          status: { type: 'string', description: 'Filter by status (completed, voided, returned)' },
          customer: { type: 'string', description: 'Filter by customer account ID' },
          location: { type: 'string', description: 'Filter by location ID' },
          created_gte: { type: 'string', description: 'Filter sales created after this date (ISO 8601)' },
          created_lte: { type: 'string', description: 'Filter sales created before this date (ISO 8601)' },
        },
      },
    },
    {
      name: 'get_sale',
      description: 'Get details of a specific sale',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Sale ID' },
        },
        required: ['id'],
      },
    },
    {
      name: 'void_sale',
      description: 'Void a sale',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Sale ID' },
        },
        required: ['id'],
      },
    },
    {
      name: 'list_accounts',
      description: 'List vendor/consignor accounts with optional filters',
      inputSchema: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Number of results (default: 1000)' },
          cursor: { type: 'string' },
          is_vendor: { type: 'boolean', description: 'Filter by vendor status' },
        },
      },
    },
    {
      name: 'get_account',
      description: 'Get details of a specific account',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Account ID' },
        },
        required: ['id'],
      },
    },
    {
      name: 'create_account',
      description: 'Create a new vendor/consignor account',
      inputSchema: {
        type: 'object',
        properties: {
          first_name: { type: 'string' },
          last_name: { type: 'string' },
          company: { type: 'string' },
          email: { type: 'string' },
          phone_number: { type: 'string' },
          default_split: { type: 'number', description: 'Default split (0-1)' },
          default_inventory_type: {
            type: 'string',
            enum: ['consignment', 'buy_outright', 'retail']
          },
        },
      },
    },
    {
      name: 'update_account',
      description: 'Update an existing account',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          first_name: { type: 'string' },
          last_name: { type: 'string' },
          company: { type: 'string' },
          email: { type: 'string' },
          phone_number: { type: 'string' },
        },
        required: ['id'],
      },
    },
    {
      name: 'get_account_stats',
      description: 'Get statistics for a specific account (balance, items, sales)',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Account ID' },
        },
        required: ['id'],
      },
    },
    {
      name: 'list_categories',
      description: 'List item categories',
      inputSchema: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Number of results (default: 1000)' },
          cursor: { type: 'string' },
        },
      },
    },
    {
      name: 'create_category',
      description: 'Create a new item category',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Category name' },
        },
        required: ['name'],
      },
    },
    {
      name: 'list_locations',
      description: 'List store locations',
      inputSchema: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Number of results (default: 1000)' },
          cursor: { type: 'string' },
        },
      },
    },
    {
      name: 'search_suggest',
      description: 'Search across accounts and items using full-text search. Returns matching entities with their full details.',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query (searches titles, descriptions, names, emails, SKUs, etc.)' },
          types: {
            type: 'array',
            items: { type: 'string', enum: ['items', 'accounts'] },
            description: 'Entity types to search. Options: "items", "accounts". Leave empty to search both.'
          },
        },
        required: ['query'],
      },
    },
    {
      name: 'suggest_field_values',
      description: 'Get auto-complete suggestions for a specific field (brand, color, size, tags, etc.) based on existing data.',
      inputSchema: {
        type: 'object',
        properties: {
          entity: {
            type: 'string',
            enum: ['items', 'accounts'],
            description: 'Entity type: items or accounts'
          },
          field: {
            type: 'string',
            description: 'Field name: For items: brand, color, size, description, tags, or custom field slug. For accounts: tags'
          },
          value: {
            type: 'string',
            description: 'Partial value to match (e.g., "vin" to find "Vintage Heritage")'
          }
        },
        required: ['entity', 'field', 'value'],
      },
    },
    {
      name: 'get_sales_trends',
      description: 'Get sales trends and analytics',
      inputSchema: {
        type: 'object',
        properties: {
          start_date: { type: 'string', description: 'Start date (ISO 8601)' },
          end_date: { type: 'string', description: 'End date (ISO 8601)' },
          interval: { type: 'string', description: 'Interval (day, week, month)' },
        },
      },
    },
    {
      name: 'list_batches',
      description: 'List batches of items',
      inputSchema: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Number of results (default: 1000)' },
          cursor: { type: 'string' },
          status: { type: 'string', enum: ['draft', 'submitted'] },
          account: { type: 'string', description: 'Filter by account ID' },
        },
      },
    },
    {
      name: 'create_batch',
      description: 'Create a new batch of items',
      inputSchema: {
        type: 'object',
        properties: {
          description: { type: 'string' },
          account: { type: 'string', description: 'Account ID' },
        },
      },
    },
    {
      name: 'update_batch_status',
      description: 'Update batch status (draft or submitted)',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Batch ID' },
          status: { type: 'string', enum: ['draft', 'submitted'] },
        },
        required: ['id', 'status'],
      },
    },
    {
      name: 'calculate_inventory_value',
      description: 'Calculate total inventory value with comprehensive filtering and grouping. Returns total value, item count, average value, and optional breakdown by category, location, account, inventory type, or status.',
      inputSchema: {
        type: 'object',
        properties: {
          status: { type: 'string', description: 'Filter by status (available, sold, processing, removed)' },
          category: { type: 'string', description: 'Filter by category ID' },
          account: { type: 'string', description: 'Filter by account ID' },
          location: { type: 'string', description: 'Filter by location ID' },
          inventory_type: {
            type: 'string',
            enum: ['consignment', 'buy_outright', 'retail'],
            description: 'Filter by inventory type'
          },
          tag_price_gte: { type: 'number', description: 'Filter items with price >= this value (in cents)' },
          tag_price_lte: { type: 'number', description: 'Filter items with price <= this value (in cents)' },
          group_by: {
            type: 'string',
            enum: ['category', 'location', 'account', 'inventory_type', 'status'],
            description: 'Group results by field for detailed breakdown'
          },
        },
      },
    },
    {
      name: 'calculate_sales_totals',
      description: 'Calculate sales totals with filtering by date range, status, location, and customer. Returns total revenue, tax, sale count, average sale value, and optional breakdown by status, location, or date period.',
      inputSchema: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['completed', 'voided', 'returned'], description: 'Filter by sale status' },
          location: { type: 'string', description: 'Filter by location ID' },
          customer: { type: 'string', description: 'Filter by customer account ID' },
          created_gte: { type: 'string', description: 'Filter sales created on or after this date (ISO 8601: YYYY-MM-DD)' },
          created_lte: { type: 'string', description: 'Filter sales created on or before this date (ISO 8601: YYYY-MM-DD)' },
          group_by: {
            type: 'string',
            enum: ['status', 'location', 'date'],
            description: 'Group results by field for detailed breakdown'
          },
          date_interval: {
            type: 'string',
            enum: ['day', 'week', 'month'],
            description: 'When group_by=date, aggregate by this interval (day, week, or month)'
          },
        },
      },
    },
    {
      name: 'calculate_account_metrics',
      description: 'Calculate comprehensive metrics for a specific vendor/consignor account including current balance, inventory value, items available/sold, total sales revenue, and commission owed.',
      inputSchema: {
        type: 'object',
        properties: {
          account_id: { type: 'string', description: 'Account ID (required)' },
          created_gte: { type: 'string', description: 'Filter by items/sales created on or after this date (ISO 8601)' },
          created_lte: { type: 'string', description: 'Filter by items/sales created on or before this date (ISO 8601)' },
          inventory_type: {
            type: 'string',
            enum: ['consignment', 'buy_outright', 'retail'],
            description: 'Filter by inventory type'
          },
        },
        required: ['account_id'],
      },
    },
  ];
}

export function setupServer(client: ConsignCloudClient): Server {
  const server = new Server(
    {
      name: 'consigncloud-mcp-server',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  const tools = createTools();

  // Handle list tools request
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools,
  }));

  // Handle tool execution
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
      const { name, arguments: args } = request.params;

      switch (name) {
        case 'list_items':
          const itemsParams = { limit: 100, ...(args as any) };
          return { content: [{ type: 'text', text: JSON.stringify(await client.listItems(itemsParams), null, 2) }] };

        case 'get_item':
          return { content: [{ type: 'text', text: JSON.stringify(await client.getItem((args as any).id), null, 2) }] };

        case 'create_item':
          return { content: [{ type: 'text', text: JSON.stringify(await client.createItem(args as any), null, 2) }] };

        case 'update_item':
          const { id: itemId, ...itemData } = args as any;
          return { content: [{ type: 'text', text: JSON.stringify(await client.updateItem(itemId, itemData), null, 2) }] };

        case 'delete_item':
          await client.deleteItem((args as any).id);
          return { content: [{ type: 'text', text: 'Item deleted successfully' }] };

        case 'get_item_stats':
          return { content: [{ type: 'text', text: JSON.stringify(await client.getItemStats(), null, 2) }] };

        case 'list_sales':
          const salesParams = { limit: 100, ...(args as any) };
          return { content: [{ type: 'text', text: JSON.stringify(await client.listSales(salesParams), null, 2) }] };

        case 'get_sale':
          return { content: [{ type: 'text', text: JSON.stringify(await client.getSale((args as any).id), null, 2) }] };

        case 'void_sale':
          return { content: [{ type: 'text', text: JSON.stringify(await client.voidSale((args as any).id), null, 2) }] };

        case 'list_accounts':
          const accountsParams = { limit: 100, ...(args as any) };
          return { content: [{ type: 'text', text: JSON.stringify(await client.listAccounts(accountsParams), null, 2) }] };

        case 'get_account':
          return { content: [{ type: 'text', text: JSON.stringify(await client.getAccount((args as any).id), null, 2) }] };

        case 'create_account':
          return { content: [{ type: 'text', text: JSON.stringify(await client.createAccount(args as any), null, 2) }] };

        case 'update_account':
          const { id: accountId, ...accountData } = args as any;
          return { content: [{ type: 'text', text: JSON.stringify(await client.updateAccount(accountId, accountData), null, 2) }] };

        case 'get_account_stats':
          return { content: [{ type: 'text', text: JSON.stringify(await client.getAccountStats((args as any).id), null, 2) }] };

        case 'list_categories':
          const categoriesParams = { limit: 100, ...(args as any) };
          return { content: [{ type: 'text', text: JSON.stringify(await client.listCategories(categoriesParams), null, 2) }] };

        case 'create_category':
          return { content: [{ type: 'text', text: JSON.stringify(await client.createCategory(args as any), null, 2) }] };

        case 'list_locations':
          const locationsParams = { limit: 100, ...(args as any) };
          return { content: [{ type: 'text', text: JSON.stringify(await client.listLocations(locationsParams), null, 2) }] };

        case 'search_suggest':
          const { query, types } = args as any;
          return { content: [{ type: 'text', text: JSON.stringify(await client.search(query, types), null, 2) }] };

        case 'suggest_field_values':
          const { entity, field, value } = args as any;
          return { content: [{ type: 'text', text: JSON.stringify(await client.suggestFieldValues(entity, field, value), null, 2) }] };

        case 'get_sales_trends':
          return { content: [{ type: 'text', text: JSON.stringify(await client.getSalesTrends(args as any), null, 2) }] };

        case 'list_batches':
          const batchesParams = { limit: 100, ...(args as any) };
          return { content: [{ type: 'text', text: JSON.stringify(await client.listBatches(batchesParams), null, 2) }] };

        case 'create_batch':
          return { content: [{ type: 'text', text: JSON.stringify(await client.createBatch(args as any), null, 2) }] };

        case 'update_batch_status':
          const { id: batchId, status } = args as any;
          return { content: [{ type: 'text', text: JSON.stringify(await client.updateBatchStatus(batchId, status), null, 2) }] };

        case 'calculate_inventory_value':
          return { content: [{ type: 'text', text: JSON.stringify(await client.calculateInventoryValue(args as any), null, 2) }] };

        case 'calculate_sales_totals':
          return { content: [{ type: 'text', text: JSON.stringify(await client.calculateSalesTotals(args as any), null, 2) }] };

        case 'calculate_account_metrics':
          return { content: [{ type: 'text', text: JSON.stringify(await client.calculateAccountMetrics(args as any), null, 2) }] };

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: 'text', text: `Error: ${errorMessage}` }],
        isError: true,
      };
    }
  });

  return server;
}
