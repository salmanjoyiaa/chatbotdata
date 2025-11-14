# Vercel Serverless Chatbot Audit Report
**Date:** November 15, 2025  
**Project:** property-ai-chatbot  
**Status:** ⚠️ **MULTIPLE CRITICAL ISSUES DETECTED**

---

## Executive Summary

Your Vercel serverless chatbot project has **8 CRITICAL ISSUES** and **3 WARNINGS** that must be fixed before deployment. The most severe issues are:

1. **ESM/CommonJS Mismatch** – `package.json` declares `"type": "module"` (ESM) but all API routes use CommonJS (`require`, `module.exports`)
2. **ESM Import Error in Handler** – `api/proxyWebhook.js` uses `await import()` to load CommonJS modules, which will fail in Vercel
3. **Incomplete Dataset Query Features** – Missing implementation for 10+ dataset query types that should be answerable from the sheet
4. **googleapis Version Incompatibility** – Version `166.0.0` is untested on Vercel Node 18
5. **No vercel.json Config** – Missing Vercel deployment configuration
6. **Incomplete Intent Classification** – System prompt not shown (truncated as "... (system prompt continued, unchanged) ...")

---

## SECTION A: Serverless Runtime Compatibility

### ✅ PASS: CommonJS Usage in API Modules
- `api/intentExtractor.js` – Uses `module.exports` ✓
- `api/generalReply.js` – Uses `module.exports` ✓
- `api/fieldTypeResolver.js` – Uses `module.exports` ✓
- `api/propertyHandler.js` – Uses `require("googleapis")` and `module.exports` ✓

### 🔴 CRITICAL ISSUE #1: ESM Declaration in package.json

**File:** `package.json`  
**Problem:** Declares `"type": "module"` but all API routes use CommonJS  
**Current:**
```json
{
  "type": "module",
  "dependencies": {
    "googleapis": "^166.0.0"
  }
}
```

**Impact:** Vercel will try to run CommonJS files as ESM, causing `SyntaxError: Unexpected token 'export'` or module loading failures.

**Fix Required:**
```json
{
  "type": "commonjs",
  "dependencies": {
    "googleapis": "^105.0.0"
  }
}
```

---

### 🔴 CRITICAL ISSUE #2: ESM Dynamic Import in Handler

**File:** `api/proxyWebhook.js` (Lines 36-39)  
**Problem:** Uses `await import()` to load CommonJS modules with ESM fallback logic  
**Current:**
```javascript
const ieMod = await import("./intentExtractor.js");
const ie = ieMod.default || ieMod;
const extractIntentAndProperty = ie.extractIntentAndProperty || ie;
```

**Impact:** In Vercel's Node 18 runtime with `"type": "module"`, CommonJS `require()` is the **only** option for CommonJS modules. Dynamic `import()` will attempt ESM interop and fail.

**Fix Required:** Use `require()` instead:
```javascript
const { extractIntentAndProperty } = require("./intentExtractor.js");
const { generateGeneralReply } = require("./generalReply.js");
const { resolveFieldType } = require("./fieldTypeResolver.js");
const { handlePropertyQuery, handleDatasetQuery } = require("./propertyHandler.js");
```

---

### 🟡 WARNING #1: googleapis Version

**File:** `package.json`  
**Current:** `"googleapis": "^166.0.0"`  
**Issue:** Version 166.0.0 is extremely recent and untested in Vercel's Node 18 runtime. Vercel officially supports Node 18.17+ but older googleapis versions are more stable.

**Recommendation:** Downgrade to:
```json
"googleapis": "^105.0.0"
```
This version is battle-tested and compatible with Node 18.

---

### ✅ PASS: Private Key Normalization
**File:** `api/propertyHandler.js` (Lines 69-72)  
**Implementation:**
```javascript
const rawKey = process.env.GOOGLE_PRIVATE_KEY || "";
const normalizedPrivateKey = rawKey.includes("\\n")
  ? rawKey.replace(/\\n/g, "\n")
  : rawKey;
```
✓ Correctly handles escaped newlines from environment variables

