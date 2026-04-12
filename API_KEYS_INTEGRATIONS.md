# 🔑 API Keys & Integration Credentials
## Shehnai Wedding Planning Platform

**⚠️ SECURITY WARNING:** This document contains sensitive API keys. **DO NOT** commit this file to public repositories. Add to `.gitignore` immediately.

**Last Updated:** December 2024  
**Status:** Current as of latest codebase scan

---

## 🤖 AI SERVICES

### 1. Google Gemini API
**Purpose:** AI wedding blueprint generation, chat assistant, vendor recommendations

**API Key:**
```
REDACTED_GEMINI_KEY
```

**Usage Locations:**
- `production_wedding_agents_gemini.py` (line 30)
- `react-frontend/src/services/gemini_service.ts` (line 26)
- `react-frontend/src/services/ai_assistant_service.ts` (line 46)
- `react-frontend/src/services/wedding_blueprint_service.ts` (line 168)

**Base URL:**
```
https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent
```

**Image Generation URL (Imagen 4.0):**
```
https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-preview:generateContent
```

**Environment Variable:**
```bash
GEMINI_API_KEY=REDACTED_GEMINI_KEY
REACT_APP_GEMINI_API_KEY=REDACTED_GEMINI_KEY  # Frontend
```

**Rate Limits:**
- Model: gemini-2.0-flash
- Cost: $0.35 per 1M tokens
- Current usage: ~$0.0175 per blueprint generation

---

## 🔍 SEARCH & VENDOR DISCOVERY

### 2. Serper API
**Purpose:** Vendor search, web scraping for vendor information

**API Key:**
```
44f3982e40a663fc992acb96f7763f3c9f79bed7
```

**Usage Locations:**
- `config/api_config.py` (line 75, 79)
- `enhanced_serper_api.py` (line 36)
- `unified_wedding_server.py` (line 36)

**Base URLs:**
```
Search: https://google.serper.dev/search
Images: https://google.serper.dev/images
```

**Environment Variable:**
```bash
SERPER_API_KEY=44f3982e40a663fc992acb96f7763f3c9f79bed7
```

**Rate Limits:**
- Free tier: 2,500 searches/month
- Paid: Based on subscription

---

## 🗺️ GOOGLE SERVICES

### 3. Google Maps/Places API
**Purpose:** Location search, venue discovery, directions, geocoding

**API Key:**
```
REDACTED_GOOGLE_MAPS_KEY
```

**Usage Locations:**
- `react-frontend/src/config/google_config.ts` (lines 4, 21)
- `react-frontend/src/services/google_maps_service.ts` (line 3)
- `react-frontend/src/components/GooglePlacesInput.tsx` (line 148)
- `react-frontend/src/components/SmartLocationInput.tsx` (line 104)
- `unified_wedding_server.py` (line 51)

**Environment Variable:**
```bash
GOOGLE_API_KEY=REDACTED_GOOGLE_MAPS_KEY
REACT_APP_GOOGLE_API_KEY=REDACTED_GOOGLE_MAPS_KEY  # Frontend
REACT_APP_GOOGLE_MAPS_API_KEY=REDACTED_GOOGLE_MAPS_KEY  # Frontend Maps
```

**Enabled APIs Required:**
- Maps JavaScript API
- Places API
- Geocoding API
- Directions API
- Distance Matrix API

**Script Load:**
```html
<script src="https://maps.googleapis.com/maps/api/js?key=REDACTED_GOOGLE_MAPS_KEY&libraries=places"></script>
```

**Endpoints:**
```
Geocoding: https://maps.googleapis.com/maps/api/geocode/json
Places: https://maps.googleapis.com/maps/api/place
Directions: https://maps.googleapis.com/maps/api/directions/json
Distance Matrix: https://maps.googleapis.com/maps/api/distancematrix/json
```

---

### 4. Google OAuth (Calendar & Gmail)
**Purpose:** Google Calendar integration, Gmail vendor communications

**Client ID:**
```
REDACTED_GOOGLE_CLIENT_ID
```

**Client Secret:**
```
REDACTED_GOOGLE_CLIENT_SECRET
```

**Usage Locations:**
- `react-frontend/src/config/google_config.ts` (lines 4-6)

**Environment Variables:**
```bash
GOOGLE_CLIENT_ID=REDACTED_GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=REDACTED_GOOGLE_CLIENT_SECRET

REACT_APP_GOOGLE_CLIENT_ID=REDACTED_GOOGLE_CLIENT_ID  # Frontend
REACT_APP_GOOGLE_CLIENT_SECRET=REDACTED_GOOGLE_CLIENT_SECRET  # Frontend (use server-side only)
```

