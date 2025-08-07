// Web Image Service for Wedding Preferences
class WebImageService {
    constructor() {
        this.cache = new Map();
        this.fallbackImages = this.initializeFallbacks();
        this.apiKeys = {
            unsplash: 'demo', // For demo - replace with actual API key for production
            pexels: 'demo'    // For demo - replace with actual API key for production
        };
    }

    initializeFallbacks() {
        return {
            decorTheme: {
                traditional: 'https://images.unsplash.com/photo-1583835746434-cf1a2c7e553e?w=400&h=300&fit=crop&q=80',
                modern: 'https://images.unsplash.com/photo-1519167758481-83f29c773c0c?w=400&h=300&fit=crop&q=80',
                rustic: 'https://images.unsplash.com/photo-1464207687429-7505649dae38?w=400&h=300&fit=crop&q=80',
                vintage: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=400&h=300&fit=crop&q=80',
                bollywood: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop&q=80',
                fusion: 'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=400&h=300&fit=crop&q=80'
            },
            cuisineStyle: {
                north_indian: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=300&fit=crop&q=80',
                south_indian: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop&q=80',
                gujarati: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400&h=300&fit=crop&q=80',
                bengali: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&h=300&fit=crop&q=80',
                multi_regional: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop&q=80',
                fusion: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop&q=80'
            },
            photoStyle: {
                traditional: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=400&h=250&fit=crop&q=80',
                candid: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=250&fit=crop&q=80',
                cinematic: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=400&h=250&fit=crop&q=80',
                artistic: 'https://images.unsplash.com/photo-1583835746434-cf1a2c7e553e?w=400&h=250&fit=crop&q=80',
                vintage: 'https://images.unsplash.com/photo-1464207687429-7505649dae38?w=400&h=250&fit=crop&q=80',
                mixed: 'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=400&h=250&fit=crop&q=80'
            },
            venueType: {
                palace: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&h=300&fit=crop&q=80',
                resort: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&h=300&fit=crop&q=80',
                hotel: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop&q=80',
                farmhouse: 'https://images.unsplash.com/photo-1518481612222-68bbe828ecd1?w=400&h=300&fit=crop&q=80',
                destination: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400&h=300&fit=crop&q=80',
                traditional: 'https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=400&h=300&fit=crop&q=80'
            }
        };
    }

    // Enhanced image collections with multiple options per category
    getImageCollections() {
        return {
            decorTheme: {
                traditional: [
                    {
                        url: 'https://images.unsplash.com/photo-1583835746434-cf1a2c7e553e?w=400&h=300&fit=crop&q=80',
                        alt: 'Traditional Indian wedding mandap with marigolds',
                        source: 'unsplash'
                    },
                    {
                        url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop&q=80',
                        alt: 'Royal red and gold wedding decorations',
                        source: 'unsplash'
                    },
                    {
                        url: 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=400&h=300&fit=crop&q=80',
                        alt: 'Traditional wedding ceremony setup',
                        source: 'unsplash'
                    }
                ],
                modern: [
                    {
                        url: 'https://images.unsplash.com/photo-1519167758481-83f29c773c0c?w=400&h=300&fit=crop&q=80',
                        alt: 'Modern minimalist wedding decor',
                        source: 'unsplash'
                    },
                    {
                        url: 'https://images.unsplash.com/photo-1465495976277-4387d4b0e4a6?w=400&h=300&fit=crop&q=80',
                        alt: 'Contemporary wedding centerpiece',
                        source: 'unsplash'
                    },
                    {
                        url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400&h=300&fit=crop&q=80',
                        alt: 'Elegant modern wedding setup',
                        source: 'unsplash'
                    }
                ],
                rustic: [
                    {
                        url: 'https://images.unsplash.com/photo-1464207687429-7505649dae38?w=400&h=300&fit=crop&q=80',
                        alt: 'Rustic outdoor wedding with fairy lights',
                        source: 'unsplash'
                    },
                    {
                        url: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400&h=300&fit=crop&q=80',
                        alt: 'Woodland wedding ceremony',
                        source: 'unsplash'
                    },
                    {
                        url: 'https://images.unsplash.com/photo-1518481612222-68bbe828ecd1?w=400&h=300&fit=crop&q=80',
                        alt: 'Rustic farmhouse wedding decor',
                        source: 'unsplash'
                    }
                ]
            },
            cuisineStyle: {
                north_indian: [
                    {
                        url: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=300&fit=crop&q=80',
                        alt: 'Traditional North Indian thali',
                        source: 'unsplash'
                    },
                    {
                        url: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400&h=300&fit=crop&q=80',
                        alt: 'Punjabi wedding feast',
                        source: 'unsplash'
                    },
                    {
                        url: 'https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?w=400&h=300&fit=crop&q=80',
                        alt: 'Rajasthani cuisine spread',
                        source: 'unsplash'
                    }
                ],
                south_indian: [
                    {
                        url: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop&q=80',
                        alt: 'South Indian banana leaf meal',
                        source: 'unsplash'
                    },
                    {
                        url: 'https://images.unsplash.com/photo-1606491956394-f1ca0ac26530?w=400&h=300&fit=crop&q=80',
                        alt: 'Traditional South Indian dishes',
                        source: 'unsplash'
                    },
                    {
                        url: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&h=300&fit=crop&q=80',
                        alt: 'Kerala wedding feast',
                        source: 'unsplash'
                    }
                ]
            },
            photoStyle: {
                candid: [
                    {
                        url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=250&fit=crop&q=80',
                        alt: 'Candid wedding photography moment',
                        source: 'unsplash'
                    },
                    {
                        url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=400&h=250&fit=crop&q=80',
                        alt: 'Natural wedding photography',
                        source: 'unsplash'
                    },
                    {
                        url: 'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=400&h=250&fit=crop&q=80',
                        alt: 'Emotional candid capture',
                        source: 'unsplash'
                    }
                ],
                cinematic: [
                    {
                        url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=400&h=250&fit=crop&q=80',
                        alt: 'Cinematic wedding photography',
                        source: 'unsplash'
                    },
                    {
                        url: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=400&h=250&fit=crop&q=80',
                        alt: 'Dramatic wedding lighting',
                        source: 'unsplash'
                    },
                    {
                        url: 'https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=400&h=250&fit=crop&q=80',
                        alt: 'Movie-like wedding shot',
                        source: 'unsplash'
                    }
                ]
            }
        };
    }

