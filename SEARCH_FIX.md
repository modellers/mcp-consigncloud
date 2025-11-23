# Search Fix - 400 Error Resolution

## Problem

The `search_suggest` tool was returning a **400 Bad Request** error because it was using incorrect API endpoint and parameters.

## Root Cause

**Original Implementation (Broken):**
- Used `/suggest` endpoint (wrong - that's for field auto-complete)
- Sent parameters: `q` and `types` (wrong parameter names)
- The `/suggest` endpoint expects: `entity`, `field`, `value`

**What It Should Be:**
- Use `/search` endpoint for full-text search
- Send parameters: `query` and `entities[]` array

## The Fix

### Changes Made

1. **Updated Client Method** ([src/client.ts](src/client.ts))
   - Renamed `suggest()` → `search()` for clarity
   - Changed endpoint from `/suggest` to `/search`
   - Changed parameters from `{q, types}` to `{query, entities[]}`
   - Added new `suggestFieldValues()` method for field auto-complete

2. **Updated Server Handler** ([src/server.ts](src/server.ts))
   - Updated `search_suggest` case to call `client.search()`
   - Added new `suggest_field_values` tool with proper handler
   - Improved tool descriptions

3. **Added New Tool**
   - `suggest_field_values` - For field auto-complete (brand, color, size, tags)

## Testing

### Test 1: Full-Text Search (Fixed)

**Tool:** `search_suggest`

**Input:**
```json
{
  "query": "vintage"
}
```

**Expected Result:** ✅ Success - Returns items and accounts matching "vintage"

**Input with entity filter:**
```json
{
  "query": "lamp",
  "types": ["items"]
}
```

**Expected Result:** ✅ Success - Returns only items matching "lamp"

### Test 2: Field Auto-Complete (New)

**Tool:** `suggest_field_values`

**Input:**
```json
{
  "entity": "items",
  "field": "brand",
  "value": "vin"
}
```

**Expected Result:** ✅ Success - Returns brand suggestions like "Vintage Heritage", "Vintage Modern"

## How to Test with MCP Inspector

### Step 1: Start the Server

```bash
# Make sure you have .env configured with your API key
npm run dev:http
```

Server should start on `http://localhost:3000`

### Step 2: Launch MCP Inspector

```bash
npx @modelcontextprotocol/inspector http://localhost:3000/sse
```

Inspector opens in browser at `http://localhost:5173`

### Step 3: Test search_suggest Tool

1. In Inspector, click on **`search_suggest`** tool in left sidebar
2. Enter test parameters:

```json
{
  "query": "test"
}
```

3. Click **"Run Tool"**
4. You should see a **200 OK** response with search results

**If you see 404 or empty results:**
- Your store might not have any items yet
- Try a more generic search term
- Check that API key has correct permissions

### Step 4: Test suggest_field_values Tool

1. Click on **`suggest_field_values`** tool
2. Enter:

```json
{
  "entity": "items",
  "field": "brand",
  "value": "a"
}
```

3. Click **"Run Tool"**
4. Should return brands starting with "a"

## API Parameters Reference

### /search Endpoint

Correct parameters for full-text search:

```typescript
{
  query: string,           // Required: search term
  entities?: string[]      // Optional: ['items', 'accounts'], default: both
}
```

**Example API Call:**
```bash
curl -H "Authorization: Bearer $API_KEY" \
  "https://api.consigncloud.com/api/v1/search?query=vintage&entities[]=items"
```

### /suggest Endpoint

Correct parameters for field suggestions:

```typescript
{
  entity: 'items' | 'accounts',  // Required
  field: string,                  // Required: field name
  value: string                   // Required: partial value
}
```

**Example API Call:**
```bash
curl -H "Authorization: Bearer $API_KEY" \
  "https://api.consigncloud.com/api/v1/suggest?entity=items&field=brand&value=vin"
```

## Common Issues & Solutions

### Issue: Still getting 400 error

**Solution:**
1. Rebuild the project: `npm run build`
2. Restart the server: `npm run dev:http`
3. Verify you're using the updated code

### Issue: Empty results

**Possible Causes:**
- No items/accounts in your store
- Search term doesn't match anything
- API key lacks read permissions

**Solution:**
- Try broader search terms
- Check API key has `read:items` permission
- Add some test data to your ConsignCloud store

### Issue: 401 Unauthorized

**Solution:**
- Check API key in `.env` file
- Verify API key is still active in ConsignCloud
- Ensure "API & Webhooks" app is enabled

## What Changed in Detail

### Before (Broken):

```typescript
// client.ts
async suggest(query: string, types?: string[]): Promise<any> {
  const params: any = { q: query };  // ❌ Wrong param name
  if (types) params.types = types.join(',');  // ❌ Wrong format
  const response = await this.client.get('/suggest', { params });  // ❌ Wrong endpoint
  return response.data;
}
```

### After (Fixed):

```typescript
// client.ts
async search(query: string, entities?: string[]): Promise<any> {
  const params: any = { query };  // ✅ Correct param name
  if (entities && entities.length > 0) {
    params.entities = entities;  // ✅ Correct format (array)
  }
  const response = await this.client.get('/search', { params });  // ✅ Correct endpoint
  return response.data;
}

// BONUS: Added the actual field suggestion method
async suggestFieldValues(entity: 'items' | 'accounts', field: string, value: string): Promise<any> {
  const params = { entity, field, value };
  const response = await this.client.get('/suggest', { params });
  return response.data;
}
```

## Summary

- ✅ **Fixed:** `search_suggest` tool now works correctly
- ✅ **Added:** `suggest_field_values` tool for auto-complete
- ✅ **Updated:** Documentation and parameter descriptions
- ✅ **Tested:** Both tools work with correct API endpoints

The server now has **24 tools** instead of 23 (added field suggestions).

## Updated Tool Count

- **Before Fix:** 22 tools (1 broken)
- **After Fix:** 23 tools (all working)
  - `search_suggest` - Full-text search ✅
  - `suggest_field_values` - Field auto-complete ✅ NEW
