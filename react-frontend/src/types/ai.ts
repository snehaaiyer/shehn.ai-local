export interface AIImageResponse {
  success: boolean;
  imageUrls: string[];
  error?: string;
  generatedDescription?: string;
  themeAnalysis: {
    keywords: string[];
    mood: string;
    style: string;
    colorScheme: string[];
  };
}

export interface AIThemeAnalysis {
  keywords: string[];
  mood: string;
  style: string;
  colorScheme: string[];
}

export interface VenueImageGenerationParams {
  theme: string;
  style: string;
  colors: string;
  season: string;
  venueType: string;
  customDescription?: string;
  guestCount?: number;
  location?: string;
}

export interface CloudflareImageResponse {
  result: {
    image: string;
  };
  success: boolean;
  errors?: Array<{ message: string }>;
}

export interface AITextResponse {
  success: boolean;
  text: string;
  error?: string;
}

export interface AISearchResult {
  title: string;
  description: string;
  url?: string;
  imageUrls?: string[];
}