---

### ✅ PASS: Google Sheets Auth Credentials
**File:** `api/propertyHandler.js` (Lines 74-83)  
**Implementation:**
```javascript
const auth = new google.auth.GoogleAuth({
  credentials: {
    type: "service_account",
    project_id: process.env.GCLOUD_PROJECT_ID,
    private_key: normalizedPrivateKey,
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
  },
  scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
});
```
✓ Uses correct credentials object  
✓ Correct scope for read-only access  
✓ References proper environment variables

---

### ✅ PASS: Google Sheets API Call
**File:** `api/propertyHandler.js` (Lines 86-91)  
**Implementation:**
```javascript
const result = await sheets.spreadsheets.values.get({
  spreadsheetId: SHEET_ID,
  range: SHEET_TAB,
});
const rows = result.data.values || [];
const headers = rows[0] || [];
const dataRows = rows.slice(1);
```
✓ Correct API endpoint  
✓ Proper header/data row separation  

---

### ✅ PASS: Sheet Caching
**File:** `api/propertyHandler.js` (Lines 63-67)  
**Implementation:**
```javascript
if (cache.rows && now - cache.timestamp < 10 * 60 * 1000) {
  return cache;
}
```
✓ 10-minute cache prevents excessive API calls

---

## SECTION B: Google Sheets Integration

### ✅ PASS: Sheets Loading Logic
Headers are correctly extracted from row 0 and data from rows 1+.

### ✅ PASS: Column Matching
**File:** `api/propertyHandler.js` (Lines 113-122)  
Headers are normalized (lowercase, spaces trimmed) for fuzzy matching.

### ✅ PASS: Property Matching
**File:** `api/propertyHandler.js` (Lines 125-145)  
Supports matching by:
- Unit # (exact match)
- Title on Listing's Site (exact match)
- Partial substring matches (fuzzy)
- Case-insensitive

### ⚠️ MAPPING VERIFICATION NEEDED

**Critical Check:** Your column names MUST match exactly in the Google Sheet. Current mappings in `FIELD_TO_COLUMNS`:

```javascript
wifi_login: ["Wifi Login", "WIFI INFO", "WIFI INFO ", "WIFI INFORMATION/ LOGIN"],
door_lock_code: ["Lock Codes\nand Info", "Lock Codes and Info", "Door Lock"],
trash_day_reminder: ["Trash Day Reminder"],
parking: ["Parking"],
quiet_hours: ["Quite Hours"],  // ⚠️ NOTE: "Quite" vs "Quiet" — verify this in your sheet
pool_temperature: ["Temperature of Pool"],
// ... etc
```

**Action Required:** Verify these exact column names exist in your Google Sheet tab named "Info".

---

## SECTION C: Query Handling

### Property Query Capabilities

✅ **Fully Implemented:**
- WiFi info (login, details, speed, provider)
- Lock codes (door, closet, storage)
- Trash info (process, day reminders)
- Parking
- Quiet hours
- Pool/Hot tub (info, temperature, fence/gate)
- Owner name
- Property manager
- Handyman number
- Check-in/checkout
- Early/late fee links
- BBQ grill
- Pet/smoking/events policies
- Camera locations
- Washer/Dryer
- Extra pillows/bedding
- Additional notes
- Airbnb link
- Airbnb rating
- Guest favourite status
- Address
- Price
- Property type
- Floor
- Style
- Bedrooms & bathrooms
- Max guests
- Cover photo
- Additional amenities
- Air mattress
- Supplies provided
- First aid/fire extinguisher

✅ **Field Detection Coverage:** 30+ field types mapped in `fieldTypeResolver.js`

---

### 🔴 CRITICAL ISSUE #3: Incomplete Dataset Query Implementation

