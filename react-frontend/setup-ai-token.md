# Setup Cloudflare API Token for Real AI Image Generation

## 🎯 **Current Issue**
The venue images are showing placeholders because the Cloudflare API token is not set, so only fallback images are being generated.

## 🔧 **Solution: Set API Token**

### **Step 1: Get Your API Token**
1. Go to your Cloudflare dashboard
2. Navigate to "Workers & Pages" → "wedding-ai-worker"
3. Go to "Settings" → "Variables and Secrets"
4. Copy your API token

### **Step 2: Set Environment Variable**
```bash
# In your terminal, set the API token
export CLOUDFLARE_API_TOKEN="your-actual-token-here"

# Verify it's set
echo $CLOUDFLARE_API_TOKEN
```

### **Step 3: Restart Worker Server**
```bash
# Stop the current worker
pkill -f "node local-worker-server.js"

# Start with the new token
cd react-frontend
node local-worker-server.js
```

### **Step 4: Test Real AI Generation**
```bash
# Test the worker
curl -X POST http://localhost:8787/generate-image \
  -H "Content-Type: application/json" \
  -d '{"prompt":"A beautiful heritage palace wedding venue","num_images":1}'
```

## 🎉 **Expected Results**

### **Before (Fallback Images)**
- Returns: `https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1024&h=1024&fit=crop`
- Status: "Using fallback images (no API token)"

### **After (Real AI Images)**
- Returns: `/images/venues/venue-1733523456789-0.jpg`
- Status: "Real AI generation enabled"
- Files saved to: `public/images/venues/`

## 🚀 **Next Steps**

1. **Set the API token** using the steps above
2. **Restart the worker server**
3. **Open the React app** at `http://localhost:3000`
4. **Go to Wedding Preferences** → **Venue tab**
5. **Click "Generate Venue Images"** button
6. **Watch real AI images** appear in the venue cards!

## 📁 **Image Storage**

Once working, AI-generated images will be saved to:
```
react-frontend/public/images/venues/
├── venue-1733523456789-0.jpg
├── venue-1733523456790-1.jpg
└── ... (more AI-generated images)
```

The React app will display these saved images instead of placeholders! 🎊 