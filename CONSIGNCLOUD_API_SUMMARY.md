# ConsignCloud API Summary

## Authentication

**Base URL:** `https://api.consigncloud.com/api/v1/`

**Authentication Method:** Bearer Token

To get an API key:
1. Navigate to Settings → Apps in ConsignCloud
2. Enable "API & Webhooks" app
3. Click "Add API Key"

**Authorization Header:**
```
Authorization: Bearer {your_api_key}
```

## Rate Limiting

The API uses a leaky bucket algorithm:
- Bucket capacity: 100 requests
- Leak rate: 10 requests/second
- If exceeded: 429 status code returned

## Key Endpoints for Inventory Management

### Items (Inventory Products)

**GET /items** - List items
- Permissions: `read:items`
- Supports filtering by:
  - `tag_price` (with gte, lte, gt, lt, eq, ne operators)
  - `category`
  - `account`
  - `created` (date range)
  - `status`
  - `inventory_type` (consignment, buy_outright, retail)
  - `location`
  - `batch`
  - And many more filters

**POST /items** - Create item
- Permissions: `write:items`

**GET /items/{id}** - Get specific item
- Permissions: `read:items`

**PATCH /items/{id}** - Update item
- Permissions: `write:items`

**DELETE /items/{id}** - Delete item (soft delete)
- Permissions: `delete:items`

**POST /items/{id}/restore** - Restore deleted item
- Permissions: `write:items`

**GET /items/stats** - Get inventory statistics
- Permissions: `read:items`

**POST /items/bulk-edits** - Bulk edit items
- Permissions: `bulk_edit:items`

**GET /items/export** - Export items to CSV
- Permissions: `read:items`

**POST /items/update-statuses** - Update item statuses
- Permissions: `write:item_status_changes`

**POST /items/update-statuses-bulk** - Bulk update item statuses
- Permissions: `write:item_status_changes`

**GET /items/price-suggestions** - Get AI price suggestions
- Permissions: `read:items`

### Sales

**GET /sales** - List sales
- Permissions: `read:sales`
- Supports filtering by:
  - `total`, `subtotal`, `change`, `cogs` (with comparison operators)
  - `created` (date range)
  - `location`
  - `customer` (account)
  - `status` (completed, voided, returned)
  - `payment_type`

**POST /sales** - Create sale
- Permissions: `write:sales`

**GET /sales/{id}** - Get specific sale
- Permissions: `read:sales`

**PATCH /sales/{id}** - Update sale
- Permissions: `write:sales`

**POST /sales/{id}/void** - Void a sale
- Permissions: `write:sales`

**POST /sales/{id}/refund** - Refund a sale
- Permissions: `write:sales`

**GET /sales/export** - Export sales to CSV
- Permissions: `read:sales`

### Item Sales (Individual Item Sales within a Sale)

**GET /item-sales** - List item sales
- Permissions: `read:item_sales`

**GET /items/{item_id}/sale** - Get sale for specific item
- Permissions: `read:item_sales`

**GET /items/{item_id}/sale/{id}** - Get specific item sale
- Permissions: `read:item_sales`

### Accounts (Vendors/Consignors)

**GET /accounts** - List accounts
- Permissions: `read:accounts`

**POST /accounts** - Create account
- Permissions: `write:accounts`

**GET /accounts/{id}** - Get specific account
- Permissions: `read:accounts`

**PATCH /accounts/{id}** - Update account
- Permissions: `write:accounts`

**DELETE /accounts/{id}** - Delete account
- Permissions: `delete:accounts`

**POST /accounts/{id}/restore** - Restore deleted account
- Permissions: `write:accounts`

**GET /accounts/{id}/stats** - Get account statistics
- Permissions: `read:accounts`

**GET /accounts/stats** - Get overall account statistics
- Permissions: `read:accounts`

**POST /accounts/bulk-edits** - Bulk edit accounts
- Permissions: `write:accounts`

### Balance Entries (Account Balances)

**GET /balance-entries** - List balance entries
- Permissions: `read:balance_entries`

**GET /balance-entries/{id}** - Get specific balance entry
- Permissions: `read:balance_entries`

**GET /accounts/balances** - Get account balances
- Permissions: `read:account_balances`

**POST /accounts/payouts** - Create bulk payout
- Permissions: `write:account_balances`

### Batches (Groups of Items)

**GET /batches** - List batches
- Permissions: `read:batches`

**POST /batches** - Create batch
- Permissions: `write:batches`

**GET /batches/{id}** - Get specific batch
- Permissions: `read:batches`

**PATCH /batches/{id}** - Update batch
- Permissions: `write:batches`

