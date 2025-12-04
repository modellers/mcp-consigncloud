import { ConsignCloudClient } from './dist/client.js';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.CONSIGNCLOUD_API_KEY;
const apiUrl = process.env.CONSIGNCLOUD_API_BASE_URL || 'https://api.consigncloud.com/api/v1';

if (!apiKey) {
  console.error('❌ CONSIGNCLOUD_API_KEY not found in environment');
  process.exit(1);
}

const client = new ConsignCloudClient(apiKey, apiUrl);

// Test date range
const DATE_FROM = '2024-01-01';
const DATE_TO = '2024-12-31';

console.log(`\n🧪 Testing All GET Endpoints`);
console.log(`📅 Date Range: ${DATE_FROM} to ${DATE_TO}\n`);
console.log('='.repeat(80));

async function testEndpoint(name, testFn) {
  try {
    console.log(`\n🔍 Testing: ${name}`);
    const startTime = Date.now();
    const result = await testFn();
    const duration = Date.now() - startTime;
    console.log(`✅ ${name} - Success (${duration}ms)`);
    return { name, success: true, duration, result };
  } catch (error) {
    console.log(`❌ ${name} - Failed: ${error.message}`);
    return { name, success: false, error: error.message };
  }
}

async function runTests() {
  const results = [];

  // List Operations
  console.log('\n📋 LIST OPERATIONS');
  console.log('-'.repeat(80));

  results.push(await testEndpoint('list_items', async () => {
    const res = await client.listItems({ limit: 5 });
    console.log(`   Found ${res.data.length} items (showing max 5)`);
    if (res.data[0]) console.log(`   Sample: ${res.data[0].title}`);
    return res;
  }));

  results.push(await testEndpoint('list_items (with status filter)', async () => {
    const res = await client.listItems({ limit: 5, status: 'active' });
    console.log(`   Found ${res.data.length} active items`);
    return res;
  }));

  results.push(await testEndpoint('list_sales', async () => {
    const res = await client.listSales({ limit: 5 });
    console.log(`   Found ${res.data.length} sales (showing max 5)`);
    if (res.data[0]) console.log(`   Sample total: ${res.data[0].total} ISK`);
    return res;
  }));

  results.push(await testEndpoint('list_sales (with status filter)', async () => {
    const res = await client.listSales({ limit: 5, status: 'finalized' });
    console.log(`   Found ${res.data.length} finalized sales`);
    return res;
  }));

  results.push(await testEndpoint('list_accounts', async () => {
    const res = await client.listAccounts({ limit: 5 });
    console.log(`   Found ${res.data.length} accounts (showing max 5)`);
    return res;
  }));

  results.push(await testEndpoint('list_categories', async () => {
    const res = await client.listCategories({ limit: 5 });
    console.log(`   Found ${res.data.length} categories (showing max 5)`);
    return res;
  }));

  results.push(await testEndpoint('list_locations', async () => {
    const res = await client.listLocations({ limit: 5 });
    console.log(`   Found ${res.data.length} locations (showing max 5)`);
    return res;
  }));

  results.push(await testEndpoint('list_batches', async () => {
    const res = await client.listBatches({ limit: 5 });
    console.log(`   Found ${res.data.length} batches (showing max 5)`);
    return res;
  }));

  // Get Single Record Operations
  console.log('\n🔎 GET SINGLE RECORD OPERATIONS');
  console.log('-'.repeat(80));

  // First get some IDs to test with
  const items = await client.listItems({ limit: 1 });
  const sales = await client.listSales({ limit: 1 });
  const accounts = await client.listAccounts({ limit: 1 });

  if (items.data.length > 0) {
    results.push(await testEndpoint('get_item', async () => {
      const item = await client.getItem(items.data[0].id);
      console.log(`   Item: ${item.title} - ${item.tag_price} ISK`);
      return item;
    }));
  }

  if (sales.data.length > 0) {
    results.push(await testEndpoint('get_sale', async () => {
      const sale = await client.getSale(sales.data[0].id);
      console.log(`   Sale Total: ${sale.total} ISK`);
      return sale;
    }));
  }

  if (accounts.data.length > 0) {
    results.push(await testEndpoint('get_account', async () => {
      const account = await client.getAccount(accounts.data[0].id);
      console.log(`   Account: ${account.first_name} ${account.last_name}`);
      return account;
    }));
  }

  // Statistics Operations
  console.log('\n📊 STATISTICS OPERATIONS');
  console.log('-'.repeat(80));

  results.push(await testEndpoint('get_item_stats', async () => {
    const stats = await client.getItemStats();
    console.log(`   Stats retrieved`);
    return stats;
  }));

  if (accounts.data.length > 0) {
    results.push(await testEndpoint('get_account_stats', async () => {
      const stats = await client.getAccountStats(accounts.data[0].id);
      console.log(`   Account stats retrieved`);
      return stats;
    }));
  }

  results.push(await testEndpoint('get_sales_trends (FIXED)', async () => {
    const trends = await client.getSalesTrends({
      start_date: DATE_FROM,
      end_date: DATE_TO,
      bucket_size: 'month'
    });
    console.log(`   ✨ Trends retrieved with bucket_size parameter!`);
    if (trends.data) console.log(`   Found ${trends.data.length} data points`);
    return trends;
  }));

  // Search Operations
  console.log('\n🔍 SEARCH OPERATIONS');
  console.log('-'.repeat(80));

  results.push(await testEndpoint('search_suggest', async () => {
    const res = await client.search('test', ['items', 'accounts']);
    console.log(`   Search results retrieved`);
    return res;
  }));

  results.push(await testEndpoint('suggest_field_values', async () => {
    const res = await client.suggestFieldValues('items', 'brand', 'a');
    console.log(`   Suggestions retrieved`);
    return res;
  }));

  // Calculation Operations (NEW)
  console.log('\n🧮 CALCULATION OPERATIONS (NEW - WITH LOCALE FORMATTING)');
  console.log('-'.repeat(80));

  results.push(await testEndpoint('calculate_inventory_value (no params)', async () => {
    const res = await client.calculateInventoryValue();
    console.log(`   Total Value: ${res.total_value_formatted} ${res.currency}`);
    console.log(`   Total Items: ${res.total_items}`);
    console.log(`   Average: ${res.average_value_formatted} ${res.currency}`);
    console.log(`   Filters: ${res.filters_applied.length > 0 ? res.filters_applied.join(', ') : 'none'}`);
    return res;
  }));

  results.push(await testEndpoint('calculate_inventory_value (with date range)', async () => {
    const res = await client.calculateInventoryValue({
      date_from: DATE_FROM,
      date_to: DATE_TO
    });
    console.log(`   📅 Date Range: ${DATE_FROM} to ${DATE_TO}`);
    console.log(`   Total Value: ${res.total_value_formatted} ${res.currency}`);
    console.log(`   Total Items: ${res.total_items}`);
    console.log(`   Filters: ${res.filters_applied.join(', ')}`);
    return res;
  }));

  results.push(await testEndpoint('calculate_inventory_value (with category)', async () => {
    const categories = await client.listCategories({ limit: 1 });
    if (categories.data.length > 0) {
      const res = await client.calculateInventoryValue({
        category: categories.data[0].id
      });
      console.log(`   Category: ${categories.data[0].name}`);
      console.log(`   Total Value: ${res.total_value_formatted} ${res.currency}`);
      console.log(`   Total Items: ${res.total_items}`);
      return res;
    }
    throw new Error('No categories found');
  }));

  results.push(await testEndpoint('calculate_sales_totals (no params)', async () => {
    const res = await client.calculateSalesTotals();
    console.log(`   Total Revenue: ${res.total_revenue_formatted} ${res.currency}`);
    console.log(`   Total Tax: ${res.total_tax_formatted} ${res.currency}`);
    console.log(`   Total Sales: ${res.total_sales}`);
    console.log(`   Average Sale: ${res.average_sale_formatted} ${res.currency}`);
    console.log(`   Filters: ${res.filters_applied.length > 0 ? res.filters_applied.join(', ') : 'none'}`);
    return res;
  }));

  results.push(await testEndpoint('calculate_sales_totals (with date range)', async () => {
    const res = await client.calculateSalesTotals({
      date_from: DATE_FROM,
      date_to: DATE_TO
    });
    console.log(`   📅 Date Range: ${DATE_FROM} to ${DATE_TO}`);
    console.log(`   Total Revenue: ${res.total_revenue_formatted} ${res.currency}`);
    console.log(`   Total Sales: ${res.total_sales}`);
    console.log(`   Filters: ${res.filters_applied.join(', ')}`);
    return res;
  }));

  if (accounts.data.length > 0) {
    results.push(await testEndpoint('calculate_account_metrics', async () => {
      const res = await client.calculateAccountMetrics({
        account_id: accounts.data[0].id
      });
      console.log(`   Account: ${res.account_name}`);
      console.log(`   Balance: ${res.current_balance_formatted} ${res.currency}`);
      console.log(`   Inventory Value: ${res.inventory_value_formatted} ${res.currency}`);
      console.log(`   Items Available: ${res.items_available}, Sold: ${res.items_sold}`);
      console.log(`   Locale: ${res.locale}`);
      return res;
    }));
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(80));

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const totalTime = results.reduce((sum, r) => sum + (r.duration || 0), 0);

  console.log(`\n✅ Successful: ${successful}/${results.length}`);
  console.log(`❌ Failed: ${failed}/${results.length}`);
  console.log(`⏱️  Total Time: ${totalTime}ms`);

  if (failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`   - ${r.name}: ${r.error}`);
    });
  }

  console.log('\n✨ All GET endpoints tested!\n');
}

runTests().catch(console.error);