    async getImagesForCategory(category, subcategory, count = 1) {
        const cacheKey = `${category}_${subcategory}_${count}`;
        
        // Check cache first
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        try {
            // Get from collections first
            const collections = this.getImageCollections();
            if (collections[category] && collections[category][subcategory]) {
                const images = collections[category][subcategory].slice(0, count);
                this.cache.set(cacheKey, images);
                return images;
            }

            // Fallback to single image
            const fallbackUrl = this.fallbackImages[category]?.[subcategory];
            if (fallbackUrl) {
                const fallbackImage = [{
                    url: fallbackUrl,
                    alt: `${subcategory} ${category}`,
                    source: 'fallback'
                }];
                this.cache.set(cacheKey, fallbackImage);
                return fallbackImage;
            }

            throw new Error('No images found');
        } catch (error) {
            console.warn(`Failed to get images for ${category}/${subcategory}:`, error);
            return this.getDefaultImages(category, count);
        }
    }

    getDefaultImages(category, count = 1) {
        const defaultImage = {
            url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMDAgMTUwTDE3NSAxMjVMMTUwIDE1MEwxNzUgMTc1TDIwMCAxNTBaIiBmaWxsPSIjOUI5QkEwIi8+CjwvZz4KPC9zdmc+',
            alt: `${category} placeholder`,
            source: 'placeholder'
        };
        
        return Array(count).fill(defaultImage);
    }

    // Preload images for better performance
    async preloadImages(imageList) {
        const promises = imageList.map(imageInfo => {
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => resolve(true);
                img.onerror = () => resolve(false);
                img.src = imageInfo.url;
            });
        });
        
        return Promise.all(promises);
    }

    // Create image elements with loading states
    createImageElement(imageInfo, options = {}) {
        const {
            className = 'preference-image',
            loadingClass = 'loading',
            errorClass = 'error',
            onLoad = null,
            onError = null
        } = options;

        const container = document.createElement('div');
        container.className = `${className}-container`;
        
        const img = document.createElement('img');
        img.className = `${className} ${loadingClass}`;
        img.alt = imageInfo.alt;
        img.loading = 'lazy';
        
        // Loading state
        container.innerHTML = `
            <div class="image-loading">
                <div class="loading-spinner"></div>
            </div>
        `;

        img.onload = () => {
            img.classList.remove(loadingClass);
            container.innerHTML = '';
            container.appendChild(img);
            if (onLoad) onLoad(img);
        };

        img.onerror = () => {
            img.classList.add(errorClass);
            container.innerHTML = `
                <div class="image-error">
                    <span>🖼️</span>
                    <span>Image unavailable</span>
                </div>
            `;
            if (onError) onError(img);
        };

        img.src = imageInfo.url;
        
        return container;
    }

    // Get random image from category
    async getRandomImage(category, subcategory) {
        const images = await this.getImagesForCategory(category, subcategory, 3);
        const randomIndex = Math.floor(Math.random() * images.length);
        return images[randomIndex];
    }

    // Search for additional images (placeholder for future API integration)
    async searchImages(query, count = 5) {
        // This would integrate with actual image APIs in production
        console.log(`Searching for images: ${query} (${count} results)`);
        
        // For demo, return curated results
        const demoResults = await this.getImagesForCategory('decorTheme', 'modern', count);
        return demoResults;
    }

    // Clear cache
    clearCache() {
        this.cache.clear();
    }

    // Get cache statistics
    getCacheStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }
}

// Export for use in other files
window.WebImageService = WebImageService; 