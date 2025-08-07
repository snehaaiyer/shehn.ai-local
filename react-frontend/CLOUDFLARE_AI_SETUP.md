# Cloudflare Workers AI Setup Guide

## Overview
This guide will help you migrate from Google Gemini API to Cloudflare Workers AI for better performance, reliability, and cost-effectiveness.

## Prerequisites

### 1. Cloudflare Account
- Sign up at [cloudflare.com](https://cloudflare.com)
- Enable Workers AI in your account dashboard

### 2. Install Wrangler CLI
```bash
npm install -g wrangler
```

### 3. Login to Cloudflare
```bash
wrangler login
```

## Setup Steps

### Step 1: Deploy the Cloudflare Worker

1. Navigate to the react-frontend directory:
```bash
cd react-frontend
```

2. Run the deployment script:
```bash
./deploy-worker.sh
```

3. The script will:
   - Check if Wrangler is installed
   - Prompt for Cloudflare login if needed
   - Deploy the worker
   - Display the worker URL

### Step 2: Configure Environment Variables

1. Create or update your `.env` file in the react-frontend directory:
```bash
# Add this line to your .env file
REACT_APP_CLOUDFLARE_WORKER_URL=https://your-worker.your-subdomain.workers.dev
```

2. Replace the URL with the actual worker URL from the deployment output.

### Step 3: Update Your Application

The migration is already complete! The new `CloudflareAIService` class has been created and is ready to use.

## API Endpoints

### Health Check
```bash
GET https://your-worker.workers.dev/health
```

### Image Generation
```bash
POST https://your-worker.workers.dev/generate-image
Content-Type: application/json

{
  "prompt": "A beautiful wedding venue...",
  "model": "@cf/lykon/dreamshaper-xl-10",
  "num_images": 4,
  "width": 1024,
  "height": 1024
}
```

### Text Analysis
```bash
POST https://your-worker.workers.dev/analyze-text
Content-Type: application/json

{
  "prompt": "Analyze this wedding theme...",
  "model": "@cf/meta/llama-3.1-8b-instruct",
  "max_tokens": 2048
}
```

## Available Models

### Image Generation Models
- `@cf/lykon/dreamshaper-xl-10` (Default) - High-quality image generation
- `@cf/runwayml/stable-diffusion-v1-5` - Stable Diffusion model
- `@cf/bytedance/stable-diffusion-xl-base-1.0` - SDXL model

### Text Models
- `@cf/meta/llama-3.1-8b-instruct` (Default) - Fast and efficient
- `@cf/meta/llama-3.1-70b-instruct` - More capable but slower
- `@cf/mistral/mistral-7b-instruct-v0.2` - Good balance of speed and quality

## Usage in Your React App

### Replace Gemini Service with Cloudflare AI Service

```typescript
// Old import
import { GeminiService } from './services/gemini_service';

// New import
import { CloudflareAIService } from './services/cloudflare_ai_service';

// Usage remains the same
const result = await CloudflareAIService.generateWeddingThemeImages({
  theme: 'Elegant',
  style: 'Classic',
  colors: 'White and Gold',
  season: 'Spring',
  venueType: 'Luxury Hotel',
  customDescription: 'Traditional wedding elegance',
  guestCount: 150,
  location: 'Mumbai'
});
```

## Benefits of Cloudflare Workers AI

### 1. Performance
- **Global Edge Network**: Requests are processed closer to users
- **Faster Response Times**: Reduced latency compared to traditional APIs
- **Parallel Processing**: Multiple requests handled simultaneously

### 2. Cost Effectiveness
- **Pay-per-request**: Only pay for what you use
- **No API Key Management**: Built-in authentication
- **No Rate Limits**: Generous usage limits

### 3. Reliability
- **99.9% Uptime**: Enterprise-grade reliability
- **Automatic Scaling**: Handles traffic spikes automatically
- **Built-in CORS**: No additional configuration needed

### 4. Security
- **Edge Security**: DDoS protection and security features
- **No API Keys**: Secure by design
- **Isolated Execution**: Each request runs in isolation

## Testing

### Test the Worker
```bash
# Health check
curl https://your-worker.workers.dev/health

# Test image generation
curl -X POST https://your-worker.workers.dev/generate-image \
  -H "Content-Type: application/json" \
  -d '{"prompt": "A beautiful wedding venue", "num_images": 1}'

# Test text analysis
curl -X POST https://your-worker.workers.dev/analyze-text \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Analyze this wedding theme: Elegant classic wedding"}'
```

### Test in React App
```typescript
// Test connection
const isConnected = await CloudflareAIService.validateConnection();
console.log('Cloudflare AI connected:', isConnected);

// Test image generation
const result = await CloudflareAIService.generateWeddingThemeImages({
  theme: 'Test',
  style: 'Modern',
  colors: 'Blue and Silver',
  season: 'Summer',
  venueType: 'Garden',
  customDescription: 'Test wedding theme',
  guestCount: 100,
  location: 'Test City'
});

console.log('Generation result:', result);
```

## Troubleshooting

### Common Issues

1. **Worker not deployed**
   - Check if you're logged in: `wrangler whoami`
   - Redeploy: `wrangler deploy`

2. **CORS errors**
   - The worker includes CORS headers automatically
   - Check if the worker URL is correct

3. **Image generation fails**
   - Check the prompt length (should be reasonable)
   - Verify the model name is correct
   - Check Cloudflare AI is enabled in your account

4. **Text analysis fails**
   - Check the prompt format
   - Verify the model name
   - Check token limits

### Debug Mode

Enable debug logging in the worker by adding console.log statements:

```javascript
// In worker.js
console.log('Request received:', request.url);
console.log('Request body:', await request.json());
```

## Monitoring

### View Worker Logs
```bash
wrangler tail
```

### Check Worker Analytics
- Visit the Cloudflare dashboard
- Go to Workers & Pages
- Select your worker
- View analytics and logs

## Migration Checklist

- [ ] Deploy Cloudflare Worker
- [ ] Update environment variables
- [ ] Test worker endpoints
- [ ] Update React app imports
- [ ] Test image generation
- [ ] Test text analysis
- [ ] Remove old Gemini API key
- [ ] Update documentation

## Support

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Cloudflare AI Documentation](https://developers.cloudflare.com/ai/)
- [Wrangler CLI Documentation](https://developers.cloudflare.com/workers/wrangler/)

## Next Steps

1. Deploy the worker using the provided script
2. Update your environment variables
3. Test the new service
4. Remove the old Gemini service when ready
5. Monitor performance and adjust as needed 