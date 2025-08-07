// Enhanced Wedding API Service - Modern Integration
class EnhancedWeddingAPIService extends WeddingAPIService {
    constructor() {
        super();
        this.retryAttempts = 0;
        this.maxRetries = 3;
        this.requestQueue = [];
        this.isProcessingQueue = false;
        
        // Initialize enhanced features
        this.setupInterceptors();
        this.startQueueProcessor();
    }

    setupInterceptors() {
        // Add request interceptor for automatic retries and error handling
        this.originalFetch = window.fetch;
        window.fetch = this.interceptFetch.bind(this);
    }

    async interceptFetch(url, options = {}) {
        // Add timeout to all requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const enhancedOptions = {
            ...options,
            signal: controller.signal
        };

        try {
            const response = await this.originalFetch(url, enhancedOptions);
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error('Request timeout - please try again');
            }
            throw error;
        }
    }

    async saveWeddingData(formData) {
        const loadingManager = window.loadingManager;
        const notificationManager = window.notificationManager;

        try {
            if (loadingManager) {
                loadingManager.show('Saving Wedding Data', 'Securely storing your information...');
            }

            console.log('💾 Saving wedding data...', formData);

            const response = await fetch(`${this.baseURL}${this.endpoints.weddingData}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();

            if (result.success) {
                console.log('✅ Wedding data saved successfully');
                
                if (notificationManager) {
                    notificationManager.show('Wedding data saved successfully!', 'success');
                }

                // Update local storage as backup
                this.updateLocalBackup('weddingData', formData);
                
                return result;
            } else {
                throw new Error(result.error || 'Failed to save wedding data');
            }

        } catch (error) {
            console.error('❌ Failed to save wedding data:', error);
            
            // Fallback to local storage
            const localResult = this.saveToLocalStorage('weddingData', formData);
            
            if (notificationManager) {
                notificationManager.show(
                    'Saved locally - will sync when connection is restored', 
                    'warning', 
                    5000
                );
            }
            
            return localResult;
        } finally {
            if (loadingManager) {
                loadingManager.hide();
            }
        }
    }

    async saveVisualPreferences(preferencesData) {
        const loadingManager = window.loadingManager;
        const notificationManager = window.notificationManager;

        try {
            if (loadingManager) {
                loadingManager.show('Saving Preferences', 'Storing your style choices...');
            }

            console.log('🎨 Saving visual preferences...', preferencesData);

            const response = await fetch(`${this.baseURL}${this.endpoints.visualPreferences}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(preferencesData)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();

            if (result.success) {
                console.log('✅ Visual preferences saved successfully');
                
                if (notificationManager) {
                    notificationManager.show('Style preferences saved! 🎨', 'success');
                }

                // Update local storage as backup
                this.updateLocalBackup('visualPreferences', preferencesData);
                
                return result;
            } else {
                throw new Error(result.error || 'Failed to save preferences');
            }

        } catch (error) {
            console.error('❌ Failed to save visual preferences:', error);
            
            // Fallback to local storage
            const localResult = this.saveToLocalStorage('visualPreferences', preferencesData);
            
            if (notificationManager) {
                notificationManager.show(
                    'Preferences saved locally - will sync when online', 
                    'warning', 
                    5000
                );
            }
            
            return localResult;
        } finally {
            if (loadingManager) {
                loadingManager.hide();
            }
        }
    }

    async getAllWeddingData() {
        try {
            console.log('📊 Fetching all wedding data...');

            const response = await fetch(`${this.baseURL}${this.endpoints.weddingData}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();

            if (result.success) {
                console.log('✅ Wedding data retrieved successfully');
                return result.data;
            } else {
                throw new Error(result.error || 'Failed to retrieve wedding data');
            }

        } catch (error) {
            console.error('❌ Failed to retrieve wedding data:', error);
            
            // Fallback to local storage
            return this.getFromLocalStorage();
        }
    }

    async getVendors(filters = {}) {
        try {
            console.log('🔍 Fetching vendors...', filters);

            let url = `${this.baseURL}${this.endpoints.vendors}`;
            if (Object.keys(filters).length > 0) {
                const params = new URLSearchParams(filters);
                url += `?${params.toString()}`;
            }

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();

            if (result.success) {
                console.log('✅ Vendors retrieved successfully');
                return result.data;
            } else {
                throw new Error(result.error || 'Failed to retrieve vendors');
            }

        } catch (error) {
            console.error('❌ Failed to retrieve vendors:', error);
            return this.getMockVendors(filters);
        }
    }

    saveToLocalStorage(type, data) {
        try {
            const key = `bidai_${type}`;
            const timestamp = new Date().toISOString();
            
            const localData = {
                data,
                timestamp,
                isLocal: true,
                needsSync: true
            };

            localStorage.setItem(key, JSON.stringify(localData));
            
            return {
                success: true,
                message: 'Saved to local storage',
                isLocal: true,
                timestamp
            };
        } catch (error) {
            console.error('Failed to save to localStorage:', error);
            return {
                success: false,
                error: 'Failed to save locally'
            };
        }
    }

    updateLocalBackup(type, data) {
        try {
            const key = `bidai_${type}_backup`;
            const timestamp = new Date().toISOString();
            
            localStorage.setItem(key, JSON.stringify({
                data,
                timestamp,
                synchronized: true
            }));
        } catch (error) {
            console.error('Failed to update local backup:', error);
        }
    }

    getFromLocalStorage() {
        try {
            const weddingData = localStorage.getItem('bidai_weddingData');
            const visualPreferences = localStorage.getItem('bidai_visualPreferences');
            
            return {
                couples: weddingData ? [JSON.parse(weddingData)] : [],
                preferences: visualPreferences ? [JSON.parse(visualPreferences)] : [],
                isLocal: true
            };
        } catch (error) {
            console.error('Failed to retrieve from localStorage:', error);
            return {
                couples: [],
                preferences: [],
                isLocal: true
            };
        }
    }

    getMockVendors(filters) {
        // Return mock vendor data for offline mode
        return [
            {
                id: 'mock_1',
                name: 'Elite Wedding Photography',
                category: 'Photography',
                rating: 4.8,
                price_range: '₹25,000 - ₹75,000',
                location: filters.location || 'Mumbai',
                services: ['Pre-wedding', 'Wedding Day', 'Reception'],
                contact: {
                    phone: '+91 98765 43210',
                    email: 'info@elitewedding.com'
                }
            },
            {
                id: 'mock_2',
                name: 'Royal Caterers',
                category: 'Catering',
                rating: 4.6,
                price_range: '₹800 - ₹1,500 per plate',
                location: filters.location || 'Mumbai',
                services: ['North Indian', 'South Indian', 'Continental'],
                contact: {
                    phone: '+91 98765 43211',
                    email: 'info@royalcaterers.com'
                }
            },
            {
                id: 'mock_3',
                name: 'Dreamland Decorators',
                category: 'Decoration',
                rating: 4.7,
                price_range: '₹50,000 - ₹2,00,000',
                location: filters.location || 'Mumbai',
                services: ['Mandap Decoration', 'Stage Decoration', 'Flower Arrangements'],
                contact: {
                    phone: '+91 98765 43212',
                    email: 'info@dreamlanddecorators.com'
                }
            }
        ];
    }

    startQueueProcessor() {
        // Process queued requests when connection is restored
        setInterval(() => {
            if (this.isConnected && this.requestQueue.length > 0 && !this.isProcessingQueue) {
                this.processQueue();
            }
        }, 5000);
    }

    async processQueue() {
        if (this.isProcessingQueue || this.requestQueue.length === 0) {
            return;
        }

        this.isProcessingQueue = true;
        const notificationManager = window.notificationManager;

        if (notificationManager) {
            notificationManager.show('Syncing queued data...', 'info');
        }

        try {
            while (this.requestQueue.length > 0) {
                const request = this.requestQueue.shift();
                await this.executeQueuedRequest(request);
            }

            if (notificationManager) {
                notificationManager.show('All data synchronized! ✅', 'success');
            }
        } catch (error) {
            console.error('Queue processing error:', error);
            if (notificationManager) {
                notificationManager.show('Some data could not be synchronized', 'warning');
            }
        } finally {
            this.isProcessingQueue = false;
        }
    }

    async executeQueuedRequest(request) {
        try {
            switch (request.type) {
                case 'weddingData':
                    return await this.saveWeddingData(request.data);
                case 'visualPreferences':
                    return await this.saveVisualPreferences(request.data);
                default:
                    console.warn('Unknown request type:', request.type);
            }
        } catch (error) {
            console.error('Failed to execute queued request:', error);
            throw error;
        }
    }

    queueRequest(type, data) {
        this.requestQueue.push({
            type,
            data,
            timestamp: new Date().toISOString()
        });
    }
}

// Initialize enhanced API service
window.weddingAPIService = new EnhancedWeddingAPIService();

// Global convenience functions
window.saveWeddingData = (data) => window.weddingAPIService.saveWeddingData(data);
window.saveVisualPreferences = (data) => window.weddingAPIService.saveVisualPreferences(data);
window.getAllWeddingData = () => window.weddingAPIService.getAllWeddingData();
window.getVendors = (filters) => window.weddingAPIService.getVendors(filters); 