**OAuth Scopes:**
```
https://www.googleapis.com/auth/calendar
https://www.googleapis.com/auth/calendar.events
https://www.googleapis.com/auth/gmail.send
https://www.googleapis.com/auth/gmail.readonly
https://www.googleapis.com/auth/gmail.compose
https://www.googleapis.com/auth/userinfo.profile
https://www.googleapis.com/auth/userinfo.email
```

**Discovery Docs:**
```
https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest
https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest
```

**API Endpoints:**
```
Calendar Events: https://www.googleapis.com/calendar/v3/calendars/primary/events
Calendar List: https://www.googleapis.com/calendar/v3/users/me/calendarList
Gmail Messages: https://www.googleapis.com/gmail/v1/users/me/messages
Gmail Send: https://www.googleapis.com/gmail/v1/users/me/messages/send
```

---

## 💾 DATABASE

### 5. NocoDB API
**Purpose:** Database operations, data storage

**API Token:**
```
-h-Q9hbkAgU2DsSqXsRligOG1Qzpgb4OAx_QGwHk
```

**Base URL:**
```
http://localhost:8080  # Development
```

**Project ID:**
```
p2manqkz6afk3ma
```

**Workspace ID:**
```
w6gi3jq7  # Default
```

**Usage Locations:**
- `config/api_config.py` (line 41)
- `config/nocodb_config.py` (line 23, 48)
- `fixed_nocodb_api.py` (line 10)

**Environment Variables:**
```bash
NOCODB_BASE_URL=http://localhost:8080
NOCODB_API_TOKEN=-h-Q9hbkAgU2DsSqXsRligOG1Qzpgb4OAx_QGwHk
NOCODB_PROJECT_ID=p2manqkz6afk3ma
NOCODB_WORKSPACE_ID=w6gi3jq7
```

**Table IDs:**
```python
{
    "couples": "mcv14lxgtp3rwa5",
    "weddings": "mslkrxqymrbe01d",
    "preferences": "mx7nrptxiiqbsty",
    "venues": "m8o47zj6gmkmguz",
    "vendors": "mpw9em3omtlqlsg"
}
```

**API Structure:**
```
GET/POST: {BASE_URL}/api/v2/tables/{TABLE_ID}/records
PATCH: {BASE_URL}/api/v2/tables/{TABLE_ID}/records/{RECORD_ID}
DELETE: {BASE_URL}/api/v2/tables/{TABLE_ID}/records/{RECORD_ID}
```

**Headers:**
```python
{
    "xc-token": "-h-Q9hbkAgU2DsSqXsRligOG1Qzpgb4OAx_QGwHk",
    "Content-Type": "application/json"
}
```

---

## 📝 ENVIRONMENT VARIABLES SUMMARY

### Backend (.env)
```bash
# AI Services
GEMINI_API_KEY=REDACTED_GEMINI_KEY
OPENAI_API_KEY=  # Optional fallback (not configured)

# Search Services
SERPER_API_KEY=44f3982e40a663fc992acb96f7763f3c9f79bed7

# Google Services
GOOGLE_API_KEY=REDACTED_GOOGLE_MAPS_KEY
GOOGLE_CLIENT_ID=REDACTED_GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=REDACTED_GOOGLE_CLIENT_SECRET

# Database
NOCODB_BASE_URL=http://localhost:8080
NOCODB_API_TOKEN=-h-Q9hbkAgU2DsSqXsRligOG1Qzpgb4OAx_QGwHk
NOCODB_PROJECT_ID=p2manqkz6afk3ma
NOCODB_WORKSPACE_ID=w6gi3jq7
```

### Frontend (.env)
```bash
# AI Services
REACT_APP_GEMINI_API_KEY=REDACTED_GEMINI_KEY

# Google Services
REACT_APP_GOOGLE_API_KEY=REDACTED_GOOGLE_MAPS_KEY
REACT_APP_GOOGLE_MAPS_API_KEY=REDACTED_GOOGLE_MAPS_KEY
REACT_APP_GOOGLE_CLIENT_ID=REDACTED_GOOGLE_CLIENT_ID

# Note: Client Secret should NEVER be in frontend .env
# Use backend API for OAuth flows
```

---

## 🔒 SECURITY RECOMMENDATIONS

### ✅ IMMEDIATE ACTIONS REQUIRED:

