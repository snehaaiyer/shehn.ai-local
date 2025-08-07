/**
 * AI Copilot Integration for Wedding Planning
 * Supports Google Gemini, ChatGPT, and other AI assistants
 */

class WeddingAICopilot {
    constructor() {
        this.baseURL = 'http://localhost:8000/api/ai';
        this.isInitialized = false;
        this.currentContext = {};
        this.init();
    }

    async init() {
        console.log('🤖 Initializing AI Copilot...');
        this.loadWeddingContext();
        this.setupChatInterface();
        this.isInitialized = true;
    }

    loadWeddingContext() {
        // Load current wedding data from localStorage
        const weddingData = JSON.parse(localStorage.getItem('vivaha_wedding_data') || '{}');
        const preferences = JSON.parse(localStorage.getItem('vivaha_preferences') || '{}');
        
        this.currentContext = {
            couple: `${weddingData.partner1Name || ''} & ${weddingData.partner2Name || ''}`.trim(),
            date: weddingData.weddingDate || 'Not set',
            location: weddingData.region || 'Not set',
            budget: weddingData.budget || 'Not set',
            theme: preferences.weddingTheme || 'Not set',
            ...weddingData,
            ...preferences
        };
    }

    async getWeddingSuggestions() {
        try {
            console.log('🤖 Getting AI wedding suggestions...');
            
            const response = await fetch(`${this.baseURL}/wedding-suggestions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.currentContext)
            });

            const result = await response.json();
            
            if (result.success) {
                this.displaySuggestions(result);
                return result;
            } else {
                throw new Error(result.error || 'Failed to get suggestions');
            }
        } catch (error) {
            console.error('Error getting AI suggestions:', error);
            this.showError('Unable to get AI suggestions at the moment.');
            return null;
        }
    }

    async analyzeVendors(vendors, userPreferences = {}) {
        try {
            console.log('🤖 Getting AI vendor analysis...');
            
            const response = await fetch(`${this.baseURL}/vendor-analysis`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    vendors: vendors,
                    preferences: { ...this.currentContext, ...userPreferences }
                })
            });

            const result = await response.json();
            
            if (result.success) {
                this.displayVendorAnalysis(result);
                return result;
            } else {
                throw new Error(result.error || 'Failed to analyze vendors');
            }
        } catch (error) {
            console.error('Error analyzing vendors:', error);
            this.showError('Unable to analyze vendors at the moment.');
            return null;
        }
    }

    async generateTimeline() {
        try {
            console.log('🤖 Generating AI timeline...');
            
            const response = await fetch(`${this.baseURL}/timeline`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.currentContext)
            });

            const result = await response.json();
            
            if (result.success) {
                this.displayTimeline(result);
                return result;
            } else {
                throw new Error(result.error || 'Failed to generate timeline');
            }
        } catch (error) {
            console.error('Error generating timeline:', error);
            this.showError('Unable to generate timeline at the moment.');
            return null;
        }
    }

    async chatWithAssistant(message) {
        try {
            console.log('🤖 Chatting with AI assistant...');
            
            const response = await fetch(`${this.baseURL}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: message,
                    context: this.currentContext
                })
            });

            const result = await response.json();
            
            if (result.success) {
                return result.response;
            } else {
                throw new Error(result.error || 'Failed to get response');
            }
        } catch (error) {
            console.error('Error chatting with AI:', error);
            return "I'm sorry, I'm having trouble connecting right now. Please try again later.";
        }
    }

    displaySuggestions(result) {
        const container = document.getElementById('ai-suggestions') || this.createSuggestionsContainer();
        
        container.innerHTML = `
            <div class="ai-suggestions-card">
                <div class="ai-header">
                    <h3>🤖 AI Wedding Suggestions</h3>
                    <span class="ai-provider">Powered by ${result.provider}</span>
                </div>
                <div class="ai-content">
                    <pre>${result.suggestions}</pre>
                </div>
                <div class="ai-actions">
                    <button onclick="this.saveSuggestions()" class="btn btn-primary">Save Suggestions</button>
                    <button onclick="this.getMoreSuggestions()" class="btn btn-secondary">Get More Ideas</button>
                </div>
            </div>
        `;
    }

    displayVendorAnalysis(result) {
        const container = document.getElementById('ai-vendor-analysis') || this.createAnalysisContainer();
        
        container.innerHTML = `
            <div class="ai-analysis-card">
                <div class="ai-header">
                    <h3>🤖 AI Vendor Analysis</h3>
                    <span class="ai-provider">Powered by ${result.provider}</span>
                </div>
                <div class="ai-content">
                    <pre>${result.analysis}</pre>
                </div>
                <div class="ai-actions">
                    <button onclick="this.applyRecommendations()" class="btn btn-primary">Apply Recommendations</button>
                </div>
            </div>
        `;
    }

    displayTimeline(result) {
        const container = document.getElementById('ai-timeline') || this.createTimelineContainer();
        
        container.innerHTML = `
            <div class="ai-timeline-card">
                <div class="ai-header">
                    <h3>🤖 AI Wedding Timeline</h3>
                    <span class="ai-provider">Powered by ${result.provider}</span>
                </div>
                <div class="ai-content">
                    <pre>${result.timeline}</pre>
                </div>
                <div class="ai-actions">
                    <button onclick="this.exportTimeline()" class="btn btn-primary">Export Timeline</button>
                    <button onclick="this.customizeTimeline()" class="btn btn-secondary">Customize</button>
                </div>
            </div>
        `;
    }

    setupChatInterface() {
        // Create floating chat interface
        if (!document.getElementById('ai-chat-widget')) {
            const chatWidget = document.createElement('div');
            chatWidget.id = 'ai-chat-widget';
            chatWidget.innerHTML = `
                <div class="ai-chat-toggle" onclick="aiCopilot.toggleChat()">
                    <span>🤖 AI Assistant</span>
                </div>
                <div class="ai-chat-container" style="display: none;">
                    <div class="ai-chat-header">
                        <h4>VivahAI Assistant</h4>
                        <button onclick="aiCopilot.toggleChat()">×</button>
                    </div>
                    <div class="ai-chat-messages" id="ai-chat-messages"></div>
                    <div class="ai-chat-input">
                        <input type="text" id="ai-chat-input" placeholder="Ask me about your wedding planning..." 
                               onkeypress="if(event.key==='Enter') aiCopilot.sendMessage()">
                        <button onclick="aiCopilot.sendMessage()">Send</button>
                    </div>
                </div>
            `;
            document.body.appendChild(chatWidget);
        }
    }

    toggleChat() {
        const container = document.querySelector('.ai-chat-container');
        const isVisible = container.style.display !== 'none';
        container.style.display = isVisible ? 'none' : 'block';
        
        if (!isVisible) {
            // Add welcome message if first time opening
            const messages = document.getElementById('ai-chat-messages');
            if (messages.children.length === 0) {
                this.addChatMessage('ai', 'Hi! I\'m VivahAI, your wedding planning assistant. How can I help you today?');
            }
        }
    }

    async sendMessage() {
        const input = document.getElementById('ai-chat-input');
        const message = input.value.trim();
        
        if (!message) return;
        
        // Add user message
        this.addChatMessage('user', message);
        input.value = '';
        
        // Show typing indicator
        this.addChatMessage('ai', '...', true);
        
        // Get AI response
        const response = await this.chatWithAssistant(message);
        
        // Remove typing indicator and add response
        const messages = document.getElementById('ai-chat-messages');
        messages.removeChild(messages.lastChild);
        this.addChatMessage('ai', response);
    }

    addChatMessage(sender, message, isTyping = false) {
        const messages = document.getElementById('ai-chat-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `ai-chat-message ${sender} ${isTyping ? 'typing' : ''}`;
        messageDiv.innerHTML = `
            <div class="message-content">${message}</div>
            <div class="message-time">${new Date().toLocaleTimeString()}</div>
        `;
        messages.appendChild(messageDiv);
        messages.scrollTop = messages.scrollHeight;
    }

    createSuggestionsContainer() {
        const container = document.createElement('div');
        container.id = 'ai-suggestions';
        container.className = 'ai-container';
        document.body.appendChild(container);
        return container;
    }

    createAnalysisContainer() {
        const container = document.createElement('div');
        container.id = 'ai-vendor-analysis';
        container.className = 'ai-container';
        document.body.appendChild(container);
        return container;
    }

    createTimelineContainer() {
        const container = document.createElement('div');
        container.id = 'ai-timeline';
        container.className = 'ai-container';
        document.body.appendChild(container);
        return container;
    }

    showError(message) {
        console.error('AI Copilot Error:', message);
        // You can implement a toast notification or modal here
        alert(`AI Assistant: ${message}`);
    }

    // Additional helper methods
    updateContext(newData) {
        this.currentContext = { ...this.currentContext, ...newData };
    }

    saveSuggestions() {
        // Implement save functionality
        console.log('Saving AI suggestions...');
    }

    getMoreSuggestions() {
        this.getWeddingSuggestions();
    }

    applyRecommendations() {
        // Implement apply recommendations functionality
        console.log('Applying AI recommendations...');
    }

    exportTimeline() {
        // Implement export functionality
        console.log('Exporting AI timeline...');
    }

    customizeTimeline() {
        // Implement customize functionality
        console.log('Customizing AI timeline...');
    }
}

