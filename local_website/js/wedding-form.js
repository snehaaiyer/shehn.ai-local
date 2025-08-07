// Wedding Form Manager for BID AI Wedding Assistant
class WeddingFormManager {
    constructor() {
        this.formData = {
            yourName: "",
            partnerName: "",
            contactNumber: "",
            email: "",
            region: "North Indian",
            weddingType: "Traditional Hindu",
            primaryCity: "Mumbai",
            weddingDate: "",
            guestCount: 200,
            budgetRange: "₹20-30 Lakhs",
            ceremonies: [],
            priorityAreas: [],
            dietaryRequirements: [],
            specialRequests: ""
        };

        this.formOptions = {
            regions: [
                { id: "north", label: "North Indian", traditions: ["Baraat", "Saat Phere", "Bidaai"] },
                { id: "south", label: "South Indian", traditions: ["Mangalsutra", "Saptapadi", "Kanyadaan"] },
                { id: "bengali", label: "Bengali", traditions: ["Gaye Holud", "Bor Jatri", "Shubho Drishti"] },
                { id: "gujarati", label: "Gujarati", traditions: ["Garba", "Pithi", "Varmala"] },
                { id: "punjabi", label: "Punjabi", traditions: ["Chooda", "Kalire", "Jaggo"] },
                { id: "marathi", label: "Marathi", traditions: ["Haldi", "Mangalashtak", "Saptapadi"] }
            ],
            
            weddingTypes: [
                { id: "hindu", label: "Traditional Hindu", ceremonies: ["Mehendi", "Sangam", "Haldi", "Wedding", "Reception"] },
                { id: "sikh", label: "Sikh", ceremonies: ["Roka", "Sangeet", "Anand Karaj", "Reception"] },
                { id: "muslim", label: "Muslim", ceremonies: ["Mangni", "Mehendi", "Nikah", "Walima"] },
                { id: "christian", label: "Christian", ceremonies: ["Engagement", "Bachelor Party", "Wedding", "Reception"] },
                { id: "interfaith", label: "Inter-faith", ceremonies: ["Engagement", "Cultural Ceremony", "Wedding", "Reception"] }
            ],
            
            cities: ["Mumbai", "Delhi", "Bangalore", "Chennai", "Kolkata", "Pune", "Hyderabad", "Jaipur", "Udaipur", "Goa"],
            
            budgetRanges: [
                { id: "budget", label: "Under ₹10 Lakhs", value: "Under ₹10 Lakhs" },
                { id: "midrange", label: "₹10-20 Lakhs", value: "₹10-20 Lakhs" },
                { id: "premium", label: "₹20-30 Lakhs", value: "₹20-30 Lakhs" },
                { id: "luxury", label: "₹30-50 Lakhs", value: "₹30-50 Lakhs" },
                { id: "ultra", label: "Above ₹50 Lakhs", value: "Above ₹50 Lakhs" }
            ],
            
            ceremonies: [
                { id: "mehendi", label: "🌿 Mehendi", duration: "4 hours" },
                { id: "sangam", label: "🎵 Sangam/Sangeet", duration: "3 hours" },
                { id: "haldi", label: "🌼 Haldi", duration: "2 hours" },
                { id: "engagement", label: "💍 Engagement", duration: "2 hours" },
                { id: "wedding", label: "👰 Wedding Ceremony", duration: "4 hours" },
                { id: "reception", label: "🎉 Reception", duration: "4 hours" }
            ],
            
            priorityAreas: [
                { id: "venue", label: "🏛️ Venue", importance: "Critical" },
                { id: "catering", label: "🍽️ Catering", importance: "Critical" },
                { id: "decoration", label: "🎨 Decoration", importance: "High" },
                { id: "photography", label: "📸 Photography", importance: "High" },
                { id: "music", label: "🎵 Music & Entertainment", importance: "Medium" },
                { id: "outfits", label: "👗 Outfits & Jewelry", importance: "High" }
            ],
            
            dietaryRequirements: [
                { id: "vegetarian", label: "Pure Vegetarian" },
                { id: "jain", label: "Jain Vegetarian" },
                { id: "vegan", label: "Vegan" },
                { id: "nonveg", label: "Non-Vegetarian" },
                { id: "mixed", label: "Mixed Menu" },
                { id: "regional", label: "Regional Cuisine" }
            ]
        };

        this.container = document.getElementById('wedding-form-container');
        this.init();
    }

    init() {
        this.loadData();
        this.render();
        this.addStyles();
    }

    loadData() {
        const storedData = window.weddingStorage.getWeddingForm();
        this.formData = { ...this.formData, ...storedData };
    }