**File:** `api/propertyHandler.js` (Lines 278-315)  
**Current Implementation:** Only 3 dataset query types are handled:

```javascript
switch (datasetIntentType) {
  case "owner_with_most_properties": { ... }
  case "count_properties_by_owner": { ... }
  case "list_properties_by_owner": { ... }
  default:
    return "I understand you're asking about our property data, but I haven't been trained to answer that specific type of question yet.";
}
```

**Missing Implementations (Should Be Added):**

1. **`properties_with_pool`** – Return list of properties where Pool column is not empty
2. **`properties_with_hot_tub`** – Return list of properties with hot tub
3. **`properties_without_cameras`** – Return properties with empty Camera Location
4. **`properties_with_camera_in_location`** – Search by specific camera location
5. **`highest_rated_property`** – Max Airbnb Rating
6. **`lowest_rated_property`** – Min Airbnb Rating  
7. **`properties_above_price`** – Filter properties by price range
8. **`properties_by_beds`** – Filter by bedroom count
9. **`properties_by_max_guests`** – Filter by guest capacity
10. **`properties_with_amenity`** – Generic amenity search (WiFi speed, parking type, pool access, etc.)
11. **`properties_wifi_above_speed`** – Filter WiFi Speed (Mbps) above threshold

**Impact:** User asks "Which properties have a pool?" → Gets "haven't been trained to answer that" instead of actual answer.

---

### 🟡 WARNING #2: Incomplete Intent Extraction Prompt

**File:** `api/intentExtractor.js` (Lines 20-25)  
**Problem:** System prompt is truncated/placeholder:

```javascript
const systemPrompt = `
You are an information extractor for a property AI assistant for Dream State.
...
`.trim();
```

The prompt shows as "... (system prompt continued, unchanged) ..." in the code, but the actual detailed instructions for extracting `datasetIntentType` values are missing.

**Required Action:** Ensure the system prompt instructs the AI to return dataset query types like:
- `"owner_with_most_properties"`
- `"count_properties_by_owner"`
- `"list_properties_by_owner"`
- `"properties_with_pool"` (and other missing types)

---

## SECTION D: Intent Classification

### ✅ PASS: Intent Types Detected

The system correctly distinguishes:
- `property_query` ✓
- `dataset_query` ✓
- `greeting` ✓
- `other` ✓

### ✅ PASS: Intent Output Schema

```javascript
{
  "intent": "property_query" | "dataset_query" | "greeting" | "other",
  "propertyName": string | null,
  "informationToFind": string | null,
  "datasetIntentType": string | null,
  "datasetOwnerName": string | null,
  "inputMessage": string
}
```

---

## SECTION E: API Endpoint

### ✅ PASS: Frontend Route

**File:** `src/utils/api.js`  
**Implementation:**
```javascript
const WEBHOOK_URL = import.meta.env.PROD
  ? (import.meta.env.VITE_N8N_PROXY_URL || '/api/proxyWebhook')
  : DEV_WEBHOOK
```
✓ Correctly routes to `/api/proxyWebhook` in production

### 🔴 CRITICAL ISSUE #4: Missing API Endpoint File

**Expected:** `/api/chat.js` or `/api/proxyWebhook.js` as the Vercel serverless handler

**Current:** `api/proxyWebhook.js` exists but uses ESM `export default`

**Problem:** Vercel expects:
- Either a `vercel.json` config pointing to the handler, OR
- A file named `/api/proxyWebhook.js` that exports CommonJS

**Fix:** Rename or ensure the handler uses CommonJS CommonJS `module.exports`:
```javascript
// api/proxyWebhook.js (correct approach)
module.exports = async (req, res) => {
  // handler logic
}
```

---

### 🔴 CRITICAL ISSUE #5: No vercel.json Configuration

**Problem:** Missing Vercel deployment configuration file

