# Wedding Blueprint Feature

## Overview

The Wedding Blueprint is an AI-powered feature that generates comprehensive wedding planning insights and visualizations based on user preferences. It combines Cloudflare AI for image generation and Gemini API for text analysis to create personalized wedding blueprints.

## Features

### 🎨 AI-Generated Images
- **Ceremony Setup**: Custom ceremony area images (mandap, altar, etc.) based on theme
- **Reception Area**: Visual representation of dining and celebration space
- **Decorative Details**: Close-up shots of wedding decorations and styling elements

### 📝 AI-Generated Content
- **Wedding Summary**: Comprehensive description of the wedding vision
- **Recommendations**: Personalized suggestions for venue, catering, photography, and decor
- **Timeline**: Detailed wedding day schedule
- **Budget Breakdown**: Smart budget allocation based on preferences

### 🔧 Technical Integration
- **Cloudflare AI**: Uses `@cf/lykon/dreamshaper-8-lcm` for image generation
- **Gemini API**: Uses `gemini-2.0-flash` for text analysis and content generation
- **Real-time Processing**: Generates content on-demand based on user preferences

## Architecture

### Services

#### 1. WeddingBlueprintService (`src/services/wedding_blueprint_service.ts`)
- Main orchestrator service
- Coordinates between Cloudflare AI and Gemini API
- Handles data parsing and response formatting
- Integrates theme prompt generation for specialized images

#### 2. CloudflareAIService (`src/services/cloudflare_ai_service.ts`)
- Handles image generation using Cloudflare Workers AI
- Supports multiple image generation models
- Includes fallback mechanisms for failed generations

#### 3. GeminiService (`src/services/gemini_service.ts`)
- Handles text generation and analysis
- Provides structured responses for recommendations
- Includes error handling and response parsing

#### 4. ThemePromptGenerator (`src/services/theme_prompt_generator.ts`)
- Generates specialized prompts for 3 different image types
- Uses AI to create context-aware prompts based on wedding preferences
- Provides fallback prompts for different wedding themes
- Ensures high-quality, detailed prompts for image generation

### Components

#### WeddingBlueprint (`src/components/WeddingBlueprint.tsx`)
- Modal component for displaying the blueprint
- Handles generation states (loading, success, error)
- Responsive design with beautiful UI

## Usage

### In Wedding Preferences Page

1. **Navigate** to the Wedding Preferences page
2. **Fill out** your wedding preferences (theme, venue, catering, photography)
3. **Click** "Generate Wedding Blueprint" button
4. **Wait** for AI processing (typically 30-60 seconds)
5. **Review** your personalized wedding blueprint

### Blueprint Content

The generated blueprint includes:

#### Visual Elements
- **Ceremony Setup**: Sacred ceremony area with traditional elements
- **Reception Area**: Elegant dining and celebration space  
- **Decorative Details**: Intricate decorative elements and styling

#### Text Content
- Personalized wedding summary
- Venue recommendations (3-4 suggestions)
- Catering recommendations (3-4 menu ideas)
- Photography recommendations (3-4 style options)
- Decor recommendations (3-4 decoration ideas)

#### Planning Tools
- Detailed wedding day timeline
- Budget breakdown with percentages
- Total budget calculation

## API Endpoints

### Cloudflare Worker Endpoints

#### Health Check
```
GET /health
```

#### Image Generation
```
POST /generate-image
{
  "prompt": "string",
  "num_images": 1,
  "width": 1024,
  "height": 1024
}
```

#### Text Analysis
```
POST /analyze-text
{
  "prompt": "string",
  "max_tokens": 2048
}
```

### Gemini API Integration

The service uses Gemini 2.0 Flash for:
- Wedding summary generation
- Recommendations analysis
- Timeline creation
- Budget breakdown calculations

## Configuration

### Environment Variables

```bash
# Cloudflare Worker URL (defaults to localhost:8787)
REACT_APP_CLOUDFLARE_WORKER_URL=https://your-worker.your-subdomain.workers.dev

# Gemini API Key (already configured in service)
GEMINI_API_KEY=your-gemini-api-key
```

### Cloudflare Worker Setup

The worker is configured in `wrangler.toml`:
```toml
name = "wedding-ai-worker"
main = "src/worker.js"
compatibility_date = "2024-01-01"
workers_dev = true

[ai]
binding = "AI"

[observability.logs]
enabled = true
```

## Models Used

### Image Generation
- **Model**: `@cf/lykon/dreamshaper-8-lcm`
- **Purpose**: High-quality wedding venue and theme images
- **Features**: Fast generation, good quality, suitable for wedding themes

### Text Generation
- **Model**: `@cf/meta/llama-3.1-8b-instruct`
- **Purpose**: Text analysis and structured responses
- **Features**: Good for JSON parsing and structured content

### Content Generation
- **Model**: `gemini-2.0-flash`
- **Purpose**: Creative content, summaries, recommendations
- **Features**: High-quality text generation, good for creative content

## Error Handling

### Fallback Mechanisms
- **Image Generation**: Falls back to placeholder images if generation fails
- **Text Generation**: Uses default content if API calls fail
- **Service Errors**: Graceful degradation with user-friendly error messages

### Error Types
- **Network Errors**: Connection issues with APIs
- **API Errors**: Rate limiting or service unavailability
- **Parsing Errors**: Invalid JSON responses
- **Generation Errors**: Failed image or text generation

## Performance

### Generation Time
- **Images**: 10-30 seconds per image
- **Text**: 5-15 seconds per request
- **Total Blueprint**: 30-90 seconds

### Optimization
- **Parallel Processing**: Multiple API calls run concurrently
- **Caching**: Generated content can be cached for reuse
- **Lazy Loading**: Images load as they become available

## Testing

### Test Scripts
Run the test scripts to verify functionality:
```bash
# Test complete wedding blueprint
node test-wedding-blueprint.js

# Test theme prompt generator
node test-theme-prompts.js
```

### Manual Testing
1. Fill out wedding preferences
2. Generate blueprint
3. Verify all sections are populated
4. Check image quality and relevance
5. Validate budget calculations

## Future Enhancements

### Planned Features
- **Save Blueprints**: Store generated blueprints for later reference
- **Share Blueprints**: Share blueprints with vendors and family
- **Multiple Themes**: Generate blueprints for multiple theme options
- **Vendor Integration**: Direct vendor recommendations with contact info
- **Budget Tracking**: Track actual spending against blueprint budget

### Technical Improvements
- **Image Caching**: Cache generated images for faster loading
- **Batch Processing**: Generate multiple blueprints simultaneously
- **Custom Models**: Fine-tuned models for wedding-specific content
- **Real-time Updates**: Live updates during generation process

## Troubleshooting

### Common Issues

#### Images Not Generating
- Check Cloudflare Worker URL configuration
- Verify worker is deployed and running
- Check browser console for CORS errors

#### Text Not Generating
- Verify Gemini API key is valid
- Check network connectivity
- Review API rate limits

#### Slow Generation
- Check internet connection speed
- Verify API service status
- Consider reducing image count or quality

### Debug Mode
Enable debug logging by setting:
```javascript
localStorage.setItem('debug', 'true');
```

## Support

For issues or questions:
1. Check the browser console for error messages
2. Verify all environment variables are set
3. Test individual services using the test script
4. Review the Cloudflare Worker logs

## License

This feature is part of the Wedding AI Assistant project and follows the same licensing terms. 