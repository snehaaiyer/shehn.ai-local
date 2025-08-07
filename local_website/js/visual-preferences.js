// Visual Preferences Manager for BID AI Wedding Assistant
class VisualPreferencesManager {
    constructor() {
        this.visualData = {
            decorTheme: '',
            cuisineStyle: '',
            photoStyle: '',
            venueType: '',
            specialRequests: ''
        };

        this.weddingContext = {};
        this.isInitialized = false;
        
        this.container = document.getElementById('visual-preferences-container');
        
        // Initialize the web image service
        this.imageService = new WebImageService();
        
        this.init();
    }

    async init() {
        this.loadData();
        await this.initialize();
        this.render();
        this.addStyles();
    }

    loadData() {
        // Fallback to localStorage if weddingStorage is not available
        let storedData = {};
        let weddingContext = {};
        
        try {
            if (window.weddingStorage) {
                storedData = window.weddingStorage.getVisualPreferences() || {};
                weddingContext = window.weddingStorage.getWeddingForm() || {};
            } else {
                storedData = JSON.parse(localStorage.getItem('visual_preferences') || '{}');
                weddingContext = JSON.parse(localStorage.getItem('wedding_data') || '{}');
            }
        } catch (error) {
            console.warn('Error loading data:', error);
            storedData = {};
            weddingContext = {};
        }
        
        this.visualData = { ...this.visualData, ...storedData };
        this.weddingContext = weddingContext;
    }

    async initialize() {
        if (this.isInitialized) return this.visualData;
        
        try {
            this.isInitialized = true;
            return this.visualData;
        } catch (error) {
            console.error('Initialization error:', error);
            return {};
        }
    }

    updateField(field, value) {
        this.visualData[field] = value;
        this.saveDraft();
        return this.visualData;
    }

    saveDraft() {
        try {
            if (window.weddingStorage) {
                window.weddingStorage.saveVisualPreferences(this.visualData);
            } else {
                localStorage.setItem('visual_preferences', JSON.stringify(this.visualData));
            }
            return { success: true, message: "Visual preferences saved!" };
        } catch (error) {
            console.error('Save error:', error);
            return { success: false, message: "Error saving preferences" };
        }
    }

    getData() {
        return {
            visualData: this.visualData,
            weddingContext: this.weddingContext,
            progress: this.calculateProgress()
        };
    }

    setData(newData) {
        if (newData.visualData) {
            this.visualData = { ...this.visualData, ...newData.visualData };
        }
        if (newData.weddingContext) {
            this.weddingContext = { ...this.weddingContext, ...newData.weddingContext };
        }
        this.saveDraft();
        return this.getData();
    }

    calculateProgress() {
        const fields = ['decorTheme', 'cuisineStyle', 'photoStyle', 'venueType'];
        const completed = fields.filter(field => this.visualData[field] && this.visualData[field].trim()).length;
        return Math.round((completed / fields.length) * 100);
    }

