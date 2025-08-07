#!/bin/bash

# Simple Cloudflare Worker Deployment Script

echo "🚀 Deploying Cloudflare Worker for Wedding AI Assistant..."

# Generate a unique subdomain name
TIMESTAMP=$(date +%s)
RANDOM_HEX=$(openssl rand -hex 4)
SUBDOMAIN="wedding-ai-${TIMESTAMP}-${RANDOM_HEX}"

echo "📝 Using subdomain: ${SUBDOMAIN}"

# Deploy the worker with the unique name
echo "📦 Deploying worker..."
wrangler deploy --name="${SUBDOMAIN}" --env=""

if [ $? -eq 0 ]; then
    echo "✅ Worker deployed successfully!"
    echo "🌐 Worker URL: https://${SUBDOMAIN}.workers.dev"
    echo ""
    echo "📝 Add this to your .env file:"
    echo "REACT_APP_CLOUDFLARE_WORKER_URL=https://${SUBDOMAIN}.workers.dev"
    echo ""
    echo "🧪 Test the worker:"
    echo "curl https://${SUBDOMAIN}.workers.dev/health"
else
    echo "❌ Deployment failed"
    exit 1
fi 