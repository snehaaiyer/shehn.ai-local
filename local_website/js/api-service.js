// BID AI Wedding Assistant - API Service Connector
class WeddingAPIService {
    constructor() {
        this.baseURL = 'http://localhost:8001';  // AI Agent Service (upgraded from Flask)
        this.endpoints = {
            health: '/health',
            submitWedding: '/submit-wedding',
            aiConsultation: '/ai-consultation', 
            budgetAnalysis: '/budget-analysis',
            vendorSearch: '/vendor-search',
            weddingData: '/wedding',
            // Legacy endpoints for backward compatibility
            visualPreferences: '/visual-preferences',
            couples: '/couples',
            venues: '/venues',
            vendors: '/vendors'
        };
        this.isConnected = false;
        this.init();
    }

    async init() {
        try {
            await this.checkConnection();
            console.log('✅ Wedding AI Service connected');
        } catch (error) {
            console.warn('⚠️ Wedding AI Service not available:', error.message);
        }
    }

    async checkConnection() {
        try {
            const response = await fetch(`${this.baseURL}${this.endpoints.health}`);
            if (response.ok) {
                const data = await response.json();
                this.isConnected = data.status === 'healthy';
                return data;
            }
            throw new Error('Service not responding');
        } catch (error) {
            this.isConnected = false;
            throw error;
        }
    }

