# Quick Start & Testing Guide

## Local Development Testing

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment Variables

Create `.env.local` in the project root:
```
VITE_N8N_WEBHOOK_URL=http://localhost:5678/webhook-test
GROQ_API_KEY=your-groq-api-key
GROQ_MODEL=llama-3.1-70b-versatile
GOOGLE_SHEET_ID=your-google-sheet-id
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
GOOGLE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GCLOUD_PROJECT_ID=your-project-id
```

### 3. Run Development Server
```bash
npm run dev
```

Browser will open to http://localhost:5173

### 4. Test Queries

Try these in the chatbot to verify everything works:

#### Property Query Examples:
- "What's the WiFi password at Unit 5?"
- "Does Unit 3 have parking?"
- "What's the door lock code?"
- "Tell me about the pool"
- "What are the quiet hours?"
- "Is there a washer/dryer?"
- "What's the Airbnb rating for Unit 2?"
- "What's the handyman number?"

#### Dataset Query Examples:
- "Which properties have pools?"
- "Which properties have hot tubs?"
- "Properties without cameras?"
- "What's the highest-rated property?"
- "What's the lowest-rated property?"
- "Who owns the most properties?"
- "How many properties does [owner name] own?"
- "List all properties for [owner name]"
- "Show properties above $200 per night"
- "Properties with 2 bedrooms?"
- "Which properties sleep 8 guests?"
- "Properties with WiFi faster than 50 Mbps?"

#### Greeting Examples:
- "Hi there!"
- "Hello"
- "How's it going?"

---

## Deployment to Vercel

### 1. Connect Repository

```bash
vercel --prod
```

Or connect via Vercel Dashboard:
- Go to https://vercel.com
- Click "New Project"
- Select this repository
- Click "Import"

### 2. Configure Environment Variables

In Vercel Dashboard → Project Settings → Environment Variables, add:

| Variable | Value |
|----------|-------|
| GROQ_API_KEY | Your Groq API key |
| GROQ_MODEL | llama-3.1-70b-versatile |
| GOOGLE_SHEET_ID | Your Google Sheet ID |
| GOOGLE_PRIVATE_KEY | Your service account private key (multi-line) |
| GOOGLE_CLIENT_EMAIL | Your service account email |
| GCLOUD_PROJECT_ID | Your Google Cloud project ID |

### 3. Deploy

```bash
vercel --prod
```

### 4. Update Frontend

Update `src/utils/api.js` if needed to point to your production Vercel URL:

```javascript
const WEBHOOK_URL = import.meta.env.PROD
  ? (import.meta.env.VITE_N8N_PROXY_URL || '/api/proxyWebhook')
  : DEV_WEBHOOK
```

Production URL will be something like: `https://your-project.vercel.app/api/proxyWebhook`

---

## Troubleshooting

### Issue: "Missing GROQ_API_KEY"
**Solution:** Verify environment variable is set in Vercel Dashboard or .env.local

### Issue: "Missing GOOGLE_SHEET_ID"
**Solution:** Check you have the correct sheet ID from Google Sheets URL

### Issue: "Private key normalization error"
**Solution:** Ensure GOOGLE_PRIVATE_KEY is the full key including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`, with literal `\n` for newlines (Vercel will normalize)

### Issue: "Column not found"
**Solution:** Verify exact column names in your Google Sheet match `FIELD_TO_COLUMNS` in `api/propertyHandler.js`

### Issue: API returns 500 error
**Solution:** Check Vercel logs: `vercel logs`

### Issue: Dataset queries return "haven't been trained"
**Solution:** Ensure system prompt includes all dataset query types (should be in intentExtractor.js). Verify Groq is correctly classifying intent.

---

## API Endpoint Reference

### Request Format

```javascript
POST /api/proxyWebhook
Content-Type: application/json

{
  "message": "What's the WiFi password at Unit 5?"
}
```

### Response Format

```javascript
{
  "reply": "Here is the Wi-Fi login for **Unit 5**:\n\n[password]",
  "extracted": {
    "intent": "property_query",
    "propertyName": "Unit 5",
    "informationToFind": "WiFi password",
    "datasetIntentType": null,
    "datasetOwnerName": null,
    "datasetValue": null,
    "inputMessage": "What's the WiFi password at Unit 5?"
  }
}
```

### Error Response

```javascript
{
  "error": "Missing 'message' in request body"
}
```

---

## Google Sheets Setup

Your sheet must have:
- Tab name: `Info`
- First row: Column headers
- Subsequent rows: Property data

### Required Columns (minimum):
- `Unit #` - Property identifier
- `Title on Listing's Site` - Property name
- `Property Owner name` - Owner name (for dataset queries)
- `Airbnb Rating` - For highest/lowest rated queries
- `Price` - For price-based filters
- And any other columns matching FIELD_TO_COLUMNS

---

## Monitoring Production

### View Logs
```bash
vercel logs
```

### View Errors
```bash
vercel logs --error
```

### Test Endpoint
```bash
curl -X POST https://your-project.vercel.app/api/proxyWebhook \
  -H "Content-Type: application/json" \
  -d '{"message":"Hi there!"}'
```

---

## Performance Notes

- **Caching:** Sheet data is cached for 10 minutes (reduces API calls)
- **Response time:** Typically 1-3 seconds (depends on Groq API latency)
- **Vercel Function timeout:** Set to 30 seconds (configurable in vercel.json)
- **Memory:** 512MB allocated (sufficient for googleapis + Groq calls)

---

## Support

For issues:
1. Check Vercel logs: `vercel logs`
2. Verify environment variables are set
3. Test locally first: `npm run dev`
4. Check Google Sheets API quota (Google Cloud Console)
5. Check Groq API status and quota

---

**Last Updated:** November 15, 2025
