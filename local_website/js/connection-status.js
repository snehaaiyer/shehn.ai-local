// Connection Status Manager - Real-time API connectivity monitoring
class ConnectionStatusManager {
    constructor() {
        this.isOnline = navigator.onLine;
        this.apiConnected = false;
        this.statusElement = null;
        this.checkInterval = null;
        this.retryAttempts = 0;
        this.maxRetries = 3;
        
        this.init();
    }

    init() {
        this.createStatusIndicator();
        this.bindEvents();
        this.startHealthChecks();
        this.checkConnection();
    }

    createStatusIndicator() {
        // Create floating status indicator
        const statusContainer = document.createElement('div');
        statusContainer.className = 'connection-status-container';
        statusContainer.innerHTML = `
            <div class="connection-status" id="connection-status">
                <div class="status-indicator">
                    <span class="status-dot"></span>
                    <span class="status-text">Checking connection...</span>
                </div>
                <div class="status-details" id="status-details">
                    <div class="detail-item">
                        <span class="detail-label">API:</span>
                        <span class="detail-value" id="api-status">Connecting...</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Database:</span>
                        <span class="detail-value" id="db-status">Checking...</span>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(statusContainer);
        this.statusElement = document.getElementById('connection-status');

        // Add styles
        this.addStyles();
    }

    addStyles() {
        const styles = `
            <style>
                .connection-status-container {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 9999;
                    transition: all 0.3s ease;
                }

                .connection-status {
                    background: rgba(255, 255, 255, 0.95);
                    backdrop-filter: blur(20px);
                    border-radius: 12px;
                    padding: 12px 16px;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    min-width: 200px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .connection-status:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
                }

                .status-indicator {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .status-dot {
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                    background: #94A3B8;
                    animation: pulse 2s infinite;
                    transition: all 0.3s ease;
                }

                .status-dot.online {
                    background: #10B981;
                    box-shadow: 0 0 10px rgba(16, 185, 129, 0.3);
                }

                .status-dot.offline {
                    background: #EF4444;
                    box-shadow: 0 0 10px rgba(239, 68, 68, 0.3);
                }

                .status-dot.warning {
                    background: #F59E0B;
                    box-shadow: 0 0 10px rgba(245, 158, 11, 0.3);
                }

                .status-text {
                    font-size: 14px;
                    font-weight: 600;
                    color: #374151;
                    transition: color 0.3s ease;
                }

                .status-details {
                    margin-top: 8px;
                    padding-top: 8px;
                    border-top: 1px solid rgba(156, 163, 175, 0.2);
                    opacity: 0;
                    max-height: 0;
                    overflow: hidden;
                    transition: all 0.3s ease;
                }

                .connection-status:hover .status-details {
                    opacity: 1;
                    max-height: 100px;
                }

                .detail-item {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 4px;
                    font-size: 12px;
                }

                .detail-label {
                    color: #6B7280;
                    font-weight: 500;
                }

                .detail-value {
                    font-weight: 600;
                    color: #374151;
                }

                .detail-value.online {
                    color: #10B981;
                }

                .detail-value.offline {
                    color: #EF4444;
                }

                .detail-value.warning {
                    color: #F59E0B;
                }

                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }

                @media (max-width: 768px) {
                    .connection-status-container {
                        top: 10px;
                        right: 10px;
                    }
                    
                    .connection-status {
                        padding: 8px 12px;
                        min-width: 160px;
                    }
                    
                    .status-text {
                        font-size: 12px;
                    }
                }
            </style>
        `;

        document.head.insertAdjacentHTML('beforeend', styles);
    }

    bindEvents() {
        // Online/offline detection
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.checkConnection();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.updateStatus('offline', 'No internet connection');
        });

        // Click to retry connection
        this.statusElement.addEventListener('click', () => {
            if (!this.apiConnected) {
                this.retryConnection();
            }
        });
    }

    startHealthChecks() {
        // Check connection every 30 seconds
        this.checkInterval = setInterval(() => {
            this.checkConnection();
        }, 30000);
    }

    async checkConnection() {
        if (!this.isOnline) {
            this.updateStatus('offline', 'No internet connection');
            return;
        }

        try {
            this.updateStatus('checking', 'Checking connection...');
            
            const response = await fetch(`${window.weddingAPIService?.baseURL || 'http://localhost:5001/api'}/health`, {
                method: 'GET',
                timeout: 5000
            });

            if (response.ok) {
                const data = await response.json();
                this.apiConnected = true;
                this.retryAttempts = 0;

                if (data.nocodb === 'connected') {
                    this.updateStatus('online', 'All systems online');
                    this.updateDetails('api-status', 'Connected', 'online');
                    this.updateDetails('db-status', 'Connected', 'online');
                } else {
                    this.updateStatus('warning', 'API online, DB offline');
                    this.updateDetails('api-status', 'Connected', 'online');
                    this.updateDetails('db-status', 'Offline', 'warning');
                }
            } else {
                this.handleConnectionError();
            }
        } catch (error) {
            this.handleConnectionError(error);
        }
    }

    handleConnectionError(error = null) {
        this.apiConnected = false;
        this.retryAttempts++;

        console.warn('Connection check failed:', error?.message || 'Unknown error');

        if (this.retryAttempts <= this.maxRetries) {
            this.updateStatus('warning', `Retrying... (${this.retryAttempts}/${this.maxRetries})`);
            this.updateDetails('api-status', 'Retrying...', 'warning');
            this.updateDetails('db-status', 'Unknown', 'warning');
            
            // Retry after delay
            setTimeout(() => this.checkConnection(), 2000);
        } else {
            this.updateStatus('offline', 'Services unavailable');
            this.updateDetails('api-status', 'Offline', 'offline');
            this.updateDetails('db-status', 'Offline', 'offline');
        }
    }

    retryConnection() {
        this.retryAttempts = 0;
        this.checkConnection();
    }

    updateStatus(type, message) {
        const statusDot = this.statusElement.querySelector('.status-dot');
        const statusText = this.statusElement.querySelector('.status-text');

        // Remove all status classes
        statusDot.classList.remove('online', 'offline', 'warning');
        
        // Add new status class
        if (type !== 'checking') {
            statusDot.classList.add(type);
        }

        statusText.textContent = message;

        // Update document title indicator
        this.updateDocumentTitle(type);
    }

    updateDetails(elementId, value, status) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
            element.classList.remove('online', 'offline', 'warning');
            if (status) {
                element.classList.add(status);
            }
        }
    }

    updateDocumentTitle(status) {
        const originalTitle = 'BID AI - Smart Sanskari Wedding Assistant';
        const statusIndicators = {
            online: '🟢',
            offline: '🔴',
            warning: '🟡',
            checking: '⚪'
        };

        document.title = `${statusIndicators[status] || '⚪'} ${originalTitle}`;
    }

    destroy() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
        }

        const container = document.querySelector('.connection-status-container');
        if (container) {
            container.remove();
        }

        window.removeEventListener('online', this.checkConnection);
        window.removeEventListener('offline', this.updateStatus);
    }
}

// Initialize connection status manager
window.connectionStatusManager = new ConnectionStatusManager(); 