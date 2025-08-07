/**
 * NocoDB Integration Module
 * Handles communication between BID AI wedding app and NocoDB database
 */

class NocoDBIntegration {
    constructor() {
        this.apiBaseUrl = 'http://localhost:5001/api';
        this.isOnline = false;
        this.checkConnection();
    }

    /**
     * Check if the API service is available
     */
    async checkConnection() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/health`);
            const data = await response.json();
            this.isOnline = data.status === 'healthy';
            
            if (this.isOnline) {
                console.log('✅ NocoDB API Service connected');
                this.showConnectionStatus('connected');
            } else {
                console.log('❌ NocoDB API Service unavailable');
                this.showConnectionStatus('disconnected');
            }
        } catch (error) {
            console.log('❌ NocoDB API Service unavailable:', error);
            this.isOnline = false;
            this.showConnectionStatus('disconnected');
        }
        return this.isOnline;
    }

    /**
     * Show connection status in the UI
     */
    showConnectionStatus(status) {
        // Remove existing status indicators
        const existingStatus = document.querySelector('.nocodb-status');
        if (existingStatus) {
            existingStatus.remove();
        }

        // Create status indicator
        const statusDiv = document.createElement('div');
        statusDiv.className = 'nocodb-status';
        statusDiv.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            padding: 10px 16px;
            border-radius: 12px;
            font-size: 13px;
            font-weight: 600;
            z-index: 1000;
            backdrop-filter: blur(10px);
            border: 2px solid;
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
            ${status === 'connected' 
                ? `background: linear-gradient(135deg, #0F4C3A, #1A6B4F); 
                   color: #FFD700; 
                   border-color: #FFD700;
                   box-shadow: 0 8px 20px rgba(15, 76, 58, 0.3);` 
                : `background: linear-gradient(135deg, #800020, #A0002A); 
                   color: #FFD700; 
                   border-color: #FFD700;
                   box-shadow: 0 8px 20px rgba(128, 0, 32, 0.3);`
            }
        `;
        
        statusDiv.innerHTML = status === 'connected' 
            ? '🟢 Database Connected' 
            : '🔴 Database Offline (Using Local Storage)';
            
        document.body.appendChild(statusDiv);

        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (statusDiv.parentNode) {
                statusDiv.remove();
            }
        }, 5000);
    }

    /**
     * Save wedding form data to NocoDB
     */
    async saveWeddingData(formData) {
        try {
            if (!this.isOnline) {
                console.log('📱 Saving to localStorage (NocoDB offline)');
                return this.saveToLocalStorage('weddingFormData', formData);
            }

            const response = await fetch(`${this.apiBaseUrl}/wedding-data`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();
            
            if (result.success) {
                console.log('✅ Wedding data saved to NocoDB:', result.record_id);
                // Also save to localStorage as backup
                this.saveToLocalStorage('weddingFormData', {
                    ...formData,
                    recordId: result.record_id,
                    savedToDatabase: true,
                    lastSaved: new Date().toISOString()
                });
                
                this.showSaveNotification('Wedding data saved to database! 💾');
                return result;
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('❌ Error saving wedding data:', error);
            // Fallback to localStorage
            console.log('📱 Falling back to localStorage');
            this.saveToLocalStorage('weddingFormData', formData);
            this.showSaveNotification('Saved locally (database unavailable) 💾', 'warning');
            return { success: false, error: error.message };
        }
    }

    /**
     * Save visual preferences to NocoDB
     */
    async saveVisualPreferences(preferencesData) {
        try {
            if (!this.isOnline) {
                console.log('📱 Saving to localStorage (NocoDB offline)');
                return this.saveToLocalStorage('visualPreferences', preferencesData);
            }

            const response = await fetch(`${this.apiBaseUrl}/visual-preferences`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(preferencesData)
            });

            const result = await response.json();
            
            if (result.success) {
                console.log('✅ Visual preferences saved to NocoDB:', result.record_id);
                // Also save to localStorage as backup
                this.saveToLocalStorage('visualPreferences', {
                    ...preferencesData,
                    recordId: result.record_id,
                    savedToDatabase: true,
                    lastSaved: new Date().toISOString()
                });
                
                this.showSaveNotification('Visual preferences saved to database! 🎨');
                return result;
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('❌ Error saving visual preferences:', error);
            // Fallback to localStorage
            console.log('📱 Falling back to localStorage');
            this.saveToLocalStorage('visualPreferences', preferencesData);
            this.showSaveNotification('Saved locally (database unavailable) 🎨', 'warning');
            return { success: false, error: error.message };
        }
    }

    /**
     * Get all wedding data from NocoDB
     */
    async getWeddingData() {
        try {
            if (!this.isOnline) {
                console.log('📱 Loading from localStorage (NocoDB offline)');
                return this.getFromLocalStorage();
            }

            const response = await fetch(`${this.apiBaseUrl}/wedding-data`);
            const result = await response.json();
            
            if (result.success) {
                console.log('✅ Wedding data loaded from NocoDB');
                return result.data;
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('❌ Error getting wedding data:', error);
            // Fallback to localStorage
            console.log('📱 Falling back to localStorage');
            return this.getFromLocalStorage();
        }
    }

    /**
     * Save to localStorage as fallback
     */
    saveToLocalStorage(key, data) {
        try {
            const savedData = {
                ...data,
                lastSaved: new Date().toISOString(),
                savedToDatabase: false
            };
            localStorage.setItem(key, JSON.stringify(savedData));
            console.log(`✅ Data saved to localStorage: ${key}`);
            return { success: true, storage: 'localStorage' };
        } catch (error) {
            console.error('❌ Error saving to localStorage:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get from localStorage
     */
    getFromLocalStorage() {
        try {
            const weddingData = localStorage.getItem('weddingFormData');
            const visualData = localStorage.getItem('visualPreferences');
            
            return {
                weddingFormData: weddingData ? JSON.parse(weddingData) : null,
                visualPreferences: visualData ? JSON.parse(visualData) : null
            };
        } catch (error) {
            console.error('❌ Error reading from localStorage:', error);
            return {};
        }
    }

    /**
     * Show save notification
     */
    showSaveNotification(message, type = 'success') {
        // Remove existing notifications
        const existingNotification = document.querySelector('.save-notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        // Create notification
        const notification = document.createElement('div');
        notification.className = 'save-notification';
        notification.style.cssText = `
            position: fixed;
            top: 70px;
            right: 10px;
            padding: 14px 20px;
            border-radius: 12px;
            font-size: 14px;
            font-weight: 600;
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
            backdrop-filter: blur(10px);
            border: 2px solid;
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
            ${type === 'success' 
                ? `background: linear-gradient(135deg, #0F4C3A, #1A6B4F); 
                   color: #FFD700; 
                   border-color: #FFD700;
                   box-shadow: 0 8px 20px rgba(15, 76, 58, 0.3);` 
                : `background: linear-gradient(135deg, #FFD700, #B8860B); 
                   color: #800020; 
                   border-color: #800020;
                   box-shadow: 0 8px 20px rgba(255, 215, 0, 0.3);`
            }
        `;
        
        notification.textContent = message;
        document.body.appendChild(notification);

        // Auto-hide after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOut 0.3s ease-in';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.remove();
                    }
                }, 300);
            }
        }, 3000);
    }

    /**
     * Sync localStorage data to database when connection is restored
     */
    async syncLocalDataToDatabase() {
        if (!this.isOnline) {
            return;
        }

        try {
            const localData = this.getFromLocalStorage();
            
            // Sync wedding form data
            if (localData.weddingFormData && !localData.weddingFormData.savedToDatabase) {
                console.log('🔄 Syncing wedding form data to database...');
                await this.saveWeddingData(localData.weddingFormData);
            }
            
            // Sync visual preferences
            if (localData.visualPreferences && !localData.visualPreferences.savedToDatabase) {
                console.log('🔄 Syncing visual preferences to database...');
                await this.saveVisualPreferences(localData.visualPreferences);
            }
            
            console.log('✅ Local data synced to database');
        } catch (error) {
            console.error('❌ Error syncing local data:', error);
        }
    }

    /**
     * Retry connection periodically
     */
    startConnectionRetry() {
        setInterval(async () => {
            if (!this.isOnline) {
                const wasOffline = !this.isOnline;
                await this.checkConnection();
                
                // If connection was restored, sync local data
                if (wasOffline && this.isOnline) {
                    this.showConnectionStatus('connected');
                    await this.syncLocalDataToDatabase();
                }
            }
        }, 30000); // Check every 30 seconds
    }
}

// Add CSS animations with the new theme colors
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Create global instance
window.nocoDBIntegration = new NocoDBIntegration();

// Start connection retry
window.nocoDBIntegration.startConnectionRetry();

console.log('◊ NocoDB Integration module loaded'); 