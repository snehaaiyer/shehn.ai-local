#!/bin/bash

# Migration Script: Gemini API to Cloudflare Workers AI

echo "🔄 Migrating from Gemini API to Cloudflare Workers AI..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Please run this script from the react-frontend directory${NC}"
    exit 1
fi

echo -e "${BLUE}📋 Migration Steps:${NC}"

# Step 1: Check if Cloudflare service exists
if [ -f "src/services/cloudflare_ai_service.ts" ]; then
    echo -e "${GREEN}✅ Cloudflare AI service already exists${NC}"
else
    echo -e "${RED}❌ Cloudflare AI service not found. Please create it first.${NC}"
    exit 1
fi

# Step 2: Check if worker files exist
if [ -f "wrangler.toml" ] && [ -f "src/worker.js" ]; then
    echo -e "${GREEN}✅ Cloudflare Worker files exist${NC}"
else
    echo -e "${RED}❌ Cloudflare Worker files not found. Please create them first.${NC}"
    exit 1
fi

# Step 3: Check if deployment script exists
if [ -f "deploy-worker.sh" ]; then
    echo -e "${GREEN}✅ Deployment script exists${NC}"
else
    echo -e "${RED}❌ Deployment script not found. Please create it first.${NC}"
    exit 1
fi

# Step 4: Check if .env file exists
if [ -f ".env" ]; then
    echo -e "${GREEN}✅ .env file exists${NC}"
    
    # Check if Cloudflare worker URL is already set
    if grep -q "REACT_APP_CLOUDFLARE_WORKER_URL" .env; then
        echo -e "${YELLOW}⚠️  Cloudflare worker URL already configured in .env${NC}"
    else
        echo -e "${YELLOW}⚠️  Please add REACT_APP_CLOUDFLARE_WORKER_URL to your .env file${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  .env file not found. Creating one...${NC}"
    touch .env
    echo "# Environment variables for Wedding AI Assistant" > .env
    echo "# Add your Cloudflare worker URL here:" >> .env
    echo "# REACT_APP_CLOUDFLARE_WORKER_URL=https://your-worker.your-subdomain.workers.dev" >> .env
fi

# Step 5: Create backup of Gemini service
if [ -f "src/services/gemini_service.ts" ]; then
    echo -e "${BLUE}📦 Creating backup of Gemini service...${NC}"
    cp src/services/gemini_service.ts src/services/gemini_service.ts.backup
    echo -e "${GREEN}✅ Backup created: src/services/gemini_service.ts.backup${NC}"
fi

# Step 6: Show migration instructions
echo ""
echo -e "${BLUE}🚀 Next Steps:${NC}"
echo ""
echo -e "${YELLOW}1. Deploy the Cloudflare Worker:${NC}"
echo "   cd react-frontend"
echo "   ./deploy-worker.sh"
echo ""
echo -e "${YELLOW}2. Update your .env file with the worker URL:${NC}"
echo "   REACT_APP_CLOUDFLARE_WORKER_URL=https://your-worker.your-subdomain.workers.dev"
echo ""
echo -e "${YELLOW}3. Update your React components to use CloudflareAIService:${NC}"
echo "   // Replace this import:"
echo "   import { GeminiService } from './services/gemini_service';"
echo "   // With this:"
echo "   import { CloudflareAIService } from './services/cloudflare_ai_service';"
echo ""
echo -e "${YELLOW}4. Test the new service:${NC}"
echo "   npm start"
echo "   # Then test the AI features in your app"
echo ""
echo -e "${YELLOW}5. Remove old Gemini service when ready:${NC}"
echo "   rm src/services/gemini_service.ts"
echo ""

# Step 7: Show files that need to be updated
echo -e "${BLUE}📝 Files that may need updates:${NC}"
find src -name "*.tsx" -o -name "*.ts" | xargs grep -l "GeminiService" 2>/dev/null || echo "No files found using GeminiService"

echo ""
echo -e "${GREEN}✅ Migration preparation complete!${NC}"
echo -e "${BLUE}📖 See CLOUDFLARE_AI_SETUP.md for detailed instructions${NC}" 