    validate() {
        const errors = [];
        if (!this.visualData.decorTheme) errors.push("Decoration theme is required");
        if (!this.visualData.cuisineStyle) errors.push("Cuisine style is required");
        if (!this.visualData.photoStyle) errors.push("Photography style is required");
        if (!this.visualData.venueType) errors.push("Venue type is required");
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    render() {
        if (!this.container) return;

        this.container.innerHTML = this.getHTML();
        this.attachEventListeners();
        this.loadAllImages();
    }

    async loadAllImages() {
        // Load images for all categories
        await Promise.all([
            this.loadImagesForCategory('decorTheme'),
            this.loadImagesForCategory('cuisineStyle'),
            this.loadImagesForCategory('photoStyle'),
            this.loadImagesForCategory('venueType')
        ]);
    }

    async loadImagesForCategory(category) {
        const cards = document.querySelectorAll(`[data-category="${category}"]`);
        
        for (const card of cards) {
            const subcategory = card.dataset.subcategory;
            const imageContainer = card.querySelector('.preference-image-container');
            
            if (imageContainer) {
                try {
                    const images = await this.imageService.getImagesForCategory(category, subcategory, 1);
                    const imageElement = this.imageService.createImageElement(images[0], {
                        className: 'preference-image',
                        onLoad: () => {
                            card.classList.add('image-loaded');
                        }
                    });
                    imageContainer.appendChild(imageElement);
                } catch (error) {
                    console.warn(`Failed to load image for ${category}/${subcategory}:`, error);
                }
            }
        }
    }

    getHTML() {
        const coupleName = this.weddingContext.yourName && this.weddingContext.partnerName 
            ? `${this.weddingContext.yourName} & ${this.weddingContext.partnerName}`
            : "Beautiful Couple";

        return `
            <div class="card">
                <div class="card-header">
                    <h1 class="card-title">🎨 Visual Style & Preferences</h1>
                    <h2 class="couple-title">${coupleName}</h2>
                    <p class="card-subtitle">Tell us about your dream wedding aesthetic</p>
                    <div class="progress-section">
                        <div class="progress">
                            <div class="progress-fill" style="width: ${this.calculateProgress()}%"></div>
                        </div>
                        <span class="progress-text">${this.calculateProgress()}% Complete</span>
                    </div>
                </div>

                <div class="preferences-content">
                    ${this.renderDecorationTheme()}
                    ${this.renderCuisineStyle()}
                    ${this.renderPhotographyStyle()}
                    ${this.renderVenueType()}
                    ${this.renderSpecialRequests()}
                    
                    <div class="form-actions">
                        <button type="button" class="btn btn-outline" id="save-draft-btn">
                            💾 Save Draft
                        </button>
                        <button type="button" class="btn btn-secondary" id="get-recommendations-btn">
                            🤖 Get AI Recommendations
                        </button>
                        <button type="button" class="btn btn-primary" id="complete-setup-btn">
                            ◊ Complete Setup
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    renderDecorationTheme() {
        const themes = [
            { 
                id: 'traditional', 
                title: 'Traditional Royal', 
                desc: 'Rich reds, gold accents, marigold flowers',
                colors: ['#8B0000', '#FFD700', '#FF4500', '#8B4513'],
                style: 'background: linear-gradient(135deg, #8B0000 0%, #FFD700 100%)'
            },
            { 
                id: 'modern', 
                title: 'Modern Elegant', 
                desc: 'Minimal pastels, geometric patterns, clean lines',
                colors: ['#F8F8FF', '#E6E6FA', '#DDA0DD', '#C0C0C0'],
                style: 'background: linear-gradient(135deg, #F8F8FF 0%, #E6E6FA 100%)'
            },
            { 
                id: 'rustic', 
                title: 'Rustic Charm', 
                desc: 'Earthy tones, wooden elements, fairy lights',
                colors: ['#8FBC8F', '#DEB887', '#CD853F', '#F5DEB3'],
                style: 'background: linear-gradient(135deg, #8FBC8F 0%, #DEB887 100%)'
            },
            { 
                id: 'vintage', 
                title: '🕰️ Vintage Romance', 
                desc: 'Antique gold, pearls, lace details',
                colors: ['#F5F5DC', '#DEB887', '#D2B48C', '#BC8F8F'],
                style: 'background: linear-gradient(135deg, #F5F5DC 0%, #DEB887 100%)'
            },
            { 
                id: 'bollywood', 
                title: '🎬 Bollywood Glam', 
                desc: 'Bright colors, dramatic drapes, crystal accents',
                colors: ['#FF1493', '#FFD700', '#00CED1', '#FF6347'],
                style: 'background: linear-gradient(135deg, #FF1493 0%, #FFD700 50%, #00CED1 100%)'
            },
            { 
                id: 'fusion', 
                title: 'Indo-Western', 
                desc: 'Mix of cultures, contemporary with traditional touches',
                colors: ['#9370DB', '#20B2AA', '#FF6B6B', '#FFD700'],
                style: 'background: linear-gradient(135deg, #9370DB 0%, #20B2AA 50%, #FF6B6B 100%)'
            }
        ];

        return `
            <div class="preferences-section">
                <h3 class="section-title">🎨 Decoration Theme</h3>
                <p class="section-desc">Choose the visual style that speaks to your heart</p>
                
                <div class="theme-image-gallery">
                    <h4>✨ Style Inspiration</h4>
                    <div class="image-preview-grid">
                        ${themes.slice(0, 3).map(theme => `
                            <div class="theme-preview" data-theme="${theme.id}">
                                <div class="preview-image-container">
                                    <div class="preview-placeholder" style="${theme.style}">
                                        <span class="preview-icon">${theme.title.split(' ')[0]}</span>
                                    </div>
                                </div>
                                <span class="preview-label">${theme.title}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="options-grid theme-grid">
                    ${themes.map(theme => `
                        <div class="option-card theme-card image-card ${this.visualData.decorTheme === theme.id ? 'selected' : ''}" 
                             data-field="decorTheme" 
                             data-value="${theme.id}"
                             data-category="decorTheme"
                             data-subcategory="${theme.id}">
                            <input type="radio" name="decorTheme" value="${theme.id}" 
                                   ${this.visualData.decorTheme === theme.id ? 'checked' : ''}>
                            
                            <div class="card-image-section">
                                <div class="preference-image-container">
                                    <div class="image-placeholder" style="${theme.style}">
                                        <div class="loading-spinner"></div>
                                    </div>
                                </div>
                                <div class="image-overlay">
                                    <span class="theme-icon">${theme.title.split(' ')[0]}</span>
                                </div>
                            </div>
                            
                            <div class="card-content">
                                <div class="option-title">${theme.title}</div>
                                <div class="option-description">${theme.desc}</div>
                                <div class="color-palette">
                                    ${theme.colors.map(color => `<div class="color-dot" style="background: ${color}"></div>`).join('')}
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    renderCuisineStyle() {
        const cuisines = [
            { 
                id: 'north_indian', 
                title: '🍛 North Indian', 
                desc: 'Punjabi, Rajasthani, Delhi cuisines',
                spice: '🌶️🌶️🌶️',
                style: 'background: linear-gradient(135deg, #FF6347 0%, #FFD700 100%)'
            },
            { 
                id: 'south_indian', 
                title: '🥥 South Indian', 
                desc: 'Tamil, Telugu, Kerala specialties',
                spice: '🌶️🌶️🌶️🌶️',
                style: 'background: linear-gradient(135deg, #228B22 0%, #FFD700 100%)'
            },
            { 
                id: 'gujarati', 
                title: '🧈 Gujarati', 
                desc: 'Sweet & savory vegetarian delights',
                spice: '🌶️🌶️',
                style: 'background: linear-gradient(135deg, #FFA500 0%, #FFFF00 100%)'
            },
            { 
                id: 'bengali', 
                title: '🐟 Bengali', 
                desc: 'Fish, rice, sweets & mishti',
                spice: '🌶️🌶️',
                style: 'background: linear-gradient(135deg, #4682B4 0%, #F0E68C 100%)'
            },
            { 
                id: 'multi_regional', 
                title: '🗺️ Multi-Regional', 
                desc: 'Best from different Indian regions',
                spice: '🌶️🌶️🌶️',
                style: 'background: linear-gradient(135deg, #FF6347 0%, #32CD32 50%, #FFD700 100%)'
            },
            { 
                id: 'fusion', 
                title: '🌍 Indo-Global', 
                desc: 'Indian fusion with international flavors',
                spice: '🌶️🌶️',
                style: 'background: linear-gradient(135deg, #9370DB 0%, #FF6347 50%, #32CD32 100%)'
            }
        ];

        return `
            <div class="preferences-section">
                <h3 class="section-title">Cuisine Style</h3>
                <p class="section-desc">What flavors will delight your guests?</p>
                
                <div class="cuisine-preview">
                    <div class="flavor-meter">
                        <h4>🌶️ Spice Level Guide</h4>
                        <div class="spice-legend">
                            <span>🌶️ Mild</span>
                            <span>🌶️🌶️ Medium</span>
                            <span>🌶️🌶️🌶️ Spicy</span>
                            <span>🌶️🌶️🌶️🌶️ Very Hot</span>
                        </div>
                    </div>
                </div>
                
                <div class="options-grid cuisine-grid">
                    ${cuisines.map(cuisine => `
                        <div class="option-card cuisine-card image-card ${this.visualData.cuisineStyle === cuisine.id ? 'selected' : ''}" 
                             data-field="cuisineStyle" 
                             data-value="${cuisine.id}"
                             data-category="cuisineStyle"
                             data-subcategory="${cuisine.id}">
                            <input type="radio" name="cuisineStyle" value="${cuisine.id}" 
                                   ${this.visualData.cuisineStyle === cuisine.id ? 'checked' : ''}>
                            
                            <div class="card-image-section">
                                <div class="preference-image-container">
                                    <div class="image-placeholder" style="${cuisine.style}">
                                        <div class="loading-spinner"></div>
                                    </div>
                                </div>
                                <div class="image-overlay">
                                    <div class="spice-level">${cuisine.spice}</div>
                                </div>
                            </div>
                            
                            <div class="card-content">
                                <div class="option-title">${cuisine.title}</div>
                                <div class="option-description">${cuisine.desc}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    renderPhotographyStyle() {
        const styles = [
            { 
                id: 'traditional', 
                title: 'Traditional', 
                desc: 'Classic poses, formal arrangements',
                style: 'background: linear-gradient(135deg, #8B4513 0%, #DAA520 100%)'
            },
            { 
                id: 'candid', 
                title: '📷 Candid', 
                desc: 'Natural moments, emotional captures',
                style: 'background: linear-gradient(135deg, #228B22 0%, #90EE90 100%)'
            },
            { 
                id: 'cinematic', 
                title: '🎬 Cinematic', 
                desc: 'Movie-like shots, dramatic lighting',
                style: 'background: linear-gradient(135deg, #2F4F4F 0%, #708090 100%)'
            },
            { 
                id: 'artistic', 
                title: '🎨 Artistic', 
                desc: 'Creative angles, unique compositions',
                style: 'background: linear-gradient(135deg, #9370DB 0%, #DA70D6 100%)'
            },
            { 
                id: 'vintage', 
                title: '📽️ Vintage', 
                desc: 'Film-like, nostalgic feel',
                style: 'background: linear-gradient(135deg, #D2B48C 0%, #F5DEB3 100%)'
            },
            { 
                id: 'mixed', 
                title: 'Mixed Style', 
                desc: 'Combination of different approaches',
                style: 'background: linear-gradient(135deg, #FF6347 0%, #32CD32 50%, #1E90FF 100%)'
            }
        ];

        return `
            <div class="preferences-section">
                <h3 class="section-title">Photography Style</h3>
                <p class="section-desc">How do you want your memories captured?</p>
                
                <div class="photo-gallery">
                    <h4>📷 Style Samples</h4>
                    <div class="photo-samples">
                        <div class="photo-sample" data-style="traditional">📸</div>
                        <div class="photo-sample" data-style="cinematic">🎬</div>
                        <div class="photo-sample" data-style="artistic">🎨</div>
                        <div class="photo-sample" data-style="vintage">📽️</div>
                    </div>
                </div>
                
                <div class="options-grid photo-style-grid">
                    ${styles.map(style => `
                        <div class="option-card photo-card image-card ${this.visualData.photoStyle === style.id ? 'selected' : ''}" 
                             data-field="photoStyle" 
                             data-value="${style.id}"
                             data-category="photoStyle"
                             data-subcategory="${style.id}">
                            <input type="radio" name="photoStyle" value="${style.id}" 
                                   ${this.visualData.photoStyle === style.id ? 'checked' : ''}>
                            
                            <div class="card-image-section photo-aspect">
                                <div class="preference-image-container">
                                    <div class="image-placeholder" style="${style.style}">
                                        <div class="loading-spinner"></div>
                                    </div>
                                </div>
                                <div class="image-overlay">
                                    <span class="photo-icon">${style.title.split(' ')[0]}</span>
                                </div>
                            </div>
                            
                            <div class="card-content">
                                <div class="option-title">${style.title}</div>
                                <div class="option-description">${style.desc}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    renderVenueType() {
        const venues = [
            { 
                id: 'palace', 
                title: 'Heritage Palace', 
                desc: 'Royal palaces, forts, havelis',
                style: 'background: linear-gradient(135deg, #8B4513 0%, #DAA520 100%)'
            },
            { 
                id: 'resort', 
                title: '🏖️ Luxury Resort', 
                desc: 'Beach, hill station, lake resorts',
                style: 'background: linear-gradient(135deg, #20B2AA 0%, #87CEEB 100%)'
            },
            { 
                id: 'hotel', 
                title: '🏨 Premium Hotel', 
                desc: '5-star hotels, banquet halls',
                style: 'background: linear-gradient(135deg, #2F4F4F 0%, #708090 100%)'
            },
            { 
                id: 'farmhouse', 
                title: '🌾 Farmhouse', 
                desc: 'Private farmhouses, outdoor settings',
                style: 'background: linear-gradient(135deg, #8FBC8F 0%, #DEB887 100%)'
            },
            { 
                id: 'destination', 
                title: '✈️ Destination', 
                desc: 'Goa, Udaipur, international locations',
                style: 'background: linear-gradient(135deg, #FF6347 0%, #32CD32 50%, #1E90FF 100%)'
            },
            { 
                id: 'traditional', 
                title: '🕉️ Traditional Hall', 
                desc: 'Marriage halls, community centers',
                style: 'background: linear-gradient(135deg, #8B0000 0%, #FFD700 100%)'
            }
        ];

        return `
            <div class="preferences-section">
                <h3 class="section-title">Venue Type</h3>
                <p class="section-desc">What setting do you envision for your celebration?</p>
                
                <div class="options-grid venue-grid">
                    ${venues.map(venue => `
                        <div class="option-card venue-card image-card ${this.visualData.venueType === venue.id ? 'selected' : ''}" 
                             data-field="venueType" 
                             data-value="${venue.id}"
                             data-category="venueType"
                             data-subcategory="${venue.id}">
                            <input type="radio" name="venueType" value="${venue.id}" 
                                   ${this.visualData.venueType === venue.id ? 'checked' : ''}>
                            
                            <div class="card-image-section">
                                <div class="preference-image-container">
                                    <div class="image-placeholder" style="${venue.style}">
                                        <div class="loading-spinner"></div>
                                    </div>
                                </div>
                                <div class="image-overlay">
                                    <span class="venue-icon">${venue.title.split(' ')[0]}</span>
                                </div>
                            </div>
                            
                            <div class="card-content">
                                <div class="option-title">${venue.title}</div>
                                <div class="option-description">${venue.desc}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    renderSpecialRequests() {
        return `
            <div class="preferences-section">
                <h3 class="section-title">💬 Special Requests</h3>
                <p class="section-desc">Any specific style preferences or cultural requirements?</p>
                
                <div class="form-group">
                    <textarea 
                        class="form-textarea" 
                        id="specialRequests" 
                        rows="4" 
                        placeholder="Describe any specific visual preferences, cultural requirements, or special touches you'd like..."
                    >${this.visualData.specialRequests}</textarea>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        // Option cards
        document.querySelectorAll('.option-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const field = e.currentTarget.getAttribute('data-field');
                const value = e.currentTarget.getAttribute('data-value');
                
                if (field && value) {
                    this.selectOption(field, value);
                }
            });
        });

        // Special requests textarea
        const specialRequestsTextarea = document.getElementById('specialRequests');
        if (specialRequestsTextarea) {
            specialRequestsTextarea.addEventListener('change', (e) => {
                this.updateField('specialRequests', e.target.value);
            });
        }

        // Buttons
        document.getElementById('save-draft-btn').addEventListener('click', () => this.handleSaveDraft());
        document.getElementById('get-recommendations-btn').addEventListener('click', () => this.getRecommendations());
        document.getElementById('complete-setup-btn').addEventListener('click', () => this.completeSetup());
    }

    selectOption(field, value) {
        // Update data
        this.updateField(field, value);
        
        // Update visual state
        const fieldCards = document.querySelectorAll(`[data-field="${field}"]`);
        fieldCards.forEach(card => {
            card.classList.remove('selected');
            const radio = card.querySelector('input[type="radio"]');
            if (radio) radio.checked = false;
        });
        
        const selectedCard = document.querySelector(`[data-field="${field}"][data-value="${value}"]`);
        if (selectedCard) {
            selectedCard.classList.add('selected');
            const radio = selectedCard.querySelector('input[type="radio"]');
            if (radio) radio.checked = true;
        }
        
        // Update progress
        this.updateProgressDisplay();
    }

    updateProgressDisplay() {
        const progressFill = document.querySelector('.progress-fill');
        const progressText = document.querySelector('.progress-text');
        const progress = this.calculateProgress();
        
        if (progressFill) progressFill.style.width = `${progress}%`;
        if (progressText) progressText.textContent = `${progress}% Complete`;
    }

    handleSaveDraft() {
        const result = this.saveDraft();
        this.showMessage(result.message, result.success ? 'success' : 'error');
    }

    getRecommendations() {
        const recommendations = this.generateRecommendations();
        this.showMessage(`🤖 AI Recommendation: ${recommendations}`, 'info');
    }

    generateRecommendations() {
        const region = this.weddingContext.region || 'North Indian';
        const budget = this.weddingContext.budgetRange || '₹20-30 Lakhs';
        
        if (region.includes('North')) {
            return "For North Indian weddings, consider Traditional Royal theme with rich red and gold decorations, paired with North Indian cuisine and heritage palace venues for an authentic experience.";
        } else if (region.includes('South')) {
            return "South Indian weddings look beautiful with Traditional Royal or Modern Elegant themes, featuring temple-style decorations and authentic South Indian cuisine.";
        } else {
            return "Based on your preferences, a fusion of traditional and modern elements would create a unique celebration that honors your heritage while reflecting contemporary style.";
        }
    }

    completeSetup() {
        const validation = this.validate();
        
        if (!validation.isValid) {
            this.showMessage(`Please complete: ${validation.errors.join(', ')}`, 'error');
            return;
        }

        this.saveDraft();
        this.showMessage('Visual preferences completed! Your wedding planning setup is now complete.', 'success');
        
        // Navigate back to dashboard
        setTimeout(() => {
            if (window.navigationManager) {
                window.navigationManager.navigateTo('dashboard');
            }
        }, 2000);
    }

    showMessage(message, type = 'info') {
        const existingMessage = document.querySelector('.preferences-message');
        if (existingMessage) existingMessage.remove();

        const messageEl = document.createElement('div');
        messageEl.className = `preferences-message preferences-message-${type}`;
        messageEl.textContent = message;
        
        const formActions = document.querySelector('.form-actions');
        if (formActions) {
            formActions.parentNode.insertBefore(messageEl, formActions);
            
            setTimeout(() => {
                if (messageEl.parentNode) {
                    messageEl.parentNode.removeChild(messageEl);
                }
            }, 4000);
        }
    }

    refresh() {
        this.loadData();
        this.render();
    }

    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .couple-title {
                color: var(--primary-gold);
                font-size: 1.25rem;
                font-weight: 600;
                margin-bottom: 0.5rem;
            }
            
            .progress-section {
                max-width: 300px;
                margin: 0 auto;
            }
            
            .preferences-content {
                margin-bottom: 1.5rem;
            }
            
            .preferences-section {
                background: var(--gray-50);
                border-radius: 12px;
                padding: 1.5rem;
                margin-bottom: 1.5rem;
                border: 1px solid var(--gray-200);
            }
            
            .section-title {
                color: var(--primary-gold);
                font-size: 1.125rem;
                font-weight: 600;
                margin-bottom: 0.5rem;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            
            .section-desc {
                color: var(--gray-500);
                font-size: 0.875rem;
                margin-bottom: 1rem;
            }
            
            .options-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 0.75rem;
            }
            
            .option-card {
                background: white;
                border: 2px solid var(--gray-200);
                border-radius: 12px;
                padding: 1rem;
                cursor: pointer;
                transition: all 0.2s ease;
                position: relative;
            }
            
            .option-card:hover {
                border-color: var(--primary-gold);
                transform: translateY(-2px);
                box-shadow: var(--shadow-hover);
            }
            
            .option-card.selected {
                border-color: var(--primary-gold);
                background: var(--gold-bg);
                transform: translateY(-1px);
                box-shadow: var(--shadow-hover);
            }
            
            .option-card input[type="radio"] {
                position: absolute;
                top: 0.75rem;
                right: 0.75rem;
                accent-color: var(--primary-gold);
            }
            
            .option-title {
                font-weight: 600;
                color: var(--gray-700);
                margin-bottom: 0.5rem;
                font-size: 0.875rem;
            }
            
            .option-description {
                font-size: 0.75rem;
                color: var(--gray-500);
                line-height: 1.4;
            }
            
            .form-actions {
                display: flex;
                justify-content: center;
                gap: 1rem;
                padding-top: 1.5rem;
                border-top: 1px solid var(--gray-200);
                flex-wrap: wrap;
            }
            
            .preferences-message {
                padding: 1rem;
                border-radius: 8px;
                margin-bottom: 1rem;
                font-size: 0.875rem;
                text-align: center;
                line-height: 1.5;
            }
            
            .preferences-message-success {
                background: #DCFCE7;
                border: 1px solid #BBF7D0;
                color: #16A34A;
            }
            
            .preferences-message-error {
                background: #FEE2E2;
                border: 1px solid #FECACA;
                color: #DC2626;
            }
            
            .preferences-message-info {
                background: var(--gold-bg);
                border: 1px solid #F3E8B8;
                color: var(--primary-gold);
            }
            
            @media (max-width: 768px) {
                .options-grid {
                    grid-template-columns: 1fr;
                }
                
                .preferences-section {
                    padding: 1rem;
                }
                
                .form-actions {
                    flex-direction: column;
                    align-items: center;
                }
                
                .form-actions .btn {
                    width: 100%;
                    max-width: 300px;
                }
            }
            
            @media (max-width: 480px) {
                .option-card {
                    padding: 0.75rem;
                }
                
                .option-title {
                    font-size: 0.75rem;
                }
                
                .option-description {
                    font-size: 0.675rem;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.visualPreferencesManager = new VisualPreferencesManager();
}); 