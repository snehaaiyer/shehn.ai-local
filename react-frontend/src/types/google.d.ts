// Google Maps API type declarations for TypeScript

declare global {
  interface Window {
    google: typeof google;
  }
}

declare namespace google {
  namespace maps {
    class Map {
      constructor(mapDiv: Element | null, opts?: MapOptions);
    }

    interface MapOptions {
      center?: LatLng | LatLngLiteral;
      zoom?: number;
      mapTypeId?: MapTypeId;
      [key: string]: any;
    }

    class LatLng {
      constructor(lat: number, lng: number);
      lat(): number;
      lng(): number;
    }

    interface LatLngLiteral {
      lat: number;
      lng: number;
    }

    enum MapTypeId {
      ROADMAP = 'roadmap',
      SATELLITE = 'satellite',
      HYBRID = 'hybrid',
      TERRAIN = 'terrain'
    }

    namespace places {
      class AutocompleteService {
        constructor();
        getPlacePredictions(
          request: AutocompletionRequest,
          callback: (predictions: AutocompletePrediction[] | null, status: PlacesServiceStatus) => void
        ): void;
      }

      class PlacesService {
        constructor(attrContainer: HTMLDivElement | Map);
        getDetails(
          request: PlaceDetailsRequest,
          callback: (place: PlaceResult | null, status: PlacesServiceStatus) => void
        ): void;
        textSearch(
          request: TextSearchRequest,
          callback: (results: PlaceResult[] | null, status: PlacesServiceStatus) => void
        ): void;
      }

      interface AutocompletionRequest {
        input: string;
        types?: string[];
        componentRestrictions?: ComponentRestrictions;
        fields?: string[];
        offset?: number;
        location?: LatLng | LatLngLiteral;
        radius?: number;
      }

      interface ComponentRestrictions {
        country?: string | string[];
      }

      interface AutocompletePrediction {
        place_id: string;
        description: string;
        matched_substrings: PredictionSubstring[];
        structured_formatting: PredictionStructuredFormatting;
        terms: PredictionTerm[];
        types: string[];
      }

      interface PredictionSubstring {
        length: number;
        offset: number;
      }

      interface PredictionStructuredFormatting {
        main_text: string;
        main_text_matched_substrings: PredictionSubstring[];
        secondary_text: string;
        secondary_text_matched_substrings?: PredictionSubstring[];
      }

      interface PredictionTerm {
        offset: number;
        value: string;
      }

      interface PlaceDetailsRequest {
        placeId: string;
        fields?: string[];
        language?: string;
        region?: string;
        sessionToken?: AutocompleteSessionToken;
      }

      interface TextSearchRequest {
        query: string;
        bounds?: LatLngBounds;
        location?: LatLng | LatLngLiteral;
        radius?: number;
        types?: string[];
        language?: string;
        minPriceLevel?: number;
        maxPriceLevel?: number;
        openNow?: boolean;
        pageToken?: string;
      }

      interface PlaceResult {
        place_id?: string;
        name?: string;
        formatted_address?: string;
        geometry?: PlaceGeometry;
        types?: string[];
        rating?: number;
        user_ratings_total?: number;
        price_level?: number;
        photos?: PlacePhoto[];
        reviews?: PlaceReview[];
        opening_hours?: OpeningHours;
        website?: string;
        international_phone_number?: string;
        formatted_phone_number?: string;
        vicinity?: string;
        permanently_closed?: boolean;
        business_status?: BusinessStatus;
      }

      interface PlaceGeometry {
        location?: LatLng;
        viewport?: LatLngBounds;
      }

      interface PlacePhoto {
        height: number;
        width: number;
        html_attributions: string[];
        getUrl(opts?: PhotoOptions): string;
      }

      interface PhotoOptions {
        maxHeight?: number;
        maxWidth?: number;
      }

      interface PlaceReview {
        author_name: string;
        author_url?: string;
        language: string;
        profile_photo_url: string;
        rating: number;
        relative_time_description: string;
        text: string;
        time: number;
      }

      interface OpeningHours {
        open_now?: boolean;
        periods?: OpeningPeriod[];
        weekday_text?: string[];
      }

      interface OpeningPeriod {
        close?: OpeningHoursTime;
        open: OpeningHoursTime;
      }

      interface OpeningHoursTime {
        day: number;
        time: string;
      }

      class AutocompleteSessionToken {
        constructor();
      }

      enum PlacesServiceStatus {
        OK = 'OK',
        UNKNOWN_ERROR = 'UNKNOWN_ERROR',
        OVER_QUERY_LIMIT = 'OVER_QUERY_LIMIT',
        REQUEST_DENIED = 'REQUEST_DENIED',
        INVALID_REQUEST = 'INVALID_REQUEST',
        ZERO_RESULTS = 'ZERO_RESULTS',
        NOT_FOUND = 'NOT_FOUND'
      }

      enum BusinessStatus {
        OPERATIONAL = 'OPERATIONAL',
        CLOSED_TEMPORARILY = 'CLOSED_TEMPORARILY',
        CLOSED_PERMANENTLY = 'CLOSED_PERMANENTLY'
      }
    }

    class LatLngBounds {
      constructor(sw?: LatLng | LatLngLiteral, ne?: LatLng | LatLngLiteral);
      contains(latLng: LatLng | LatLngLiteral): boolean;
      extend(point: LatLng | LatLngLiteral): LatLngBounds;
      getCenter(): LatLng;
      getNorthEast(): LatLng;
      getSouthWest(): LatLng;
      intersects(other: LatLngBounds): boolean;
      isEmpty(): boolean;
      toJSON(): LatLngBoundsLiteral;
      toString(): string;
      toUrlValue(precision?: number): string;
      union(other: LatLngBounds): LatLngBounds;
    }

    interface LatLngBoundsLiteral {
      east: number;
      north: number;
      south: number;
      west: number;
    }
  }
}

export {};