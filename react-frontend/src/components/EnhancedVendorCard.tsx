import React, { useState, useEffect } from 'react';
import { Star, MapPin, Phone, ExternalLink, MessageSquare, Shield } from 'lucide-react';

interface GoogleReview {
  author_name: string;
  rating: number;
  text: string;
  time: number;
  author_url?: string;
}

interface GooglePlaceDetails {
  place_id: string;
  name: string;
  rating?: number;
  user_ratings_total?: number;
  reviews?: GoogleReview[];
  photos?: string[];
  opening_hours?: {
    open_now: boolean;
    weekday_text: string[];
  };
  website?: string;
  formatted_phone_number?: string;
  price_level?: number;
}

interface Vendor {
  id: string;
  name: string;
  category: string;
  description: string;
  location: string;
  price_range: string;
  rating: number;
  phone?: string;
  email?: string;
  images?: string[];
  google_place_id?: string;
}

interface EnhancedVendorCardProps {
  vendor: Vendor;
  weddingPreferences: any;
  onInquiry?: (vendor: Vendor) => void;
  onCallClick?: (vendor: Vendor) => void;
}

export const EnhancedVendorCard: React.FC<EnhancedVendorCardProps> = ({
  vendor,
  weddingPreferences,
  onInquiry,
  onCallClick
}) => {
  const [googleDetails, setGoogleDetails] = useState<GooglePlaceDetails | null>(null);
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [showReviews, setShowReviews] = useState(false);

  useEffect(() => {
    if (vendor.google_place_id) {
      loadGooglePlaceDetails();
    }
  }, [vendor.google_place_id]);

  const loadGooglePlaceDetails = async () => {
    if (!vendor.google_place_id || !window.google) return;

    setIsLoadingGoogle(true);
    try {
      const service = new window.google.maps.places.PlacesService(
        document.createElement('div')
      );

      const request = {
        placeId: vendor.google_place_id,
        fields: [
          'name', 'rating', 'user_ratings_total', 'reviews', 'photos',
          'opening_hours', 'website', 'formatted_phone_number', 'price_level'
        ]
      };

      service.getDetails(request, (place: any, status: any) => {
        if (status === 'OK' && place) {
          setGoogleDetails({
            place_id: vendor.google_place_id!,
            name: place.name!,
            rating: place.rating,
            user_ratings_total: place.user_ratings_total,
            reviews: place.reviews as GoogleReview[],
            photos: place.photos?.slice(0, 3).map((photo: any) =>
              photo.getUrl({ maxWidth: 400, maxHeight: 300 })
            ),
            opening_hours: place.opening_hours,
            website: place.website,
            formatted_phone_number: place.formatted_phone_number,
            price_level: place.price_level
          });
        }
        setIsLoadingGoogle(false);
      });
    } catch (error) {
      console.error('Failed to load Google place details:', error);
      setIsLoadingGoogle(false);
    }
  };

  const getPriceDisplay = () => {
    if (googleDetails?.price_level) {
      return '\u20B9'.repeat(googleDetails.price_level);
    }
    return vendor.price_range;
  };

  const getOverallRating = () => {
    if (googleDetails?.rating) {
      return googleDetails.rating;
    }
    return vendor.rating;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100">
      {/* Image Gallery */}
      <div className="relative h-48 bg-gray-200">
        {vendor.images && vendor.images.length > 0 ? (
          <img src={vendor.images[0]} alt={vendor.name} className="w-full h-full object-cover" />
        ) : googleDetails?.photos && googleDetails.photos.length > 0 ? (
          <img src={googleDetails.photos[0]} alt={vendor.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-rose-50 to-gray-50">
            <span className="text-4xl">{getCategoryEmoji(vendor.category)}</span>
          </div>
        )}

        {googleDetails && (
          <div className="absolute top-3 right-3 bg-white rounded-full px-2 py-1 flex items-center space-x-1 shadow-md">
            <span className="text-xs font-medium text-gray-600">Google</span>
            <Shield className="h-3 w-3 text-gray-600" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{vendor.name}</h3>
            <p className="text-sm text-gray-600 capitalize">{vendor.category}</p>
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-1">
              <Star className="h-4 w-4 text-rose-400 fill-current" />
              <span className="text-sm font-medium">{getOverallRating()}</span>
              {googleDetails?.user_ratings_total && (
                <span className="text-xs text-gray-500">({googleDetails.user_ratings_total})</span>
              )}
            </div>
            <div className="text-sm font-medium text-sage-600 mt-1">{getPriceDisplay()}</div>
          </div>
        </div>

        <p className="text-sm text-gray-700 mb-4 line-clamp-2">{vendor.description}</p>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-1 text-sm text-gray-600">
            <MapPin className="h-4 w-4" />
            <span className="truncate">{vendor.location}</span>
          </div>
          {googleDetails?.opening_hours && (
            <div className={`text-xs px-2 py-1 rounded-full ${
              googleDetails.opening_hours.open_now
                ? 'bg-sage-100 text-sage-800'
                : 'bg-rose-100 text-rose-800'
            }`}>
              {googleDetails.opening_hours.open_now ? 'Open Now' : 'Closed'}
            </div>
          )}
        </div>

        {/* Google Reviews Preview */}
        {googleDetails?.reviews && googleDetails.reviews.length > 0 && (
          <div className="mb-4">
            <button
              onClick={() => setShowReviews(!showReviews)}
              className="text-sm text-gray-600 hover:text-gray-800 font-medium"
            >
              {showReviews ? 'Hide' : 'Show'} Google Reviews ({googleDetails.reviews.length})
            </button>
            {showReviews && (
              <div className="mt-2 space-y-2 max-h-32 overflow-y-auto">
                {googleDetails.reviews.slice(0, 3).map((review, index) => (
                  <div key={index} className="text-xs bg-gray-50 p-2 rounded">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium">{review.author_name}</span>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`h-3 w-3 ${i < review.rating ? 'text-rose-400 fill-current' : 'text-gray-300'}`} />
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-700 line-clamp-2">{review.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          <div className="flex space-x-2">
            <button
              onClick={() => onInquiry && onInquiry(vendor)}
              className="flex-1 bg-salmon-pink text-white px-4 py-2 rounded-lg hover:opacity-90 transition-colors flex items-center justify-center space-x-2"
            >
              <MessageSquare className="h-4 w-4" />
              <span>Send Inquiry</span>
            </button>
            {(vendor.phone || googleDetails?.formatted_phone_number) && (
              <button
                onClick={() => onCallClick && onCallClick(vendor)}
                className="px-4 py-2 border border-sage-500 text-sage-600 rounded-lg hover:bg-sage-50 transition-colors flex items-center space-x-1"
              >
                <Phone className="h-4 w-4" />
                <span>Call</span>
              </button>
            )}
          </div>
          {googleDetails?.website && (
            <a
              href={googleDetails.website}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center space-x-1"
            >
              <ExternalLink className="h-4 w-4" />
              <span>Website</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

const getCategoryEmoji = (category: string): string => {
  const emojis: { [key: string]: string } = {
    'venues': '\uD83C\uDFDB\uFE0F',
    'catering': '\uD83C\uDF7D\uFE0F',
    'photography': '\uD83D\uDCF8',
    'decoration': '\uD83C\uDF38',
    'music': '\uD83C\uDFB5',
    'makeup': '\uD83D\uDC84',
    'entertainment': '\uD83C\uDFAA',
    'default': '\uD83C\uDFAA'
  };
  return emojis[category.toLowerCase()] || emojis.default;
};