    async submitWeddingForm(formData) {
        if (!this.isConnected) {
            console.warn('⚠️ AI Service offline - saving locally only');
            return this.fallbackSubmission(formData);
        }

        try {
            console.log('🤖 Submitting wedding form to AI Agent service...');
            
            const response = await fetch(`${this.baseURL}${this.endpoints.submitWedding}`, {
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
                console.log('✅ Wedding submission successful:', result.summary);
                
                // Show success message with AI insights
                this.showSubmissionResult(result);
                
                return result;
            } else {
                throw new Error(result.errors?.join(', ') || 'Submission failed');
            }

        } catch (error) {
            console.error('❌ Wedding submission failed:', error);
            
            // Fallback to local storage
            return this.fallbackSubmission(formData, error);
        }
    }

    async getAIConsultation(formData) {
        if (!this.isConnected) {
            return this.mockAIConsultation(formData);
        }

        try {
            console.log('🤖 Requesting AI consultation...');
            
            const response = await fetch(`${this.baseURL}${this.endpoints.aiConsultation}`, {
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
                console.log('✅ AI consultation completed');
                return result;
            } else {
                throw new Error('AI consultation failed');
            }

        } catch (error) {
            console.error('❌ AI consultation failed:', error);
            return this.mockAIConsultation(formData);
        }
    }

    async getBudgetAnalysis(budgetRequest) {
        if (!this.isConnected) {
            return this.mockBudgetAnalysis(budgetRequest);
        }

        try {
            console.log('💰 Requesting budget analysis...');
            
            const response = await fetch(`${this.baseURL}${this.endpoints.budgetAnalysis}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(budgetRequest)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            
            if (result.success) {
                console.log('✅ Budget analysis completed');
                return result;
            } else {
                throw new Error('Budget analysis failed');
            }

        } catch (error) {
            console.error('❌ Budget analysis failed:', error);
            return this.mockBudgetAnalysis(budgetRequest);
        }
    }

    async searchVendors(searchRequest) {
        if (!this.isConnected) {
            return this.mockVendorSearch(searchRequest);
        }

        try {
            console.log('🔍 Searching vendors with AI...');
            
            const response = await fetch(`${this.baseURL}${this.endpoints.vendorSearch}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(searchRequest)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            
            if (result.success) {
                console.log('✅ Vendor search completed');
                return result;
            } else {
                throw new Error('Vendor search failed');
            }

        } catch (error) {
            console.error('❌ Vendor search failed:', error);
            return this.mockVendorSearch(searchRequest);
        }
    }

    // Fallback methods when AI service is not available
    fallbackSubmission(formData, error = null) {
        console.log('💾 Saving wedding data locally...');
        
        // Generate local wedding ID
        const weddingId = `local_${Date.now()}`;
        
        // Save to local storage
        const weddingData = {
            id: weddingId,
            ...formData,
            createdAt: new Date().toISOString(),
            isLocal: true
        };
        
        window.weddingStorage?.saveWeddingData(weddingData);
        
        return {
            success: true,
            wedding_id: weddingId,
            ai_insights: {},
            budget_analysis: {},
            database_records: {},
            errors: error ? [error.message] : [],
            summary: `Wedding data saved locally. ${error ? 'AI services will be available when connection is restored.' : ''}`,
            isLocal: true
        };
    }

    mockAIConsultation(formData) {
        return {
            success: true,
            consultation: {
                agent_analysis: "AI consultation is currently offline. Your wedding details look great! Consider prioritizing venue booking and photographer selection based on your budget.",
                recommendations: [
                    "Start venue hunting 6-8 months before your wedding date",
                    "Book photography early as good photographers get booked quickly",
                    "Consider seasonal flowers to optimize decoration costs"
                ]
            },
            timestamp: new Date().toISOString(),
            agents_used: ["offline_assistant"],
            isOffline: true
        };
    }

    mockBudgetAnalysis(budgetRequest) {
        const totalBudget = this.parseBudgetRange(budgetRequest.budget_range);
        
        return {
            success: true,
            total_budget: totalBudget,
            allocations: {
                "Venue": { percentage: 30, amount: totalBudget * 0.3, amount_formatted: `₹${(totalBudget * 0.3).toLocaleString()}` },
                "Catering": { percentage: 25, amount: totalBudget * 0.25, amount_formatted: `₹${(totalBudget * 0.25).toLocaleString()}` },
                "Photography": { percentage: 12, amount: totalBudget * 0.12, amount_formatted: `₹${(totalBudget * 0.12).toLocaleString()}` },
                "Decoration": { percentage: 15, amount: totalBudget * 0.15, amount_formatted: `₹${(totalBudget * 0.15).toLocaleString()}` },
                "Others": { percentage: 18, amount: totalBudget * 0.18, amount_formatted: `₹${(totalBudget * 0.18).toLocaleString()}` }
            },
            recommendations: [
                "Venue and catering typically consume 55% of wedding budget",
                "Book major vendors 6+ months in advance for better rates",
                "Keep 10% buffer for unexpected expenses"
            ],
            summary: "Budget allocation based on typical Indian wedding patterns. AI analysis will provide more personalized recommendations when service is available.",
            isOffline: true
        };
    }

    mockVendorSearch(searchRequest) {
        return {
            success: true,
            search_params: searchRequest,
            vendor_recommendations: {
                vendors: [
                    {
                        name: "Sample Vendor 1",
                        category: searchRequest.category,
                        location: searchRequest.city,
                        rating: "4.5/5",
                        description: "Professional wedding service provider"
                    }
                ],
                note: "This is sample data. AI-powered vendor search will be available when service connection is restored."
            },
            timestamp: new Date().toISOString(),
            isOffline: true
        };
    }

    parseBudgetRange(budgetRange) {
        const ranges = {
            "Under ₹10 Lakhs": 750000,
            "₹10-20 Lakhs": 1500000,
            "₹20-30 Lakhs": 2500000,
            "₹30-50 Lakhs": 4000000,
            "Above ₹50 Lakhs": 7500000
        };
        return ranges[budgetRange] || 1500000;
    }

    showSubmissionResult(result) {
        // Create a success notification
        const notification = document.createElement('div');
        notification.className = 'wedding-submission-success';
        notification.innerHTML = `
            <div class="success-content">
                <div class="success-header">
                    <span class="success-icon">●</span>
                    <h3>Wedding Plan Created Successfully!</h3>
                </div>
                <div class="success-details">
                    <p><strong>Wedding ID:</strong> ${result.wedding_id}</p>
                    ${result.ai_insights?.success ? '<p>🤖 AI analysis completed with personalized recommendations</p>' : ''}
                    ${result.budget_analysis?.success ? '<p>💰 Budget breakdown generated</p>' : ''}
                </div>
                <div class="success-actions">
                    <button onclick="this.closest('.wedding-submission-success').remove()" class="btn-close">Close</button>
                </div>
            </div>
        `;

        // Style the notification
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            z-index: 10000;
            max-width: 400px;
            animation: slideIn 0.3s ease-out;
        `;

        document.body.appendChild(notification);

        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 10000);
    }

    // Utility method to format responses
    formatResponse(response, fallbackMessage = "Service temporarily unavailable") {
        if (!response) {
            return { success: false, message: fallbackMessage };
        }
        return response;
    }
}

// Initialize global API service
window.weddingAPI = new WeddingAPIService();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WeddingAPIService;
} 