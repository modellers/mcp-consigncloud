# ConsignCloud API - Important Findings

## ❌ Parameters That DON'T Work

### Date Filtering
The following date filter parameters are **NOT supported** by the ConsignCloud API:
- `created_gte` - Unknown parameter
- `created_lte` - Unknown parameter
- `date_from` - Unknown parameter
- `date_to` - Unknown parameter

**Note:** The `created` parameter exists but requires full ISO 8601 datetime format (`2024-01-01T00:00:00Z`), not just a date.

### Implication
Our calculation tools (`calculate_inventory_value`, `calculate_sales_totals`, `calculate_account_metrics`) currently accept `date_from` and `date_to` parameters, but these **cannot be passed to the API**. They are placeholders for future functionality if the API adds date filtering support.

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

1. **Remove date filtering from calculation tools** - Since the API doesn't support date range filtering on items/sales, remove `date_from` and `date_to` parameters from:
   - `calculate_inventory_value`
   - `calculate_sales_totals`
   - `calculate_account_metrics`

2. **Update status enums** - Fix the tool definitions to use correct status values:
   - Items: Use `active`, `sold`, etc. instead of `available`
   - Sales: Use `finalized` instead of `completed`

3. **Fix sales trends** - Update `interval` parameter to `bucket_size` and make all 3 parameters required.

## 🧪 Test Results

- ✅ `get_sales_trends` with correct parameters: **WORKS**
- ✅ Item filtering by status `active`: **WORKS**
- ✅ Item filtering by status `sold`: **WORKS**
- ❌ Item filtering by status `available`: **FAILS** (400 error)
- ❌ Sale filtering by status `completed`: **FAILS** (400 error)
- ✅ Sale filtering by status `finalized`: **WORKS**
- ❌ Any date range filtering: **NOT SUPPORTED**
