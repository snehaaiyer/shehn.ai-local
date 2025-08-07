/**
 * Cloudflare Worker for Wedding AI Assistant
 * Handles image generation and text analysis using Cloudflare AI
 */

export default {
  async fetch(request, env, ctx) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json',
    };

    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: corsHeaders,
      });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      switch (path) {
        case '/':
        case '/health':
          return new Response(JSON.stringify({
            status: 'healthy',
            service: 'Wedding AI Worker',
            timestamp: new Date().toISOString(),
            models: {
              text: '@cf/meta/llama-3.1-8b-instruct',
              image: '@cf/lykon/dreamshaper-8-lcm'
            },
            endpoints: {
              health: 'GET /health',
              generate_image: 'POST /generate-image',
              analyze_text: 'POST /analyze-text'
            }
          }), {
            status: 200,
            headers: corsHeaders,
          });

        case '/generate-image':
          return await handleImageGeneration(request, env, corsHeaders);

        case '/analyze-text':
          return await handleTextAnalysis(request, env, corsHeaders);

        default:
          return new Response(JSON.stringify({
            error: 'Endpoint not found',
            available_endpoints: ['/health', '/generate-image', '/analyze-text'],
            usage: {
              health: 'GET /health - Check service status',
              generate_image: 'POST /generate-image - Generate wedding theme images',
              analyze_text: 'POST /analyze-text - Analyze wedding preferences'
            }
          }), {
            status: 404,
            headers: corsHeaders,
          });
      }
    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({
        error: 'Internal server error',
        message: error.message
      }), {
        status: 500,
        headers: corsHeaders,
      });
    }
  },
};

/**
 * Handle image generation requests
 */
async function handleImageGeneration(request, env, corsHeaders) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    const body = await request.json();
    const { prompt, num_images = 4, width = 1024, height = 1024 } = body;

    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Prompt is required' }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Generate images using Cloudflare AI
    const images = [];
    
    for (let i = 0; i < num_images; i++) {
      const imageResponse = await env.AI.run('@cf/lykon/dreamshaper-8-lcm', {
        prompt: prompt,
        width: width,
        height: height,
        num_steps: 20,
        guidance: 7.5,
        seed: Math.floor(Math.random() * 1000000)
      });

            // Convert the image to base64
      console.log('Response type:', typeof imageResponse);
      console.log('Response constructor:', imageResponse?.constructor?.name);
      
      // The response is a ReadableStream, we need to read from it
      if (imageResponse && imageResponse.constructor?.name === 'ReadableStream') {
        try {
          // Read the stream to get the image data
          const reader = imageResponse.getReader();
          const chunks = [];
          
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value) {
              chunks.push(value);
            }
          }
          
          // Combine all chunks into a single Uint8Array
          if (chunks.length > 0) {
            const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
            const imageData = new Uint8Array(totalLength);
            let offset = 0;
            
            for (const chunk of chunks) {
              imageData.set(chunk, offset);
              offset += chunk.length;
            }
            
            // Convert to base64 using a more efficient method
            let binaryString = '';
            for (let i = 0; i < imageData.length; i++) {
              binaryString += String.fromCharCode(imageData[i]);
            }
            const base64Image = btoa(binaryString);
            const dataUrl = `data:image/png;base64,${base64Image}`;
            images.push(dataUrl);
            continue;
          }
        } catch (e) {
          console.log('Failed to read ReadableStream:', e);
        }
      }
      
      // Fallback: return a placeholder image
      const placeholderDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      images.push(placeholderDataUrl);
    }

    return new Response(JSON.stringify({
      success: true,
      images: images,
      model: '@cf/lykon/dreamshaper-8-lcm',
      prompt: prompt,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: corsHeaders,
    });

  } catch (error) {
    console.error('Image generation error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}

/**
 * Handle text analysis requests
 */
async function handleTextAnalysis(request, env, corsHeaders) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    const body = await request.json();
    const { prompt, max_tokens = 2048 } = body;

    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Prompt is required' }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Generate text using Cloudflare AI
    const response = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      prompt: prompt,
      max_tokens: max_tokens,
      temperature: 0.7,
      top_p: 0.95,
      stream: false
    });

    return new Response(JSON.stringify({
      success: true,
      response: response,
      model: '@cf/meta/llama-3.1-8b-instruct',
      prompt: prompt,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: corsHeaders,
    });

  } catch (error) {
    console.error('Text analysis error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: corsHeaders,
    });
  }
} 