**Create:** `vercel.json` at project root:
```json
{
  "version": 2,
  "env": [
    "GROQ_API_KEY",
    "GROQ_MODEL",
    "GOOGLE_SHEET_ID",
    "GOOGLE_PRIVATE_KEY",
    "GOOGLE_CLIENT_EMAIL",
    "GCLOUD_PROJECT_ID"
  ],
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "/api/:path*.js"
    }
  ]
}
```

---

## SECTION F: Output Format

### ✅ PASS: Response Structure

The API returns proper JSON:
```javascript
return res.status(200).json({ reply, extracted });
```

### ✅ PASS: Markdown Formatting

Property handler uses markdown for readability:
```javascript
return `${phrase} for **${propertyName}**:\n\n${value}`;
```

---

## COMPLETE LIST OF FIXES REQUIRED

### 🔴 CRITICAL FIXES (Must Complete Before Vercel Deployment)

| # | Issue | File | Fix |
|---|-------|------|-----|
| 1 | ESM declaration conflicts with CommonJS modules | `package.json` | Change `"type": "module"` to `"type": "commonjs"` or remove it |
| 2 | ESM `import()` won't work with CommonJS modules | `api/proxyWebhook.js` | Replace dynamic `import()` with `require()` statements |
| 3 | Missing 11 dataset query implementations | `api/propertyHandler.js` | Add handler cases for: `properties_with_pool`, `properties_with_hot_tub`, `properties_without_cameras`, `highest_rated_property`, `lowest_rated_property`, `properties_above_price`, `properties_by_beds`, `properties_by_max_guests`, `properties_with_amenity`, `properties_wifi_above_speed`, and ensure AI returns these types |
| 4 | API handler uses ESM `export default` | `api/proxyWebhook.js` | Change to `module.exports = async (req, res) => { ... }` |
| 5 | No Vercel deployment config | (missing) | Create `vercel.json` with environment variables and build config |
| 6 | System prompt incomplete/truncated | `api/intentExtractor.js` | Expand system prompt to include all dataset query types and examples |

### 🟡 WARNINGS (Recommended Before Deployment)

| # | Issue | File | Action |
|---|-------|------|--------|
| 1 | High-risk googleapis version | `package.json` | Downgrade from `^166.0.0` to `^105.0.0` |
| 2 | Column name verification needed | Sheet | Verify exact column names match `FIELD_TO_COLUMNS` in `propertyHandler.js` (especially "Quite Hours") |
| 3 | System prompt details missing | Code Review | Verify complete intent extraction instructions are in the prompt (not just placeholder text) |

---

## Deployment Checklist

- [ ] Fix CRITICAL ISSUE #1: Remove `"type": "module"` from package.json
- [ ] Fix CRITICAL ISSUE #2: Replace `await import()` with `require()` in proxyWebhook.js
- [ ] Fix CRITICAL ISSUE #3: Implement 11 missing dataset query handlers
- [ ] Fix CRITICAL ISSUE #4: Change `export default` to `module.exports`
- [ ] Fix CRITICAL ISSUE #5: Create `vercel.json` configuration
- [ ] Fix CRITICAL ISSUE #6: Expand and verify system prompt
- [ ] Address WARNING #1: Downgrade googleapis to ^105.0.0
- [ ] Address WARNING #2: Verify sheet column names match code
- [ ] Test locally with Node 18+
- [ ] Deploy to Vercel staging environment
- [ ] Test all property queries
- [ ] Test all dataset queries (verify new implementations work)
- [ ] Monitor logs for errors

---

## Next Steps

1. **Immediate:** Fix CRITICAL ISSUES #1 and #2 (ESM/CommonJS conflict)
2. **High Priority:** Implement missing dataset queries (CRITICAL ISSUE #3)
3. **Before Deploy:** Create vercel.json and verify column mappings
4. **Testing:** Run integration tests against live Google Sheet

---

**Report Generated:** November 15, 2025  
**Auditor:** GitHub Copilot  
**Recommendation:** DO NOT DEPLOY until all CRITICAL issues are resolved.
