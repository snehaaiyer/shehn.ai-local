# 🔑 API Keys - Quick Reference
## Shehnai Wedding Planning Platform

**Last Updated:** December 2024

---

## ✅ ALL API KEYS

### 1. GEMINI_API_KEY
**For:** AI wedding blueprint generation and chat

```
REDACTED_GEMINI_KEY
```

**Usage:**
- Wedding blueprint generation (CrewAI agents)
- AI chat assistant
- Vendor recommendation intelligence
- Theme image generation

---

### 2. SERPER_API_KEY
**For:** Vendor search and discovery

```
44f3982e40a663fc992acb96f7763f3c9f79bed7
```

**Usage:**
- Web search for vendor information
- Vendor contact extraction
- Vendor image search
- Real-time vendor discovery

---

### 3. GOOGLE_API_KEY
**For:** Google Maps, Places, and location services

```
REDACTED_GOOGLE_MAPS_KEY
```

**Usage:**
- Google Maps integration
- Places API (location search)
- Geocoding (address to coordinates)
- Directions API
- Distance Matrix API

---

### 4. GOOGLE_CLIENT_ID
**For:** Google Calendar and Gmail integration

```
REDACTED_GOOGLE_CLIENT_ID
```

**Usage:**
- OAuth authentication
- Google Calendar event creation
- Gmail API for vendor communications
- User profile access

---

### 5. GOOGLE_CLIENT_SECRET
**For:** Google OAuth authentication

```
REDACTED_GOOGLE_CLIENT_SECRET
```

**Usage:**
- OAuth token exchange
- Secure authentication flows
- Backend API authentication

**⚠️ SECURITY WARNING:** Never expose client secret in frontend code!

---

### 6. NOCODB_API_TOKEN
**For:** Database operations

```
-h-Q9hbkAgU2DsSqXsRligOG1Qzpgb4OAx_QGwHk
```

**Usage:**
- Database CRUD operations
- Wedding data storage
- Vendor data management
- User preferences storage

**Additional NocoDB Config:**
- Base URL: `http://localhost:8080`
- Project ID: `p2manqkz6afk3ma`
- Workspace ID: `w6gi3jq7`

---

## 📋 ENVIRONMENT VARIABLES FORMAT

### Backend (.env)
```bash
# AI Services
GEMINI_API_KEY=REDACTED_GEMINI_KEY

# Search Services
SERPER_API_KEY=44f3982e40a663fc992acb96f7763f3c9f79bed7

# Google Services
GOOGLE_API_KEY=REDACTED_GOOGLE_MAPS_KEY
GOOGLE_CLIENT_ID=REDACTED_GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=REDACTED_GOOGLE_CLIENT_SECRET

# Database
NOCODB_API_TOKEN=-h-Q9hbkAgU2DsSqXsRligOG1Qzpgb4OAx_QGwHk
NOCODB_BASE_URL=http://localhost:8080
NOCODB_PROJECT_ID=p2manqkz6afk3ma
```

### Frontend (.env)
```bash
# AI Services (Frontend)
REACT_APP_GEMINI_API_KEY=REDACTED_GEMINI_KEY

# Google Services (Frontend)
REACT_APP_GOOGLE_API_KEY=REDACTED_GOOGLE_MAPS_KEY
REACT_APP_GOOGLE_MAPS_API_KEY=REDACTED_GOOGLE_MAPS_KEY
REACT_APP_GOOGLE_CLIENT_ID=REDACTED_GOOGLE_CLIENT_ID

# Note: GOOGLE_CLIENT_SECRET should NEVER be in frontend .env
# Use backend API for OAuth flows
```

---

## 🚀 QUICK SETUP

### 1. Backend Setup
Create `.env` file in project root:
```bash
cp .env.example .env  # If example exists
```

Or create manually:
```bash
# Add all backend environment variables listed above
```

### 2. Frontend Setup
Create `.env` file in `react-frontend/` directory:
```bash
cd react-frontend
cp .env.example .env  # If example exists
```

Or create manually:
```bash
# Add all frontend environment variables listed above
```

### 3. Verify Setup
```bash
# Backend
python -c "import os; from dotenv import load_dotenv; load_dotenv(); print('Gemini:', os.getenv('GEMINI_API_KEY')[:10] + '...')"

# Frontend (after npm install)
npm run start
```

---

## ⚠️ SECURITY CHECKLIST

- [ ] All keys moved to environment variables
- [ ] Hardcoded keys removed from source code
- [ ] `.env` files added to `.gitignore`
- [ ] API keys restricted in provider dashboards (Google Cloud Console, etc.)
- [ ] Production keys different from development keys
- [ ] Keys rotated after any exposure
- [ ] Client secret never in frontend code

---

**END OF QUICK REFERENCE**

