# Gemini API Integration Workflow for Wedding Theme Image Generation

## Overview
This document outlines the complete workflow for integrating Google's Gemini API to generate personalized wedding theme images based on user preferences and custom descriptions.

## Workflow Architecture

### 1. User Input Collection
**Location**: `react-frontend/src/pages/WeddingPreferences.tsx`

#### A. Structured Theme Preferences
- **Selected Theme**: Predefined theme options (Royal Palace, Minimalist Pastel, Boho Garden, etc.)
- **Style**: Elegant, Casual, Formal, Bohemian, Vintage
- **Colors**: White & Gold, Pink & Purple, Blue & Silver, etc.
- **Season**: Spring, Summer, Autumn, Winter
- **Venue Type**: Heritage Palace, Outdoor Garden, Beach Resort, etc.

#### B. Custom Description
- **Free Text Input**: Users can describe their dream wedding theme in detail
- **Placeholder Example**: "I want a rustic barn wedding with fairy lights, vintage furniture, and wildflower arrangements..."
- **Character Limit**: No strict limit, but recommended 200-500 characters for optimal results

### 2. Data Processing & Prompt Engineering
**Location**: `react-frontend/src/services/gemini_service.ts`

#### A. Request Data Structure
```typescript
interface GeminiImageGenerationRequest {
  theme: string;           // Selected theme
  style: string;           // Style preference
  colors: string;          // Color palette
  season: string;          // Season
  venueType: string;       // Venue type
  customDescription: string; // User's custom description
  guestCount: number;      // Number of guests
  location: string;        // Wedding location
}
```

#### B. Prompt Generation Strategy
The `generatePrompt()` method creates a comprehensive prompt that includes:

1. **Theme & Style Section**
   - Primary theme with fallback to "Elegant"
   - Style with fallback to "Classic"
   - Color palette with fallback to "White and Gold"
   - Season with fallback to "Spring"

2. **Venue & Setting Section**
   - Venue type with fallback to "Luxury Hotel"
   - Location with fallback to "Urban setting"
   - Guest count for scale reference

3. **Custom Requirements Section**
   - User's custom description (if provided)
   - Special requests and unique elements

4. **Image Requirements Section**
   - High-quality, photorealistic specifications
   - Professional lighting and composition
   - Decorative elements and floral arrangements
   - Ceremony and reception areas

5. **Technical Specifications**
   - Resolution: 1024x1024 pixels
   - Style: Photorealistic, professional photography
   - Mood: Romantic, elegant, and celebratory

### 3. Gemini API Integration
**Location**: `react-frontend/src/services/gemini_service.ts`

#### A. API Configuration
```typescript
private static readonly API_KEY = 'AIzaSyBSzy9WsCPlJJRkYTejbD5UrgxDN0XTJQg';
private static readonly BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent';
```

#### B. Image Generation Process
1. **Prompt Creation**: Generate detailed prompt from user inputs
2. **API Call**: Send request to Gemini API with structured prompt
3. **Response Processing**: Handle success/error responses
4. **Image URLs**: Return generated image URLs

#### C. Error Handling
- Network connectivity issues
- API rate limiting
- Invalid API key
- Malformed requests
- Timeout handling

### 4. User Interface Integration
**Location**: `react-frontend/src/pages/WeddingPreferences.tsx`

#### A. Custom Description Textbox
- **Placeholder Text**: Guides users on what to include
- **Styling**: Consistent with existing form elements
- **Validation**: Optional field, no strict requirements

#### B. Image Generation Button
- **Visual Design**: Gradient button with Sparkles icon
- **Loading State**: Spinner animation during generation
- **Disabled State**: Prevents multiple simultaneous requests

#### C. Generated Images Display
- **Grid Layout**: 2-column responsive grid
- **Image Preview**: 256px height with hover effects
- **Full-size View**: Click to open in new tab
- **Loading Indicator**: Centered spinner with status text

### 5. State Management
**Location**: `react-frontend/src/pages/WeddingPreferences.tsx`

#### A. New Theme Fields
```typescript
theme: {
  // ... existing fields
  customDescription: string;      // User's custom description
  generatedImages: string[];      // Array of generated image URLs
  isGeneratingImages: boolean;    // Loading state
}
```