**POST /batches/{id}/status** - Change batch status (draft ↔ submitted)
- Permissions: `submit:batches`

### Item Categories

**GET /item-categories** - List categories
- Permissions: Implied by `read:items`

**POST /item-categories** - Create category
- Permissions: `write:item_categories`

**GET /item-categories/{id}** - Get specific category
- Permissions: Implied by `read:items`

**PATCH /item-categories/{id}** - Update category
- Permissions: `write:item_categories`

**DELETE /item-categories/{id}** - Delete category
- Permissions: `write:item_categories`

**POST /item-categories/{id}/restore** - Restore deleted category
- Permissions: `write:item_categories`

### Locations

**GET /locations** - List locations
- Permissions: `read:locations`

**POST /locations** - Create location
- Permissions: `write:locations`

**GET /locations/{id}** - Get specific location
- Permissions: `read:locations`

**PATCH /locations/{id}** - Update location
- Permissions: `write:locations`

**DELETE /locations/{id}** - Delete location
- Permissions: `delete:locations`

### Discounts

**GET /discounts** - List discounts
- Permissions: `read:discounts`

**POST /discounts** - Create discount
- Permissions: `write:discounts`

**GET /discounts/{id}** - Get specific discount
- Permissions: `read:discounts`

**PATCH /discounts/{id}** - Update discount
- Permissions: `write:discounts`

**DELETE /discounts/{id}** - Delete discount
- Permissions: `delete:discounts`

**POST /discounts/{id}/restore** - Restore deleted discount
- Permissions: `write:discounts`

### Taxes

**GET /taxes** - List taxes
- Permissions: `read:taxes`

**POST /taxes** - Create tax
- Permissions: `write:taxes`

**GET /taxes/{id}** - Get specific tax
- Permissions: `read:taxes`

**PATCH /taxes/{id}** - Update tax
- Permissions: `write:taxes`

**DELETE /taxes/{id}** - Delete tax
- Permissions: `delete:taxes`

**POST /taxes/{id}/restore** - Restore deleted tax
- Permissions: `write:taxes`

### Trends & Reports

**GET /trends/sales** - Get sales trends
- Permissions: `read:sales_trends`

**GET /reports/sales** - Get sales reports
- Permissions: `read:sales_reports`

### Search & Suggestions

**GET /suggest** - Search across entities (accounts, items, etc.)
- Returns type-ahead suggestions

## Common Data Models

### Item
```json
{
  "id": "uuid",
  "title": "string",
  "description": "string",
  "tag_price": 1000,  // cents
  "category": "uuid",
  "account": "uuid",
  "inventory_type": "consignment|buy_outright|retail",
  "split": 0.5,  // 0-1
  "quantity": 1,
  "status": "available|sold|returned|donated",
  "location": "uuid",
  "batch": "uuid",
  "created": "2025-01-01T00:00:00Z",
  "sold": "2025-01-01T00:00:00Z",
  "custom_fields": []
}
```

### Sale
```json
{
  "id": "uuid",
  "created": "2025-01-01T00:00:00Z",
  "total": 1000,  // cents
  "subtotal": 900,  // cents
  "tax": 100,  // cents
  "customer": "uuid",  // account id
  "location": "uuid",
  "items": [],
  "payments": [],
  "status": "completed|voided|returned"
}
```

### Account
```json
{
  "id": "uuid",
  "number": "000001",
  "first_name": "string",
  "last_name": "string",
  "company": "string",
  "email": "string",
  "phone_number": "string",
  "balance": 1000,  // cents
  "default_split": 0.5,
  "default_inventory_type": "consignment",
  "is_vendor": true,
  "created": "2025-01-01T00:00:00Z"
}
```

## Pagination

Uses cursor-based pagination:
- `cursor`: Token for next page
- `limit`: Number of results (default varies by endpoint)

Response includes:
```json
{
  "data": [],
  "next_cursor": "token_or_null"
}
```

## Error Codes

- `invalid_request_data` - Bad request (400)
- `invalid_api_key` - Unauthorized (401)
- `access_denied` - Forbidden (403)
- `entity_not_found` - Not found (404)
- `conflict` - Conflict (409)
- `payload_too_large` - Payload too large (413)
- `too_many_requests` - Rate limit exceeded (429)
- `internal_server_error` - Server error (500)

## Currency Format

All monetary amounts are in the smallest denomination (cents for USD):
- $10.00 = 1000
- $0.50 = 50

## Webhooks

ConsignCloud supports webhooks for real-time event notifications. Configure in Settings → Apps → API & Webhooks.

Common webhook events:
- Item created
- Item sold
- Sale completed
- Account balance changed
- Batch submitted