1. **Rotate Exposed Keys:**
   - ⚠️ **CRITICAL:** API keys are hardcoded in multiple files
   - Move all keys to environment variables
   - Rotate keys that have been exposed in commits

2. **Environment Variable Management:**
   - Create `.env` files (already should exist)
   - Add `.env*` to `.gitignore`
   - Use secrets management (AWS Secrets Manager, Vault, etc.) for production

3. **Key Restrictions:**
   - **Google API Key:** Add HTTP referrer restrictions (domain whitelist)
   - **Google API Key:** Restrict to specific APIs (Maps, Places only)
   - **Gemini API Key:** Add IP restrictions if possible
   - **Serper API Key:** Monitor usage for anomalies

4. **Code Cleanup:**
   - Remove hardcoded keys from all source files
   - Use environment variables only
   - Add validation to fail fast if keys missing

---

## 📊 API USAGE & COSTS

### Current Monthly Estimates (100 users):

| Service | Usage | Cost |
|---------|-------|------|
| **Google Gemini** | ~5,000 blueprint generations @ 50K tokens each | ~$0.88/month |
| **Serper API** | ~10,000 vendor searches | Free tier (2,500/month) or $50/month |
| **Google Maps API** | ~20,000 requests | $100-200/month (first $200 free) |
| **Google Calendar/Gmail** | ~1,000 API calls | Free (within quota) |
| **NocoDB** | Self-hosted | $0 (or cloud ~$20/month) |

**Total Estimated Cost:** $150-300/month at 100 users

---

## 🧪 TESTING API KEYS

### Verify Gemini API:
```bash
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=REDACTED_GEMINI_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"contents":[{"parts":[{"text":"Hello"}]}]}'
```

### Verify Serper API:
```bash
curl "https://google.serper.dev/search" \
  -H 'X-API-KEY: 44f3982e40a663fc992acb96f7763f3c9f79bed7' \
  -H 'Content-Type: application/json' \
  -d '{"q":"wedding venues Mumbai"}'
```

### Verify Google Maps API:
```bash
curl "https://maps.googleapis.com/maps/api/geocode/json?address=Mumbai&key=REDACTED_GOOGLE_MAPS_KEY"
```

### Verify NocoDB API:
```bash
curl "http://localhost:8080/api/v2/tables/mcv14lxgtp3rwa5/records" \
  -H 'xc-token: -h-Q9hbkAgU2DsSqXsRligOG1Qzpgb4OAx_QGwHk'
```

---

## 📋 KEY ROTATION CHECKLIST

### When Rotating Keys:

- [ ] Update environment variables in all environments
- [ ] Update hardcoded fallback values (temporary)
- [ ] Test all integrations after rotation
- [ ] Monitor API usage for anomalies
- [ ] Update documentation
- [ ] Notify team members
- [ ] Revoke old keys after verification period

---

## 🔗 KEY MANAGEMENT LINKS

### Google Cloud Console:
- API Keys: https://console.cloud.google.com/apis/credentials
- OAuth Client: https://console.cloud.google.com/apis/credentials/oauthclient
- API Dashboard: https://console.cloud.google.com/apis/dashboard

### Gemini API:
- API Key: https://makersuite.google.com/app/apikey
- Usage Dashboard: https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com

### Serper API:
- Dashboard: https://serper.dev/dashboard
- API Docs: https://serper.dev/docs

### NocoDB:
- Self-hosted instance: http://localhost:8080
- API Docs: https://docs.nocodb.com/

---

## ⚠️ MISSING/PLANNED INTEGRATIONS

### Not Yet Configured:

1. **OpenAI API** (Fallback)
   - Environment variable placeholder exists
   - Not currently used
   - Would need: `OPENAI_API_KEY=sk-...`

2. **Anthropic Claude API** (Fallback)
   - Not configured
   - Would need: `ANTHROPIC_API_KEY=sk-ant-...`

3. **WhatsApp Business API**
   - Mentioned in PRD
   - Not configured
   - Would need: WhatsApp Business Account setup

4. **Payment Gateway** (Stripe/Razorpay)
   - Not configured
   - Future requirement for paid features

5. **SMS Service** (Twilio/AWS SNS)
   - Not configured
   - For notifications/RSVPs

6. **Cloud Storage** (AWS S3/Google Cloud Storage)
   - Not configured
   - For image/file uploads

---

**END OF DOCUMENT**

**⚠️ REMEMBER:** This file contains sensitive credentials. Never commit to version control!

