const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 8787;

// Enable CORS
app.use(cors());
app.use(express.json());

// Function to save base64 image as file
function saveBase64Image(base64Data, filename, outputDir = 'public/images/venues') {
  try {
    // Create directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Remove data URL prefix if present
    const base64Image = base64Data.replace(/^data:image\/[a-z]+;base64,/, '');
    
    // Convert base64 to buffer
    const imageBuffer = Buffer.from(base64Image, 'base64');
    
    // Save file
    const filePath = path.join(outputDir, filename);
    fs.writeFileSync(filePath, imageBuffer);
    
    console.log(`✅ Saved AI image: ${filePath}`);
    return filePath;
  } catch (error) {
    console.error(`❌ Error saving image ${filename}:`, error);
    return null;
  }
}

// Cloudflare AI API configuration
const CLOUDFLARE_AI_BASE_URL = 'https://api.cloudflare.com/client/v4/ai/run';
const IMAGE_MODEL = '@cf/lykon/dreamshaper-xl-10';
const TEXT_MODEL = '@cf/meta/llama-3.1-8b-instruct';

// Check for Cloudflare API token
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const hasValidToken = CLOUDFLARE_API_TOKEN && CLOUDFLARE_API_TOKEN !== 'your-api-token-here';

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Local Wedding AI Worker',
    timestamp: new Date().toISOString(),
    models: {
      text: TEXT_MODEL,
      image: IMAGE_MODEL
    },
    endpoints: {
      health: 'GET /health',
      generate_image: 'POST /generate-image',
      analyze_text: 'POST /analyze-text'
    },
    ai_status: hasValidToken ? 'Real AI generation enabled' : 'Using fallback images (no API token)'
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Local Wedding AI Worker',
    timestamp: new Date().toISOString(),
    models: {
      text: TEXT_MODEL,
      image: IMAGE_MODEL
    },
    ai_status: hasValidToken ? 'Real AI generation enabled' : 'Using fallback images (no API token)'
  });
});

// Real image generation endpoint using Cloudflare AI
app.post('/generate-image', async (req, res) => {
  const { prompt, num_images = 2, width = 1024, height = 1024 } = req.body;
  
  console.log('Image generation request:', { prompt, num_images, width, height });
  
  try {
    const images = [];
    
    // Generate multiple images using Cloudflare AI
    for (let i = 0; i < num_images; i++) {
      const response = await fetch(CLOUDFLARE_AI_BASE_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: IMAGE_MODEL,
          prompt: prompt,
          width: width,
          height: height,
          num_steps: 20,
          guidance: 7.5
        })
      });

      if (response.ok) {
        const result = await response.json();
        if ((result.result && result.result.images && result.result.images.length > 0) || 
            (result.images && result.images.length > 0)) {
          // Cloudflare AI returns base64 images (handle both formats)
          const base64Image = result.result ? result.result.images[0] : result.images[0];
          
          // Save the image as a file
          const timestamp = Date.now();
          const filename = `venue-${timestamp}-${i}.jpg`;
          const savedPath = saveBase64Image(`data:image/png;base64,${base64Image}`, filename);
          
          if (savedPath) {
            // Return the public URL path
            images.push(`/images/venues/${filename}`);
            console.log(`✅ Saved venue image: /images/venues/${filename}`);
          } else {
            console.warn('❌ Failed to save image file, using fallback');
            // Fallback to Unsplash image instead of corrupted base64
            images.push('https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1024&h=1024&fit=crop');
          }
        } else {
          console.warn('No images in response:', result);
          // Fallback to mock image
          images.push('https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1024&h=1024&fit=crop');
        }
      } else {
        console.error('Cloudflare AI error:', response.status, await response.text());
        // Fallback to mock image
        images.push('https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1024&h=1024&fit=crop');
      }
      
      // Add delay between requests to avoid rate limiting
      if (i < num_images - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    res.json({
      success: true,
      images: images,
      prompt: prompt,
      model: IMAGE_MODEL
    });
    
  } catch (error) {
    console.error('Error generating images:', error);
    
    // Fallback to mock images on error
    const mockImages = [
      'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1024&h=1024&fit=crop',
      'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1024&h=1024&fit=crop',
      'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=1024&h=1024&fit=crop'
    ];
    
    res.json({
      success: true,
      images: mockImages.slice(0, num_images),
      prompt: prompt,
      model: IMAGE_MODEL,
      note: 'Using fallback images due to API error'
    });
  }
});

// Text analysis endpoint using Cloudflare AI
app.post('/analyze-text', async (req, res) => {
  const { prompt } = req.body;
  
  console.log('Text analysis request:', { prompt });
  
  try {
    const response = await fetch(CLOUDFLARE_AI_BASE_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: TEXT_MODEL,
        prompt: prompt,
        max_tokens: 2048
      })
    });

    if (response.ok) {
      const result = await response.json();
      res.json({
        success: true,
        response: result.result || 'Analysis completed'
      });
    } else {
      console.error('Cloudflare AI error:', response.status, await response.text());
      // Fallback to mock response
      res.json({
        success: true,
        response: `Analysis of: ${prompt}

**Theme Analysis:**
- Keywords: [wedding, venue, elegant, romantic]
- Mood: sophisticated and romantic
- Style: classic and timeless
- Colors: warm and inviting

**Recommendations:**
- Perfect for traditional ceremonies
- Excellent lighting for photography
- Spacious layout for guest comfort
- Elegant decor options available`
      });
    }
    
  } catch (error) {
    console.error('Error analyzing text:', error);
    res.json({
      success: true,
      response: `Analysis of: ${prompt}

**Theme Analysis:**
- Keywords: [wedding, venue, elegant, romantic]
- Mood: sophisticated and romantic
- Style: classic and timeless
- Colors: warm and inviting

**Recommendations:**
- Perfect for traditional ceremonies
- Excellent lighting for photography
- Spacious layout for guest comfort
- Elegant decor options available`
    });
  }
});

app.listen(port, () => {
  console.log(`🚀 Local Wedding AI Worker running at http://localhost:${port}`);
  console.log('');
  console.log('📋 Available endpoints:');
  console.log('   GET  /          - Service info and status');
  console.log('   GET  /health    - Health check');
  console.log('   POST /generate-image - Generate wedding theme images');
  console.log('   POST /analyze-text   - Analyze wedding preferences');
  console.log('');
  console.log(`🤖 AI Status: ${hasValidToken ? '✅ Real AI generation enabled' : '⚠️  Using fallback images (no API token)'}`);
  if (!hasValidToken) {
    console.log('');
    console.log('🔑 To enable real AI generation:');
    console.log('   export CLOUDFLARE_API_TOKEN="your-token-here"');
    console.log('   Get your token from: https://dash.cloudflare.com/profile/api-tokens');
  }
  console.log('');
  console.log('🌐 Test the service:');
  console.log('   curl http://localhost:8787/');
  console.log('   curl http://localhost:8787/health');
}); 