    render() {
        if (!this.container) return;

        this.container.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h1 class="card-title">📝 Enhanced Indian Wedding Form</h1>
                    <p class="card-subtitle">Cultural intelligence & regional customization</p>
                    <div class="progress-section">
                        <div class="progress">
                            <div class="progress-fill" style="width: ${this.calculateProgress()}%"></div>
                        </div>
                        <span class="progress-text">${this.calculateProgress()}% Complete</span>
                    </div>
                </div>
                
                <div class="form-content">
                    <div class="grid grid-2 gap-6">
                        <div class="form-column">
                            ${this.renderCoupleDetails()}
                            ${this.renderWeddingDetails()}
                        </div>
                        
                        <div class="form-column">
                            ${this.renderCeremoniesSection()}
                            ${this.renderPreferencesSection()}
                        </div>
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" class="btn btn-outline" id="save-draft-btn">
                            💾 Save Draft
                        </button>
                        <button type="button" class="btn btn-secondary" id="get-ai-help-btn">
                            🤖 Get AI Help
                        </button>
                        <button type="button" class="btn btn-primary" id="submit-form-btn">
                            ✨ Submit & Continue
                        </button>
                    </div>
                </div>
            </div>
        `;

        this.attachEventListeners();
    }

    renderCoupleDetails() {
        return `
            <div class="form-section">
                <h3 class="section-title">👫 Couple Details</h3>
                <div class="form-group">
                    <label class="form-label">Your Name *</label>
                    <input type="text" class="form-input" id="yourName" value="${this.formData.yourName}" placeholder="Enter your full name">
                </div>
                
                <div class="form-group">
                    <label class="form-label">Partner's Name *</label>
                    <input type="text" class="form-input" id="partnerName" value="${this.formData.partnerName}" placeholder="Enter partner's full name">
                </div>
                
                <div class="grid grid-2 gap-3">
                    <div class="form-group">
                        <label class="form-label">Contact Number *</label>
                        <input type="tel" class="form-input" id="contactNumber" value="${this.formData.contactNumber}" placeholder="+91 98765 43210">
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Email *</label>
                        <input type="email" class="form-input" id="email" value="${this.formData.email}" placeholder="your@email.com">
                    </div>
                </div>
            </div>
        `;
    }

    renderWeddingDetails() {
        return `
            <div class="form-section">
                <h3 class="section-title">💒 Wedding Details</h3>
                
                <div class="grid grid-2 gap-3">
                    <div class="form-group">
                        <label class="form-label">Region *</label>
                        <select class="form-select" id="region">
                            ${this.formOptions.regions.map(region => 
                                `<option value="${region.label}" ${this.formData.region === region.label ? 'selected' : ''}>${region.label}</option>`
                            ).join('')}
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Wedding Type *</label>
                        <select class="form-select" id="weddingType">
                            ${this.formOptions.weddingTypes.map(type => 
                                `<option value="${type.label}" ${this.formData.weddingType === type.label ? 'selected' : ''}>${type.label}</option>`
                            ).join('')}
                        </select>
                    </div>
                </div>
                
                <div class="grid grid-2 gap-3">
                    <div class="form-group">
                        <label class="form-label">Primary City *</label>
                        <select class="form-select" id="primaryCity">
                            ${this.formOptions.cities.map(city => 
                                `<option value="${city}" ${this.formData.primaryCity === city ? 'selected' : ''}>${city}</option>`
                            ).join('')}
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Wedding Date *</label>
                        <input type="date" class="form-input" id="weddingDate" value="${this.formData.weddingDate}">
                    </div>
                </div>
                
                <div class="grid grid-2 gap-3">
                    <div class="form-group">
                        <label class="form-label">Guest Count</label>
                        <input type="number" class="form-input" id="guestCount" value="${this.formData.guestCount}" min="50" max="2000" step="25">
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Budget Range</label>
                        <select class="form-select" id="budgetRange">
                            ${this.formOptions.budgetRanges.map(budget => 
                                `<option value="${budget.value}" ${this.formData.budgetRange === budget.value ? 'selected' : ''}>${budget.label}</option>`
                            ).join('')}
                        </select>
                    </div>
                </div>
            </div>
        `;
    }

    renderCeremoniesSection() {
        return `
            <div class="form-section">
                <h3 class="section-title">🎊 Ceremonies & Events</h3>
                <p class="section-desc">Select ceremonies you want to include</p>
                
                <div class="checkbox-grid">
                    ${this.formOptions.ceremonies.map(ceremony => `
                        <div class="checkbox-item ${this.formData.ceremonies.includes(ceremony.id) ? 'selected' : ''}">
                            <label>
                                <input type="checkbox" value="${ceremony.id}" ${this.formData.ceremonies.includes(ceremony.id) ? 'checked' : ''}>
                                <span class="ceremony-label">${ceremony.label}</span>
                                <span class="ceremony-duration">${ceremony.duration}</span>
                            </label>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    renderPreferencesSection() {
        return `
            <div class="form-section">
                <h3 class="section-title">⭐ Priority Areas</h3>
                <p class="section-desc">What matters most to you?</p>
                
                <div class="checkbox-grid">
                    ${this.formOptions.priorityAreas.map(area => `
                        <div class="checkbox-item ${this.formData.priorityAreas.includes(area.id) ? 'selected' : ''}">
                            <label>
                                <input type="checkbox" value="${area.id}" ${this.formData.priorityAreas.includes(area.id) ? 'checked' : ''}>
                                <span class="priority-label">${area.label}</span>
                                <span class="priority-importance">${area.importance}</span>
                            </label>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="form-section">
                <h3 class="section-title">🍽️ Dietary Requirements</h3>
                
                <div class="dietary-grid">
                    ${this.formOptions.dietaryRequirements.map(diet => `
                        <div class="dietary-item ${this.formData.dietaryRequirements.includes(diet.id) ? 'selected' : ''}">
                            <input type="checkbox" value="${diet.id}" ${this.formData.dietaryRequirements.includes(diet.id) ? 'checked' : ''}>
                            <label>${diet.label}</label>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="form-section">
                <h3 class="section-title">💬 Special Requests</h3>
                <div class="form-group">
                    <textarea class="form-textarea" id="specialRequests" rows="4" placeholder="Any specific traditions, customs, or special requirements...">${this.formData.specialRequests}</textarea>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        // Text inputs
        ['yourName', 'partnerName', 'contactNumber', 'email', 'weddingDate', 'guestCount', 'specialRequests'].forEach(field => {
            const element = document.getElementById(field);
            if (element) {
                element.addEventListener('change', (e) => {
                    this.updateField(field, e.target.value);
                });
            }
        });

        // Select inputs
        ['region', 'weddingType', 'primaryCity', 'budgetRange'].forEach(field => {
            const element = document.getElementById(field);
            if (element) {
                element.addEventListener('change', (e) => {
                    this.updateField(field, e.target.value);
                });
            }
        });

        // Checkboxes
        document.querySelectorAll('.checkbox-item input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const container = e.target.closest('.form-section');
                const field = container.querySelector('.section-title').textContent.includes('Ceremonies') ? 'ceremonies' :
                              container.querySelector('.section-title').textContent.includes('Priority') ? 'priorityAreas' :
                              'dietaryRequirements';
                
                this.toggleArrayField(field, e.target.value, e.target.checked);
                
                // Update visual state
                const item = e.target.closest('.checkbox-item, .dietary-item');
                if (e.target.checked) {
                    item.classList.add('selected');
                } else {
                    item.classList.remove('selected');
                }
            });
        });

        // Buttons
        document.getElementById('save-draft-btn').addEventListener('click', () => this.saveDraft());
        document.getElementById('get-ai-help-btn').addEventListener('click', () => this.getAIHelp());
        document.getElementById('submit-form-btn').addEventListener('click', () => this.submitForm());
    }

    updateField(field, value) {
        this.formData[field] = value;
        this.saveDraft();
        this.updateProgressDisplay();
    }

    toggleArrayField(field, value, checked) {
        if (checked) {
            if (!this.formData[field].includes(value)) {
                this.formData[field].push(value);
            }
        } else {
            this.formData[field] = this.formData[field].filter(item => item !== value);
        }
        this.saveDraft();
        this.updateProgressDisplay();
    }

    updateProgressDisplay() {
        const progressFill = document.querySelector('.progress-fill');
        const progressText = document.querySelector('.progress-text');
        const progress = this.calculateProgress();
        
        if (progressFill) progressFill.style.width = `${progress}%`;
        if (progressText) progressText.textContent = `${progress}% Complete`;
    }

    calculateProgress() {
        const requiredFields = ['yourName', 'partnerName', 'contactNumber', 'email', 'weddingDate'];
        let completed = 0;
        
        requiredFields.forEach(field => {
            if (this.formData[field] && this.formData[field].toString().trim()) {
                completed++;
            }
        });
        
        return Math.round((completed / requiredFields.length) * 100);
    }

    saveDraft() {
        window.weddingStorage.saveWeddingForm(this.formData);
        this.showMessage('Draft saved successfully!', 'success');
    }

    getAIHelp() {
        this.showMessage('🤖 AI suggestions: Based on your region and wedding type, consider adding traditional ceremonies like Sangeet and Mehendi for a complete experience!', 'info');
    }

    submitForm() {
        const errors = this.validateForm();
        if (errors.length > 0) {
            this.showMessage(`Please complete: ${errors.join(', ')}`, 'error');
            return;
        }

        this.saveDraft();
        this.showMessage('Wedding form submitted successfully!', 'success');
        
        // Navigate to next screen
        setTimeout(() => {
            if (window.navigationManager) {
                window.navigationManager.navigateTo('visual-preferences');
            }
        }, 1500);
    }

    validateForm() {
        const errors = [];
        if (!this.formData.yourName) errors.push('Your name');
        if (!this.formData.partnerName) errors.push('Partner name');
        if (!this.formData.contactNumber) errors.push('Contact number');
        if (!this.formData.email) errors.push('Email');
        if (!this.formData.weddingDate) errors.push('Wedding date');
        return errors;
    }

    showMessage(message, type = 'info') {
        const existingMessage = document.querySelector('.form-message');
        if (existingMessage) existingMessage.remove();

        const messageEl = document.createElement('div');
        messageEl.className = `form-message form-message-${type}`;
        messageEl.textContent = message;
        
        const formActions = document.querySelector('.form-actions');
        if (formActions) {
            formActions.parentNode.insertBefore(messageEl, formActions);
            
            setTimeout(() => {
                if (messageEl.parentNode) {
                    messageEl.parentNode.removeChild(messageEl);
                }
            }, 3000);
        }
    }

    refresh() {
        this.loadData();
        this.render();
    }

    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .form-section {
                background: var(--gray-50);
                border-radius: 12px;
                padding: 1rem;
                margin-bottom: 1rem;
                border: 1px solid var(--gray-200);
            }
            
            .section-title {
                color: var(--primary-gold);
                font-size: 1rem;
                font-weight: 600;
                margin-bottom: 0.75rem;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            
            .section-desc {
                color: var(--gray-500);
                font-size: 0.75rem;
                margin-bottom: 0.75rem;
            }
            
            .progress-section {
                max-width: 300px;
                margin: 0 auto;
            }
            
            .form-content {
                margin-bottom: 1.5rem;
            }
            
            .form-column {
                display: flex;
                flex-direction: column;
            }
            
            .checkbox-grid {
                display: grid;
                grid-template-columns: 1fr;
                gap: 0.5rem;
            }
            
            .checkbox-item {
                background: white;
                border: 1px solid var(--gray-200);
                border-radius: 6px;
                padding: 0.75rem;
                transition: all 0.2s ease;
            }
            
            .checkbox-item:hover {
                border-color: var(--primary-gold);
                background: var(--gold-bg);
            }
            
            .checkbox-item.selected {
                border-color: var(--primary-gold);
                background: var(--gold-bg);
            }
            
            .checkbox-item input[type="checkbox"] {
                margin-right: 0.5rem;
                accent-color: var(--primary-gold);
            }
            
            .checkbox-item label {
                display: flex;
                align-items: center;
                justify-content: space-between;
                cursor: pointer;
                margin: 0;
                font-size: 0.75rem;
            }
            
            .ceremony-label, .priority-label {
                font-weight: 500;
                color: var(--gray-700);
            }
            
            .ceremony-duration, .priority-importance {
                font-size: 0.625rem;
                color: var(--gray-500);
                background: var(--gray-100);
                padding: 0.125rem 0.375rem;
                border-radius: 4px;
            }
            
            .dietary-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 0.5rem;
            }
            
            .dietary-item {
                background: white;
                border: 1px solid var(--gray-200);
                border-radius: 6px;
                padding: 0.75rem;
                text-align: center;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .dietary-item:hover {
                border-color: var(--primary-green);
                background: #F8FDF8;
            }
            
            .dietary-item.selected {
                border-color: var(--primary-green);
                background: #F0F8F0;
            }
            
            .dietary-item input[type="checkbox"] {
                display: none;
            }
            
            .dietary-item label {
                font-size: 0.75rem;
                font-weight: 500;
                color: var(--gray-700);
                cursor: pointer;
                margin: 0;
            }
            
            .form-actions {
                display: flex;
                justify-content: center;
                gap: 0.75rem;
                padding-top: 1rem;
                border-top: 1px solid var(--gray-200);
                flex-wrap: wrap;
            }
            
            .form-message {
                padding: 0.75rem;
                border-radius: 8px;
                margin-bottom: 1rem;
                font-size: 0.875rem;
                text-align: center;
            }
            
            .form-message-success {
                background: #DCFCE7;
                border: 1px solid #BBF7D0;
                color: #16A34A;
            }
            
            .form-message-error {
                background: #FEE2E2;
                border: 1px solid #FECACA;
                color: #DC2626;
            }
            
            .form-message-info {
                background: var(--gold-bg);
                border: 1px solid #F3E8B8;
                color: var(--primary-gold);
            }
            
            @media (max-width: 768px) {
                .dietary-grid {
                    grid-template-columns: 1fr;
                }
                
                .form-actions {
                    flex-direction: column;
                    align-items: center;
                }
                
                .form-actions .btn {
                    width: 100%;
                    max-width: 250px;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.weddingFormManager = new WeddingFormManager();
}); 