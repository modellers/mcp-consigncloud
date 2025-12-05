# ConsignCloud API - Important Findings

## ❌ Parameters That DON'T Work

### Date Filtering
The following date filter parameters are **NOT supported** by the ConsignCloud API:
- `date_from` - Unknown parameter (not supported by API)
- `date_to` - Unknown parameter (not supported by API)

**Note:** The `created` parameter exists but requires full ISO 8601 datetime format (`2024-01-01T00:00:00Z`), not just a date.

### Implication
The following MCP tools now support `date_from` and `date_to` parameters with **client-side filtering**:

**List Endpoints:**
- ✅ `list_sales` - Filter sales by creation date
- ✅ `list_items` - Filter inventory items by creation date
- ✅ `list_accounts` - Filter accounts by creation date
- ✅ `list_batches` - Filter batches by creation date

**Aggregation Endpoints:**
- ✅ `calculate_inventory_value` - Filter items by date before aggregating
- ✅ `calculate_sales_totals` - Filter sales by date before aggregating
- ✅ `calculate_account_metrics` - Filter by date before calculating metrics

**How it works:**
1. Fetch all records from the API (paginating with limit=100 per page)
2. Apply client-side filtering by date using the `created` field
3. Return filtered results with `client_filtered: true` flag and `total_matched` count

This works but may be slower for large datasets (e.g., fetching all 2678 items to filter by date).

### Pagination Limits
The ConsignCloud API has a **maximum limit of 100 results per page**.

- ❌ `limit=200` - Returns 400 Bad Request
- ❌ `limit=500` - Returns 400 Bad Request
- ❌ `limit=1000` - Returns 400 Bad Request
- ✅ `limit=100` - Works (maximum allowed)
- ✅ `limit=50` - Works
- ✅ `limit=10` - Works

**Fixed:** All MCP endpoints now use `limit: 100` as the default (max allowed by API).

## ✅ What DOES Work

### Sales Trends Endpoint
**Endpoint:** `GET /trends/sales`

**Required Parameters (ALL must be provided):**
- `start_date` (string) - ISO 8601 date (YYYY-MM-DD)
- `end_date` (string) - ISO 8601 date (YYYY-MM-DD)
- `bucket_size` (enum) - One of: `day`, `week`, `month`

**Correct Usage:**
```javascript
client.getSalesTrends({
  start_date: '2024-01-01',
  end_date: '2024-12-31',
  bucket_size: 'month'
});
```

### Item Status Values
**Valid status values for `/items` endpoint:**
- `sold`
- `active`
- `expired`
- `sold_on_shopify`
- `sold_on_square`
- `sold_on_third_party`
- `to_be_returned`
- `returned_to_owner`
- `donated`
- `lost`
- `stolen`
- `damaged`
- `parked`
- `inactive`

**Note:** `available` is NOT a valid status value (causes 400 error)

### Sale Status Values
**Valid status values for `/sales` endpoint:**
- `open`
- `finalized`
- `parked`
- `voided`

**Note:** `completed` is NOT a valid status value (causes 400 error)

## 📝 Recommendations

1. ✅ **Date filtering implemented** - Client-side filtering now works for:
   - `list_sales` with `date_from` and `date_to`
   - `calculate_inventory_value`
   - `calculate_sales_totals`
   - `calculate_account_metrics`

2. **Update status enums** - Fix the tool definitions to use correct status values:
   - Items: Use `active`, `sold`, etc. instead of `available`
   - Sales: Use `finalized` instead of `completed`

3. ✅ **Sales trends fixed** - Uses `bucket_size` parameter (all 3 parameters required).

## 🧪 Test Results

- ✅ `get_sales_trends` with correct parameters: **WORKS**
- ✅ Item filtering by status `active`: **WORKS**
- ✅ Item filtering by status `sold`: **WORKS**
- ❌ Item filtering by status `available`: **FAILS** (400 error)
- ❌ Sale filtering by status `completed`: **FAILS** (400 error)
- ✅ Sale filtering by status `finalized`: **WORKS**
- ❌ Any date range filtering: **NOT SUPPORTED**
