// Vivaha AI - New App Controller
class VivahaApp {
    constructor() {
        this.weddingData = {};
        this.visualPreferences = {};
        this.init();
    }

    init() {
        this.loadData();
        this.bindEvents();
        this.updateStats();
        this.initFormHandlers();
    }

    loadData() {
        // Load data from localStorage
        const savedWeddingData = localStorage.getItem('wedding_data');
        const savedVisualPreferences = localStorage.getItem('visual_preferences');
        
        if (savedWeddingData) {
            this.weddingData = JSON.parse(savedWeddingData);
            this.populateFormData();
        }
        
        if (savedVisualPreferences) {
            this.visualPreferences = JSON.parse(savedVisualPreferences);
        }
        
        this.updateProgress();
    }

    bindEvents() {
        // Save button
        const saveBtn = document.getElementById('save-data-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.saveAllData();
            });
        }

        // AI Assist button
        const aiAssistBtn = document.querySelector('.ai-assist-btn');
        if (aiAssistBtn) {
            aiAssistBtn.addEventListener('click', () => {
                this.showAIAssistModal();
            });
        }
    }

    initFormHandlers() {
        // Couple details form
        const coupleForm = document.getElementById('couple-details-screen');
        if (coupleForm) {
            const inputs = coupleForm.querySelectorAll('input, select');
            inputs.forEach(input => {
                input.addEventListener('change', () => {
                    this.updateWeddingData();
                    this.updateProgress();
                    this.updateStats();
                });
            });
        }

        // Form action buttons - specific to couple details screen
        const continueBtn = document.querySelector('#couple-details-screen .btn-primary');
        if (continueBtn) {
            continueBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Continue button clicked');
                this.saveAllData();
                window.navigationManager.switchScreen('style-design');
            });
        }
        
        // Save draft button
        const saveDraftBtn = document.querySelector('#couple-details-screen .btn-secondary');
        if (saveDraftBtn) {
            saveDraftBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Save draft button clicked');
                this.saveAllData();
            });
        }
    }

    updateWeddingData() {
        // Collect data from couple details form
        const formData = {
            partner1Name: document.getElementById('bride-name')?.value || '',
            partner2Name: document.getElementById('groom-name')?.value || '',
            weddingDate: document.getElementById('wedding-date')?.value || '',
            region: document.getElementById('wedding-city')?.value || '',
            guestCount: document.getElementById('guest-count')?.value || '',
            budgetRange: document.getElementById('budget-range')?.value || ''
        };

        this.weddingData = { ...this.weddingData, ...formData };
        console.log('Wedding data updated:', this.weddingData);
    }

    populateFormData() {
        // Populate form fields with saved data
        Object.keys(this.weddingData).forEach(key => {
            const element = document.getElementById(this.kebabCase(key));
            if (element) {
                element.value = this.weddingData[key];
            }
        });
    }

    updateProgress() {
        const progressItems = document.querySelectorAll('.progress-item');
        
        progressItems.forEach(item => {
            const icon = item.querySelector('.progress-icon');
            const fill = item.querySelector('.progress-fill');
            const text = item.querySelector('.progress-text');
            
            let progress = 0;
            let status = 'Not started';
            
            // Check progress based on icon
            const iconText = icon.textContent;
            
            if (iconText === '♡') {
                // Couple details progress
                const requiredFields = ['partner1Name', 'partner2Name', 'weddingDate', 'region'];
                const filledFields = requiredFields.filter(field => this.weddingData[field]);
                progress = (filledFields.length / requiredFields.length) * 100;
                
                if (progress === 0) status = 'Not started';
                else if (progress < 100) status = `${Math.round(progress)}% complete`;
                else status = 'Complete';
                
            } else if (iconText === '◐') {
                // Style & design progress
                const styleFields = Object.keys(this.visualPreferences);
                if (styleFields.length > 0) {
                    progress = 50; // Assume 50% if any preferences set
                    status = 'In progress';
                }
            }
            
            if (fill) fill.style.width = `${progress}%`;
            if (text) text.textContent = status;
        });
    }

    updateStats() {
        // Update quick stats
        const statItems = document.querySelectorAll('.stat-item');
        
        statItems.forEach(item => {
            const label = item.querySelector('.stat-label').textContent;
            const value = item.querySelector('.stat-value');
            
            if (label.includes('Days to Wedding')) {
                const weddingDate = this.weddingData.weddingDate;
                if (weddingDate) {
                    const today = new Date();
                    const wedding = new Date(weddingDate);
                    const diffTime = wedding - today;
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    value.textContent = diffDays > 0 ? diffDays : 0;
                }
            } else if (label.includes('Budget Set')) {
                const budget = this.weddingData.budgetRange;
                if (budget) {
                    value.textContent = `₹${budget} Lakhs`;
                }
            }
        });
    }

    saveAllData() {
        this.updateWeddingData();
        
        // Save to localStorage
        localStorage.setItem('wedding_data', JSON.stringify(this.weddingData));
        localStorage.setItem('visual_preferences', JSON.stringify(this.visualPreferences));
        
        // Show success notification
        this.showNotification('Data saved successfully!', 'success');
        
        // Try to save to API if available
        this.saveToAPI();
    }

    async saveToAPI() {
        try {
            if (window.apiService) {
                console.log('Saving to API:', this.weddingData);
                const response = await window.apiService.saveWeddingData(this.weddingData);
                console.log('API save response:', response);
                
                if (Object.keys(this.visualPreferences).length > 0) {
                    await window.apiService.saveVisualPreferences(this.visualPreferences);
                }
            }
        } catch (error) {
            console.log('API save failed, data saved locally:', error);
        }
    }

    showNotification(message, type = 'info') {
        const container = document.getElementById('notification-container');
        if (!container) return;

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
                <span class="notification-message">${message}</span>
                <button class="notification-close">×</button>
            </div>
        `;

        // Add styles for notification
        if (!document.querySelector('#notification-styles')) {
            const styles = document.createElement('style');
            styles.id = 'notification-styles';
            styles.textContent = `
                .notification {
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
                    border: 1px solid #e5e7eb;
                    margin-bottom: 1rem;
                    animation: slideIn 0.3s ease-out;
                }
                .notification.success { border-left: 4px solid #10b981; }
                .notification.error { border-left: 4px solid #ef4444; }
                .notification-content {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 1rem;
                }
                .notification-message { flex: 1; font-size: 0.875rem; color: #374151; }
                .notification-close {
                    background: none;
                    border: none;
                    cursor: pointer;
                    font-size: 1.25rem;
                    color: #9ca3af;
                }
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(styles);
        }

        container.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideIn 0.3s ease-out reverse';
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);

        // Close button handler
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.style.animation = 'slideIn 0.3s ease-out reverse';
            setTimeout(() => notification.remove(), 300);
        });
    }

    showAIAssistModal() {
        // Simple AI assist modal for now
        this.showNotification('AI Assistant is analyzing your preferences...', 'info');
        
        setTimeout(() => {
            const suggestions = this.generateAISuggestions();
            this.showNotification(suggestions, 'success');
        }, 2000);
    }

    generateAISuggestions() {
        const suggestions = [
            'Consider booking venues 6-8 months in advance',
            'Based on your guest count, budget allocation recommendation ready',
            'Seasonal flowers can reduce decoration costs by 30%',
            'Photography golden hour timing optimized for your date'
        ];
        
        return suggestions[Math.floor(Math.random() * suggestions.length)];
    }

    kebabCase(str) {
        return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.vivahaApp = new VivahaApp();
}); 