#### B. State Updates
- **Real-time Updates**: Custom description updates immediately
- **Loading States**: Visual feedback during generation
- **Error Handling**: User-friendly error messages
- **Persistence**: Images saved with preferences

## Complete User Journey

### Step 1: Theme Selection
1. User selects from predefined theme cards
2. System highlights selected theme
3. Theme data stored in state

### Step 2: Additional Preferences
1. User fills in style, colors, season, venue type
2. All selections are optional with smart defaults
3. Data continuously saved to state

### Step 3: Custom Description
1. User optionally adds detailed custom description
2. Textarea provides helpful placeholder text
3. Real-time character count and validation

### Step 4: Image Generation
1. User clicks "Generate Images" button
2. System validates all inputs and prepares request
3. Loading state shows with spinner animation
4. Gemini API processes request with structured prompt
5. Two unique images generated based on preferences
6. Images displayed in responsive grid layout

### Step 5: Image Interaction
1. User can hover over images for "View Full Size" button
2. Clicking opens image in new tab at full resolution
3. Images persist with saved preferences

## Technical Implementation Details

### API Integration Strategy
1. **Mock Implementation**: Currently uses placeholder images for development
2. **Real API Integration**: Replace mock with actual Gemini API calls
3. **Error Handling**: Comprehensive error handling for all failure scenarios
4. **Rate Limiting**: Implement request throttling to respect API limits

### Prompt Engineering Best Practices
1. **Structured Format**: Clear sections with consistent formatting
2. **Fallback Values**: Smart defaults for missing user inputs
3. **Specific Instructions**: Detailed technical and artistic requirements
4. **Context Preservation**: Maintain user's custom requirements

### Performance Considerations
1. **Async Processing**: Non-blocking image generation
2. **Loading States**: Clear user feedback during processing
3. **Error Recovery**: Graceful handling of API failures
4. **Caching**: Consider caching generated images for repeated requests

## Future Enhancements

### 1. Advanced Prompt Engineering
- **Style Templates**: Pre-built prompt templates for different themes
- **Dynamic Prompts**: Adjust prompt complexity based on user input
- **Multi-language Support**: Generate prompts in user's preferred language

### 2. Image Customization
- **Style Variations**: Generate multiple style variations
- **Aspect Ratios**: Support different image aspect ratios
- **Resolution Options**: Allow users to choose image resolution

### 3. Integration Features
- **Vendor Matching**: Match generated themes with real vendor portfolios
- **Budget Integration**: Adjust theme complexity based on budget
- **Seasonal Adjustments**: Automatically adjust themes for different seasons

### 4. User Experience
- **Image History**: Save and compare multiple generated themes
- **Theme Sharing**: Share generated themes with vendors or family
- **Feedback Loop**: Allow users to refine and regenerate images

## Security Considerations

### 1. API Key Management
- **Environment Variables**: Store API key in environment variables
- **Key Rotation**: Implement API key rotation strategy
- **Access Control**: Restrict API key access to necessary endpoints

### 2. Input Validation
- **Content Filtering**: Filter inappropriate content in custom descriptions
- **Rate Limiting**: Prevent abuse through request throttling
- **Input Sanitization**: Clean user inputs before API calls

### 3. Data Privacy
- **User Consent**: Clear consent for AI image generation
- **Data Retention**: Define policies for storing generated images
- **GDPR Compliance**: Ensure compliance with data protection regulations

## Testing Strategy

### 1. Unit Testing
- **Prompt Generation**: Test prompt creation with various inputs
- **State Management**: Test theme state updates
- **Error Handling**: Test all error scenarios

### 2. Integration Testing
- **API Integration**: Test Gemini API calls and responses
- **UI Integration**: Test image generation workflow
- **State Persistence**: Test saving and loading generated images

### 3. User Acceptance Testing
- **End-to-End Workflow**: Test complete user journey
- **Performance Testing**: Test with various input combinations
- **Accessibility Testing**: Ensure accessibility compliance

This workflow provides a comprehensive solution for integrating Gemini API into the wedding planning application, creating a seamless experience for users to visualize their dream wedding themes. 