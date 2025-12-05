import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setupServer } from './server.js';
import { ConsignCloudClient } from './client.js';

// Create a mock client with spy functions
const createMockClient = () => ({
  listSales: vi.fn(),
  listItems: vi.fn(),
  listAccounts: vi.fn(),
  listCategories: vi.fn(),
  listLocations: vi.fn(),
});

describe('MCP Endpoint Tests', () => {
  let mockClient: ReturnType<typeof createMockClient>;
  let server: any;

  beforeEach(() => {
    mockClient = createMockClient();
    server = setupServer(mockClient as any);
  });

  // Helper function to call a tool
  const callTool = async (name: string, args: any = {}) => {
    const request = {
      method: 'tools/call',
      params: {
        name,
        arguments: args,
      },
    };

    // Get the CallToolRequest handler from the server
    const handlers = (server as any)._requestHandlers;
    const handler = handlers.get('tools/call');
    return await handler(request);
  };

  describe('list_sales', () => {
    const mockSalesData = {
      data: [
        {
          id: 'sale1',
          total: 100,
          subtotal: 90,
          tax: 10,
          status: 'completed',
          location: 'loc1',
          customer: 'cust1',
          created: '2024-01-15T10:00:00Z'
        },
        {
          id: 'sale2',
          total: 200,
          subtotal: 180,
          tax: 20,
          status: 'completed',
          location: 'loc2',
          customer: 'cust2',
          created: '2024-01-20T10:00:00Z'
        },
        {
          id: 'sale3',
          total: 150,
          subtotal: 135,
          tax: 15,
          status: 'voided',
          location: 'loc1',
          customer: 'cust1',
          created: '2024-01-25T10:00:00Z'
        },
      ],
      next_cursor: null,
    };

    it('should list sales with no arguments (default limit)', async () => {
      mockClient.listSales.mockResolvedValue(mockSalesData);

      const result = await callTool('list_sales', {});

      expect(mockClient.listSales).toHaveBeenCalledWith({ limit: 100 });
      expect(result.content[0].text).toContain('sale1');
    });

    it('should list sales with custom limit', async () => {
      mockClient.listSales.mockResolvedValue(mockSalesData);

      await callTool('list_sales', { limit: 50 });

      expect(mockClient.listSales).toHaveBeenCalledWith({ limit: 50 });
    });

    it('should filter sales by status', async () => {
      mockClient.listSales.mockResolvedValue({
        data: [mockSalesData.data[0], mockSalesData.data[1]],
        next_cursor: null,
      });

      await callTool('list_sales', { status: 'completed' });

      expect(mockClient.listSales).toHaveBeenCalledWith({
        limit: 100,
        status: 'completed'
      });
    });

    it('should filter sales by location', async () => {
      mockClient.listSales.mockResolvedValue(mockSalesData);

      await callTool('list_sales', { location: 'loc1' });

      expect(mockClient.listSales).toHaveBeenCalledWith({
        limit: 100,
        location: 'loc1'
      });
    });

    it('should filter sales by customer', async () => {
      mockClient.listSales.mockResolvedValue(mockSalesData);

      await callTool('list_sales', { customer: 'cust1' });

      expect(mockClient.listSales).toHaveBeenCalledWith({
        limit: 100,
        customer: 'cust1'
      });
    });

    it('should filter sales by date_from only', async () => {
      mockClient.listSales.mockResolvedValue(mockSalesData);

      const result = await callTool('list_sales', {
        date_from: '2024-01-20'
      });

      // Should fetch all and filter client-side
      // IMPORTANT: date_from should NOT be passed to the API
      expect(mockClient.listSales).toHaveBeenCalledWith({
        limit: 100
      });
      const resultData = JSON.parse(result.content[0].text);
      expect(resultData.client_filtered).toBe(true);
      expect(resultData.data.length).toBe(2); // sale2 and sale3
    });

    it('should filter sales by date_to only', async () => {
      mockClient.listSales.mockResolvedValue(mockSalesData);

      const result = await callTool('list_sales', {
        date_to: '2024-01-20'
      });

      // IMPORTANT: date_to should NOT be passed to the API
      expect(mockClient.listSales).toHaveBeenCalledWith({
        limit: 100
      });
      const resultData = JSON.parse(result.content[0].text);
      expect(resultData.client_filtered).toBe(true);
      // Date comparison: "2024-01-20T10:00:00Z" is greater than "2024-01-20" (midnight)
      // so only sale1 (2024-01-15) passes the filter
      expect(resultData.data.length).toBe(1); // only sale1
    });

    it('should filter sales by date range (date_from and date_to)', async () => {
      mockClient.listSales.mockResolvedValue(mockSalesData);

      const result = await callTool('list_sales', {
        date_from: '2024-01-16',
        date_to: '2024-01-24'
      });

      // IMPORTANT: date_from and date_to should NOT be passed to the API
      expect(mockClient.listSales).toHaveBeenCalledWith({
        limit: 100
      });
      const resultData = JSON.parse(result.content[0].text);
      expect(resultData.client_filtered).toBe(true);
      expect(resultData.data.length).toBe(1); // only sale2
    });

    it('should combine status and location filters', async () => {
      mockClient.listSales.mockResolvedValue(mockSalesData);

      await callTool('list_sales', {
        status: 'completed',
        location: 'loc1'
      });

      expect(mockClient.listSales).toHaveBeenCalledWith({
        limit: 100,
        status: 'completed',
        location: 'loc1'
      });
    });

    it('should combine date_from with status filter', async () => {
      mockClient.listSales.mockResolvedValue(mockSalesData);

      const result = await callTool('list_sales', {
        date_from: '2024-01-20',
        status: 'completed'
      });

      // Should filter by status via API and date client-side
      // IMPORTANT: date_from should NOT be passed to API, but status should be
      expect(mockClient.listSales).toHaveBeenCalledWith({
        limit: 100,
        status: 'completed'
      });
      const resultData = JSON.parse(result.content[0].text);
      expect(resultData.client_filtered).toBe(true);
    });

    it('should handle pagination with cursor', async () => {
      mockClient.listSales.mockResolvedValue(mockSalesData);

      await callTool('list_sales', {
        cursor: 'next-page-token',
        limit: 100
      });

      expect(mockClient.listSales).toHaveBeenCalledWith({
        limit: 100,
        cursor: 'next-page-token'
      });
    });

    it('should combine all filter types', async () => {
      mockClient.listSales.mockResolvedValue(mockSalesData);

      await callTool('list_sales', {
        status: 'completed',
        location: 'loc1',
        customer: 'cust1',
        limit: 50
      });

      expect(mockClient.listSales).toHaveBeenCalledWith({
        limit: 50,
        status: 'completed',
        location: 'loc1',
        customer: 'cust1'
      });
    });
  });

  describe('list_items', () => {
    const mockItemsData = {
      data: [
        {
          id: 'item1',
          title: 'Item 1',
          tag_price: 50,
          status: 'available',
          category: 'cat1',
          account: 'acc1',
          location: 'loc1',
          created: '2024-01-10T10:00:00Z'
        },
        {
          id: 'item2',
          title: 'Item 2',
          tag_price: 150,
          status: 'available',
          category: 'cat2',
          account: 'acc2',
          location: 'loc2',
          created: '2024-01-15T10:00:00Z'
        },
        {
          id: 'item3',
          title: 'Item 3',
          tag_price: 250,
          status: 'sold',
          category: 'cat1',
          account: 'acc1',
          location: 'loc1',
          created: '2024-01-20T10:00:00Z'
        },
      ],
      next_cursor: null,
    };

    it('should list items with no arguments (default limit)', async () => {
      mockClient.listItems.mockResolvedValue(mockItemsData);

      const result = await callTool('list_items', {});

      expect(mockClient.listItems).toHaveBeenCalledWith({ limit: 100 });
      expect(result.content[0].text).toContain('item1');
    });

    it('should list items with custom limit', async () => {
      mockClient.listItems.mockResolvedValue(mockItemsData);

      await callTool('list_items', { limit: 100 });

      expect(mockClient.listItems).toHaveBeenCalledWith({ limit: 100 });
    });

    it('should filter items by status', async () => {
      mockClient.listItems.mockResolvedValue(mockItemsData);

      await callTool('list_items', { status: 'available' });

      expect(mockClient.listItems).toHaveBeenCalledWith({
        limit: 100,
        status: 'available'
      });
    });

    it('should filter items by category', async () => {
      mockClient.listItems.mockResolvedValue(mockItemsData);

      await callTool('list_items', { category: 'cat1' });

      expect(mockClient.listItems).toHaveBeenCalledWith({
        limit: 100,
        category: 'cat1'
      });
    });

    it('should filter items by account', async () => {
      mockClient.listItems.mockResolvedValue(mockItemsData);

      await callTool('list_items', { account: 'acc1' });

      expect(mockClient.listItems).toHaveBeenCalledWith({
        limit: 100,
        account: 'acc1'
      });
    });

    it('should filter items by location', async () => {
      mockClient.listItems.mockResolvedValue(mockItemsData);

      await callTool('list_items', { location: 'loc1' });

      expect(mockClient.listItems).toHaveBeenCalledWith({
        limit: 100,
        location: 'loc1'
      });
    });

    it('should filter items by tag_price_gte (minimum price)', async () => {
      mockClient.listItems.mockResolvedValue(mockItemsData);

      await callTool('list_items', { tag_price_gte: 100 });

      expect(mockClient.listItems).toHaveBeenCalledWith({
        limit: 100,
        tag_price_gte: 100
      });
    });

    it('should filter items by tag_price_lte (maximum price)', async () => {
      mockClient.listItems.mockResolvedValue(mockItemsData);

      await callTool('list_items', { tag_price_lte: 200 });

      expect(mockClient.listItems).toHaveBeenCalledWith({
        limit: 100,
        tag_price_lte: 200
      });
    });

    it('should filter items by price range (both gte and lte)', async () => {
      mockClient.listItems.mockResolvedValue(mockItemsData);

      await callTool('list_items', {
        tag_price_gte: 100,
        tag_price_lte: 200
      });

      expect(mockClient.listItems).toHaveBeenCalledWith({
        limit: 100,
        tag_price_gte: 100,
        tag_price_lte: 200
      });
    });

    it('should combine status and category filters', async () => {
      mockClient.listItems.mockResolvedValue(mockItemsData);

      await callTool('list_items', {
        status: 'available',
        category: 'cat1'
      });

      expect(mockClient.listItems).toHaveBeenCalledWith({
        limit: 100,
        status: 'available',
        category: 'cat1'
      });
    });

    it('should combine price range and location filters', async () => {
      mockClient.listItems.mockResolvedValue(mockItemsData);

      await callTool('list_items', {
        tag_price_gte: 50,
        tag_price_lte: 200,
        location: 'loc1'
      });

      expect(mockClient.listItems).toHaveBeenCalledWith({
        limit: 100,
        tag_price_gte: 50,
        tag_price_lte: 200,
        location: 'loc1'
      });
    });

    it('should handle pagination with cursor', async () => {
      mockClient.listItems.mockResolvedValue(mockItemsData);

      await callTool('list_items', {
        cursor: 'next-page-token',
        limit: 50
      });

      expect(mockClient.listItems).toHaveBeenCalledWith({
        limit: 50,
        cursor: 'next-page-token'
      });
    });

    it('should combine multiple filters (status, category, account, price)', async () => {
      mockClient.listItems.mockResolvedValue(mockItemsData);

      await callTool('list_items', {
        status: 'available',
        category: 'cat1',
        account: 'acc1',
        tag_price_gte: 40,
        tag_price_lte: 100,
        location: 'loc1'
      });

      expect(mockClient.listItems).toHaveBeenCalledWith({
        limit: 100,
        status: 'available',
        category: 'cat1',
        account: 'acc1',
        tag_price_gte: 40,
        tag_price_lte: 100,
        location: 'loc1'
      });
    });

    it('should filter items by date_from only', async () => {
      mockClient.listItems.mockResolvedValue(mockItemsData);

      const result = await callTool('list_items', {
        date_from: '2024-01-15'
      });

      // IMPORTANT: date_from should NOT be passed to the API
      expect(mockClient.listItems).toHaveBeenCalledWith({
        limit: 100
      });
      const resultData = JSON.parse(result.content[0].text);
      expect(resultData.client_filtered).toBe(true);
      expect(resultData.data.length).toBe(2); // item2 and item3
    });

    it('should filter items by date range', async () => {
      mockClient.listItems.mockResolvedValue(mockItemsData);

      const result = await callTool('list_items', {
        date_from: '2024-01-12',
        date_to: '2024-01-18'
      });

      // IMPORTANT: date parameters should NOT be passed to the API
      expect(mockClient.listItems).toHaveBeenCalledWith({
        limit: 100
      });
      const resultData = JSON.parse(result.content[0].text);
      expect(resultData.client_filtered).toBe(true);
      expect(resultData.data.length).toBe(1); // only item2
    });

    it('should combine date filtering with other filters', async () => {
      mockClient.listItems.mockResolvedValue(mockItemsData);

      const result = await callTool('list_items', {
        date_from: '2024-01-12',
        status: 'available'
      });

      // status should be passed to API, but not date_from
      expect(mockClient.listItems).toHaveBeenCalledWith({
        limit: 100,
        status: 'available'
      });
      const resultData = JSON.parse(result.content[0].text);
      expect(resultData.client_filtered).toBe(true);
    });
  });

  describe('list_accounts', () => {
    const mockAccountsData = {
      data: [
        {
          id: 'acc1',
          first_name: 'John',
          last_name: 'Doe',
          balance: 100,
          is_vendor: true,
          created: '2024-01-05T10:00:00Z'
        },
        {
          id: 'acc2',
          first_name: 'Jane',
          last_name: 'Smith',
          balance: 200,
          is_vendor: false,
          created: '2024-01-15T10:00:00Z'
        },
        {
          id: 'acc3',
          company: 'Acme Corp',
          balance: 500,
          is_vendor: true,
          created: '2024-01-25T10:00:00Z'
        },
      ],
      next_cursor: null,
    };

    it('should list accounts with no arguments (default limit)', async () => {
      mockClient.listAccounts.mockResolvedValue(mockAccountsData);

      const result = await callTool('list_accounts', {});

      expect(mockClient.listAccounts).toHaveBeenCalledWith({ limit: 100 });
      expect(result.content[0].text).toContain('acc1');
    });

    it('should list accounts with custom limit', async () => {
      mockClient.listAccounts.mockResolvedValue(mockAccountsData);

      await callTool('list_accounts', { limit: 50 });

      expect(mockClient.listAccounts).toHaveBeenCalledWith({ limit: 50 });
    });

    it('should filter accounts by is_vendor=true', async () => {
      mockClient.listAccounts.mockResolvedValue({
        data: [mockAccountsData.data[0], mockAccountsData.data[2]],
        next_cursor: null,
      });

      await callTool('list_accounts', { is_vendor: true });

      expect(mockClient.listAccounts).toHaveBeenCalledWith({
        limit: 100,
        is_vendor: true
      });
    });

    it('should filter accounts by is_vendor=false', async () => {
      mockClient.listAccounts.mockResolvedValue({
        data: [mockAccountsData.data[1]],
        next_cursor: null,
      });

      await callTool('list_accounts', { is_vendor: false });

      expect(mockClient.listAccounts).toHaveBeenCalledWith({
        limit: 100,
        is_vendor: false
      });
    });

    it('should handle pagination with cursor', async () => {
      mockClient.listAccounts.mockResolvedValue(mockAccountsData);

      await callTool('list_accounts', {
        cursor: 'next-page-token',
        limit: 100
      });

      expect(mockClient.listAccounts).toHaveBeenCalledWith({
        limit: 100,
        cursor: 'next-page-token'
      });
    });

    it('should combine is_vendor filter with pagination', async () => {
      mockClient.listAccounts.mockResolvedValue(mockAccountsData);

      await callTool('list_accounts', {
        is_vendor: true,
        limit: 25,
        cursor: 'page2'
      });

      expect(mockClient.listAccounts).toHaveBeenCalledWith({
        limit: 25,
        is_vendor: true,
        cursor: 'page2'
      });
    });

    it('should filter accounts by date_from only', async () => {
      mockClient.listAccounts.mockResolvedValue(mockAccountsData);

      const result = await callTool('list_accounts', {
        date_from: '2024-01-10'
      });

      // IMPORTANT: date_from should NOT be passed to the API
      expect(mockClient.listAccounts).toHaveBeenCalledWith({
        limit: 100
      });
      const resultData = JSON.parse(result.content[0].text);
      expect(resultData.client_filtered).toBe(true);
      expect(resultData.data.length).toBe(2); // acc2 and acc3
    });

    it('should filter accounts by date range', async () => {
      mockClient.listAccounts.mockResolvedValue(mockAccountsData);

      const result = await callTool('list_accounts', {
        date_from: '2024-01-10',
        date_to: '2024-01-20'
      });

      // IMPORTANT: date parameters should NOT be passed to the API
      expect(mockClient.listAccounts).toHaveBeenCalledWith({
        limit: 100
      });
      const resultData = JSON.parse(result.content[0].text);
      expect(resultData.client_filtered).toBe(true);
      expect(resultData.data.length).toBe(1); // only acc2
    });

    it('should combine date filtering with is_vendor filter', async () => {
      mockClient.listAccounts.mockResolvedValue(mockAccountsData);

      const result = await callTool('list_accounts', {
        date_from: '2024-01-10',
        is_vendor: true
      });

      // is_vendor should be passed to API, but not date_from
      expect(mockClient.listAccounts).toHaveBeenCalledWith({
        limit: 100,
        is_vendor: true
      });
      const resultData = JSON.parse(result.content[0].text);
      expect(resultData.client_filtered).toBe(true);
    });
  });

  describe('list_categories', () => {
    const mockCategoriesData = {
      data: [
        { id: 'cat1', name: 'Electronics' },
        { id: 'cat2', name: 'Clothing' },
        { id: 'cat3', name: 'Furniture' },
      ],
      next_cursor: null,
    };

    it('should list categories with no arguments (default limit)', async () => {
      mockClient.listCategories.mockResolvedValue(mockCategoriesData);

      const result = await callTool('list_categories', {});

      expect(mockClient.listCategories).toHaveBeenCalledWith({ limit: 100 });
      expect(result.content[0].text).toContain('cat1');
    });

    it('should list categories with custom limit', async () => {
      mockClient.listCategories.mockResolvedValue(mockCategoriesData);

      await callTool('list_categories', { limit: 10 });

      expect(mockClient.listCategories).toHaveBeenCalledWith({ limit: 10 });
    });

    it('should handle pagination with cursor', async () => {
      mockClient.listCategories.mockResolvedValue(mockCategoriesData);

      await callTool('list_categories', {
        cursor: 'next-page-token',
        limit: 50
      });

      expect(mockClient.listCategories).toHaveBeenCalledWith({
        limit: 50,
        cursor: 'next-page-token'
      });
    });

    it('should handle pagination with only cursor', async () => {
      mockClient.listCategories.mockResolvedValue(mockCategoriesData);

      await callTool('list_categories', {
        cursor: 'next-page-token'
      });

      expect(mockClient.listCategories).toHaveBeenCalledWith({
        limit: 100,
        cursor: 'next-page-token'
      });
    });
  });

  describe('list_locations', () => {
    const mockLocationsData = {
      data: [
        { id: 'loc1', name: 'Main Store', address: '123 Main St' },
        { id: 'loc2', name: 'Branch Store', address: '456 Oak Ave' },
        { id: 'loc3', name: 'Warehouse', address: '789 Industrial Rd' },
      ],
      next_cursor: null,
    };

    it('should list locations with no arguments (default limit)', async () => {
      mockClient.listLocations.mockResolvedValue(mockLocationsData);

      const result = await callTool('list_locations', {});

      expect(mockClient.listLocations).toHaveBeenCalledWith({ limit: 100 });
      expect(result.content[0].text).toContain('loc1');
    });

    it('should list locations with custom limit', async () => {
      mockClient.listLocations.mockResolvedValue(mockLocationsData);

      await callTool('list_locations', { limit: 5 });

      expect(mockClient.listLocations).toHaveBeenCalledWith({ limit: 5 });
    });

    it('should handle pagination with cursor', async () => {
      mockClient.listLocations.mockResolvedValue(mockLocationsData);

      await callTool('list_locations', {
        cursor: 'next-page-token',
        limit: 20
      });

      expect(mockClient.listLocations).toHaveBeenCalledWith({
        limit: 20,
        cursor: 'next-page-token'
      });
    });

    it('should handle pagination with only cursor', async () => {
      mockClient.listLocations.mockResolvedValue(mockLocationsData);

      await callTool('list_locations', {
        cursor: 'next-page-token'
      });

      expect(mockClient.listLocations).toHaveBeenCalledWith({
        limit: 100,
        cursor: 'next-page-token'
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty results for list_sales', async () => {
      mockClient.listSales.mockResolvedValue({ data: [], next_cursor: null });

      const result = await callTool('list_sales', {});

      expect(result.content[0].text).toContain('[]');
    });

    it('should handle empty results for list_items', async () => {
      mockClient.listItems.mockResolvedValue({ data: [], next_cursor: null });

      const result = await callTool('list_items', {});

      expect(result.content[0].text).toContain('[]');
    });

    it('should handle zero as valid price filter', async () => {
      mockClient.listItems.mockResolvedValue({ data: [], next_cursor: null });

      await callTool('list_items', { tag_price_gte: 0 });

      expect(mockClient.listItems).toHaveBeenCalledWith({
        limit: 100,
        tag_price_gte: 0
      });
    });

    it('should handle date filtering with no created field', async () => {
      const salesWithoutDates = {
        data: [
          { id: 'sale1', total: 100 },
        ],
        next_cursor: null,
      };

      mockClient.listSales.mockResolvedValue(salesWithoutDates);

      const result = await callTool('list_sales', {
        date_from: '2024-01-01'
      });

      const resultData = JSON.parse(result.content[0].text);
      expect(resultData.data.length).toBe(0); // Filtered out due to missing created field
    });

    it('should handle limit of 0 (treated as default 1000)', async () => {
      mockClient.listSales.mockResolvedValue({ data: [], next_cursor: null });

      await callTool('list_sales', { limit: 0 });

      // limit: 0 is falsy, so it defaults to 1000
      expect(mockClient.listSales).toHaveBeenCalledWith({ limit: 100, cursor: undefined });
    });

    it('should handle very large limit', async () => {
      mockClient.listItems.mockResolvedValue({ data: [], next_cursor: null });

      await callTool('list_items', { limit: 999999 });

      expect(mockClient.listItems).toHaveBeenCalledWith({ limit: 999999 });
    });
  });
});
