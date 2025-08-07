# Quick Start Guide - Wedding AI Assistant

## 🚀 Getting Started

Your wedding planner application is now ready to run with Cloudflare AI integration! Here's how to get everything up and running:

## Current Status ✅

### **All Servers Running:**
- **Port 8000**: ✅ Backend API (`simple_unified_server.py`)
- **Port 3000**: ✅ React Frontend (with Mock Cloudflare AI)
- **Port 3001**: ✅ Test React App

### **AI Services:**
- **Mock Cloudflare AI**: ✅ Ready for development and testing
- **Real Cloudflare AI**: 🔄 Ready to deploy when needed

## 🎯 What's Working Now

### **1. Mock AI Service (Immediate Use)**
- **Location**: `src/services/mock_cloudflare_service.ts`
- **Features**: 
  - Wedding theme image generation (using Unsplash images)
  - Theme analysis and keyword extraction
  - Realistic mock responses based on your inputs
  - 2-second delay to simulate real API calls

### **2. Real Cloudflare AI (Ready to Deploy)**
- **Location**: `src/services/cloudflare_ai_service.ts`
- **Worker**: `src/worker.js`
- **Configuration**: `wrangler.toml`

## 🧪 Testing the Application

### **1. Access the Application**
```
Frontend: http://localhost:3000
Backend API: http://localhost:8000
Test App: http://localhost:3001
```

### **2. Test AI Features**
1. Go to **Wedding Preferences** page
2. Fill in wedding theme details:
   - Theme: Elegant, Rustic, Modern, etc.
   - Style: Classic, Modern, Vintage, etc.
   - Colors: White and Gold, Blush and Gold, etc.
   - Season: Spring, Summer, Fall, Winter
   - Venue Type: Luxury Hotel, Garden, Beach, etc.
3. Click **"Generate AI Images"**
4. Wait 2 seconds for mock response
5. See generated images and theme analysis!

### **3. Expected Results**
- **Images**: 4 beautiful wedding venue photos from Unsplash
- **Analysis**: Detailed theme breakdown with keywords
- **Keywords**: Relevant search terms for your theme
- **Mood & Style**: AI-generated descriptions

## 🔄 Switching to Real Cloudflare AI

When you're ready to use real AI generation:

### **Option 1: Deploy Cloudflare Worker**
```bash
# 1. Login to Cloudflare (requires browser)
wrangler login

# 2. Deploy the worker
./deploy-worker.sh

# 3. Update .env file with worker URL
echo "REACT_APP_CLOUDFLARE_WORKER_URL=https://your-worker.workers.dev" >> .env

# 4. Switch to real service
# Edit src/pages/WeddingPreferences.tsx:
# Change: import { MockCloudflareAIService as CloudflareAIService }
# To: import { CloudflareAIService }
```

### **Option 2: Use Environment Variable**
```bash
# Set environment variable to switch services
export REACT_APP_USE_MOCK_AI=false
npm start
```

## 📁 File Structure

```
react-frontend/
├── src/
│   ├── services/
│   │   ├── cloudflare_ai_service.ts      # Real Cloudflare AI
│   │   ├── mock_cloudflare_service.ts    # Mock service (current)
│   │   └── gemini_service.ts.backup      # Old service backup
│   ├── pages/
│   │   └── WeddingPreferences.tsx        # Updated to use new AI
│   └── worker.js                         # Cloudflare Worker
├── wrangler.toml                         # Worker configuration
├── deploy-worker.sh                      # Deployment script
├── migrate-to-cloudflare.sh              # Migration helper
└── CLOUDFLARE_AI_SETUP.md               # Detailed setup guide
```

## 🎨 Features Available

### **Wedding Theme Generation**
- **Input**: Theme, style, colors, season, venue type
- **Output**: 4 high-quality venue images + detailed analysis
- **Analysis**: Keywords, mood, style, color scheme

### **Theme Analysis**
- **Input**: Wedding preferences
- **Output**: Detailed visual description
- **Keywords**: Search terms for similar images
- **Mood & Style**: AI-generated characteristics

### **Mock vs Real AI**
- **Mock**: Instant testing, no API costs, realistic responses
- **Real**: Actual AI generation, better quality, requires deployment

## 🚨 Troubleshooting

### **React App Not Starting**
```bash
# Check if port 3000 is available
lsof -ti:3000
# Kill process if needed
kill -9 $(lsof -ti:3000)
# Restart
npm start
```

### **Backend API Not Responding**
```bash
# Check if port 8000 is available
lsof -ti:8000
# Restart backend
cd .. && python simple_unified_server.py
```

### **AI Features Not Working**
```bash
# Check browser console for errors
# Verify import in WeddingPreferences.tsx
# Test mock service directly
```

## 🎯 Next Steps

1. **Test the mock AI features** - Everything should work immediately
2. **Customize themes and preferences** - Try different combinations
3. **Deploy real Cloudflare AI** - When ready for production
4. **Add more AI features** - Expand the service capabilities

## 📞 Support

- **Mock Service Issues**: Check `mock_cloudflare_service.ts`
- **Real AI Issues**: See `CLOUDFLARE_AI_SETUP.md`
- **React Issues**: Check browser console and terminal logs
- **Backend Issues**: Check `simple_unified_server.py` logs

---

**🎉 You're all set! The wedding AI assistant is ready to use with mock AI generation for immediate testing and development.** 