#!/bin/bash

# Cloudflare Worker Deployment Script for Wedding AI Assistant

echo "🚀 Deploying Cloudflare Worker for Wedding AI Assistant..."

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not found. Installing..."
    npm install -g wrangler
fi

# Check if user is logged in
if ! wrangler whoami &> /dev/null; then
    echo "🔐 Please login to Cloudflare..."
    wrangler login
fi

# Deploy the worker
echo "📦 Deploying worker..."
wrangler deploy

# Get the worker URL
echo "🔗 Getting worker URL..."
WORKER_URL=$(wrangler whoami | grep -o 'https://.*\.workers\.dev' | head -1)

if [ -n "$WORKER_URL" ]; then
    echo "✅ Worker deployed successfully!"
    echo "🌐 Worker URL: $WORKER_URL"
    echo ""
    echo "📝 Add this to your .env file:"
    echo "REACT_APP_CLOUDFLARE_WORKER_URL=$WORKER_URL"
    echo ""
    echo "🧪 Test the worker:"
    echo "curl $WORKER_URL/health"
else
    echo "❌ Failed to get worker URL"
    exit 1
fi 