// Initialize AI Copilot
const aiCopilot = new WeddingAICopilot();

// CSS Styles for AI Copilot
const aiCopilotStyles = `
<style>
#ai-chat-widget {
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 1000;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.ai-chat-toggle {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 12px 20px;
    border-radius: 25px;
    cursor: pointer;
    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    transition: all 0.3s ease;
}

.ai-chat-toggle:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0,0,0,0.3);
}

.ai-chat-container {
    position: absolute;
    bottom: 60px;
    right: 0;
    width: 350px;
    height: 450px;
    background: white;
    border-radius: 15px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    display: flex;
    flex-direction: column;
}

.ai-chat-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 15px;
    border-radius: 15px 15px 0 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.ai-chat-messages {
    flex: 1;
    padding: 15px;
    overflow-y: auto;
    max-height: 300px;
}

.ai-chat-message {
    margin-bottom: 15px;
    display: flex;
    flex-direction: column;
}

.ai-chat-message.user {
    align-items: flex-end;
}

.ai-chat-message.ai {
    align-items: flex-start;
}

.message-content {
    background: #f0f0f0;
    padding: 10px 15px;
    border-radius: 18px;
    max-width: 80%;
    word-wrap: break-word;
}

.ai-chat-message.user .message-content {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
}

.message-time {
    font-size: 11px;
    color: #888;
    margin-top: 5px;
}

.ai-chat-input {
    display: flex;
    padding: 15px;
    border-top: 1px solid #eee;
}

.ai-chat-input input {
    flex: 1;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 20px;
    outline: none;
}

.ai-chat-input button {
    margin-left: 10px;
    padding: 10px 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 20px;
    cursor: pointer;
}

.ai-container {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    border-radius: 15px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    max-width: 80%;
    max-height: 80%;
    overflow-y: auto;
    z-index: 999;
}

.ai-suggestions-card, .ai-analysis-card, .ai-timeline-card {
    padding: 25px;
}

.ai-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    border-bottom: 2px solid #eee;
    padding-bottom: 15px;
}

.ai-provider {
    font-size: 12px;
    color: #888;
    background: #f0f0f0;
    padding: 5px 10px;
    border-radius: 15px;
}

.ai-content {
    margin-bottom: 20px;
    line-height: 1.6;
}

.ai-content pre {
    white-space: pre-wrap;
    background: #f8f9fa;
    padding: 20px;
    border-radius: 10px;
    border-left: 4px solid #667eea;
}

.ai-actions {
    display: flex;
    gap: 10px;
}

.ai-actions .btn {
    padding: 10px 20px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
}

.btn-primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
}

.btn-secondary {
    background: #f8f9fa;
    color: #333;
    border: 1px solid #ddd;
}

.btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
}

.typing .message-content {
    animation: pulse 1.5s infinite;
}

@keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
}
</style>
`;

// Inject styles
document.head.insertAdjacentHTML('beforeend', aiCopilotStyles); 