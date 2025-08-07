// Main BID AI Wedding Assistant Application
class BidAIWeddingApp {
    constructor() {
        this.version = "1.0.0";
        this.initialized = false;
        this.managers = {};
        
        this.init();
    }

    async init() {
        if (this.initialized) return;

        try {
            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.initializeApp());
            } else {
                await this.initializeApp();
            }
        } catch (error) {
            console.error('App initialization error:', error);
            this.handleInitError(error);
        }
    }

    async initializeApp() {
        console.log('🌸 Initializing BID AI Wedding Assistant...');

        // Initialize storage
        this.initializeStorage();

        // Wait for managers to be available
        await this.waitForManagers();

        // Setup global event listeners
        this.setupGlobalEvents();

        // Initialize theme
        this.initializeTheme();

        // Check for first-time user
        this.checkFirstTimeUser();

        this.initialized = true;
        console.log('✅ BID AI Wedding Assistant initialized successfully');
        
        // Dispatch ready event
        this.dispatchReadyEvent();
    }

    initializeStorage() {
        if (!window.weddingStorage) {
            console.error('Wedding storage not available');
            return;
        }

        // Initialize with default data if needed
        const dashboardData = window.weddingStorage.getDashboardData();
        if (!dashboardData.lastUpdated) {
            window.weddingStorage.saveDashboardData({
                coupleName: "Priya & Arjun",
                weddingDate: "",
                progress: 0,
                daysLeft: 0,
                budget: "₹25 Lakhs",
                budgetUsed: "₹0"
            });
        }
    }

    async waitForManagers() {
        const maxWait = 5000; // 5 seconds
        const startTime = Date.now();

        return new Promise((resolve) => {
            const checkManagers = () => {
                const allManagersReady = 
                    window.navigationManager &&
                    window.dashboardManager &&
                    window.weddingFormManager &&
                    window.visualPreferencesManager;

                if (allManagersReady) {
                    this.managers = {
                        navigation: window.navigationManager,
                        dashboard: window.dashboardManager,
                        weddingForm: window.weddingFormManager,
                        visualPreferences: window.visualPreferencesManager
                    };
                    resolve();
                } else if (Date.now() - startTime < maxWait) {
                    setTimeout(checkManagers, 100);
                } else {
                    console.warn('Some managers not ready, proceeding anyway');
                    resolve();
                }
            };

            checkManagers();
        });
    }

    setupGlobalEvents() {
        // Handle browser refresh/close
        window.addEventListener('beforeunload', () => {
            this.saveAllData();
        });

        // Handle visibility change (tab switching)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.saveAllData();
            }
        });

        // Handle keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });

        // Handle clicks outside modals (for future use)
        document.addEventListener('click', (e) => {
            this.handleGlobalClick(e);
        });

        // Auto-save every 30 seconds
        this.setupAutoSave();
    }

    setupAutoSave() {
        setInterval(() => {
            this.saveAllData();
        }, 30000); // 30 seconds
    }

    saveAllData() {
        try {
            if (this.managers.dashboard) {
                this.managers.dashboard.saveData();
            }
            if (this.managers.weddingForm) {
                this.managers.weddingForm.saveDraft();
            }
            if (this.managers.visualPreferences) {
                this.managers.visualPreferences.saveDraft();
            }
        } catch (error) {
            console.error('Auto-save error:', error);
        }
    }

    handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + S for save
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            this.saveAllData();
            this.showGlobalMessage('💾 All data saved!', 'success');
        }

        // Tab navigation (1, 2, 3)
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case '1':
                    e.preventDefault();
                    this.navigateToScreen('dashboard');
                    break;
                case '2':
                    e.preventDefault();
                    this.navigateToScreen('wedding-form');
                    break;
                case '3':
                    e.preventDefault();
                    this.navigateToScreen('visual-preferences');
                    break;
            }
        }
    }

    handleGlobalClick(e) {
        // Handle clicks outside dropdowns, modals, etc.
        const clickableElements = ['button', 'a', 'input', 'select', 'textarea'];
        const isClickableElement = clickableElements.some(tag => 
            e.target.tagName.toLowerCase() === tag
        );

        if (!isClickableElement) {
            // Close any open dropdowns or modals
            this.closeAllDropdowns();
        }
    }

    closeAllDropdowns() {
        // Implementation for closing dropdowns (for future use)
        const dropdowns = document.querySelectorAll('.dropdown.open');
        dropdowns.forEach(dropdown => {
            dropdown.classList.remove('open');
        });
    }

    initializeTheme() {
        const userSettings = window.weddingStorage.getUserSettings();
        if (userSettings.theme && userSettings.theme !== 'default') {
            this.applyTheme(userSettings.theme);
        }
    }

    applyTheme(themeName) {
        document.body.setAttribute('data-theme', themeName);
        window.weddingStorage.saveUserSettings({
            ...window.weddingStorage.getUserSettings(),
            theme: themeName
        });
    }

    checkFirstTimeUser() {
        const dashboardData = window.weddingStorage.getDashboardData();
        const weddingForm = window.weddingStorage.getWeddingForm();

        const isFirstTime = !weddingForm.yourName && !weddingForm.partnerName;

        if (isFirstTime) {
            this.showWelcomeMessage();
        }
    }

    showWelcomeMessage() {
        setTimeout(() => {
            this.showGlobalMessage(
                '🎉 Welcome to BID AI! Let\'s start by filling out your wedding details. Click on "Wedding Form" to begin!',
                'info',
                5000
            );
        }, 1000);
    }

    navigateToScreen(screenName) {
        if (this.managers.navigation) {
            this.managers.navigation.navigateTo(screenName);
        }
    }

    showGlobalMessage(message, type = 'info', duration = 3000) {
        // Remove existing message
        const existingMessage = document.querySelector('.global-message');
        if (existingMessage) {
            existingMessage.remove();
        }

        // Create new message
        const messageEl = document.createElement('div');
        messageEl.className = `global-message global-message-${type}`;
        messageEl.textContent = message;

        // Add to page
        document.body.appendChild(messageEl);

        // Auto-remove after duration
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.classList.add('fade-out');
                setTimeout(() => {
                    if (messageEl.parentNode) {
                        messageEl.parentNode.removeChild(messageEl);
                    }
                }, 300);
            }
        }, duration);
    }

    handleInitError(error) {
        console.error('Initialization failed:', error);
        document.body.innerHTML = `
            <div class="error-container">
                <div class="error-content">
                    <h1>🚫 Initialization Error</h1>
                    <p>Sorry, there was a problem starting the BID AI Wedding Assistant.</p>
                    <p>Error: ${error.message}</p>
                    <button onclick="location.reload()" class="btn btn-primary">
                        🔄 Retry
                    </button>
                </div>
            </div>
        `;
    }

    dispatchReadyEvent() {
        const event = new CustomEvent('bidaiReady', {
            detail: {
                version: this.version,
                managers: this.managers
            }
        });
        window.dispatchEvent(event);
    }

    // Public API methods
    getAppData() {
        return {
            dashboard: window.weddingStorage.getDashboardData(),
            weddingForm: window.weddingStorage.getWeddingForm(),
            visualPreferences: window.weddingStorage.getVisualPreferences(),
            userSettings: window.weddingStorage.getUserSettings()
        };
    }

    exportData() {
        const data = window.weddingStorage.exportData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `bidai-wedding-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showGlobalMessage('📥 Wedding data exported successfully!', 'success');
    }

    importData(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                const success = window.weddingStorage.importData(data);
                
                if (success) {
                    this.showGlobalMessage('📤 Wedding data imported successfully!', 'success');
                    // Refresh all managers
                    Object.values(this.managers).forEach(manager => {
                        if (manager && manager.refresh) {
                            manager.refresh();
                        }
                    });
                } else {
                    this.showGlobalMessage('❌ Error importing data', 'error');
                }
            } catch (error) {
                console.error('Import error:', error);
                this.showGlobalMessage('❌ Invalid file format', 'error');
            }
        };
        reader.readAsText(file);
    }

    clearAllData() {
        if (confirm('Are you sure you want to clear all wedding data? This cannot be undone.')) {
            window.weddingStorage.clear();
            location.reload();
        }
    }

    // Add styles for global components
    addGlobalStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .global-message {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                padding: 1rem 1.5rem;
                border-radius: 8px;
                font-size: 0.875rem;
                font-weight: 500;
                max-width: 400px;
                box-shadow: var(--shadow);
                animation: slideIn 0.3s ease-out;
            }
            
            .global-message-success {
                background: #DCFCE7;
                border: 1px solid #BBF7D0;
                color: #16A34A;
            }
            
            .global-message-error {
                background: #FEE2E2;
                border: 1px solid #FECACA;
                color: #DC2626;
            }
            
            .global-message-info {
                background: var(--gold-bg);
                border: 1px solid #F3E8B8;
                color: var(--primary-gold);
            }
            
            .global-message.fade-out {
                animation: slideOut 0.3s ease-in;
            }
            
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
            
            .error-container {
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                padding: 2rem;
                background: linear-gradient(135deg, var(--primary-pink) 0%, var(--primary-green) 100%);
            }
            
            .error-content {
                background: white;
                padding: 2rem;
                border-radius: 16px;
                text-align: center;
                box-shadow: var(--shadow);
                max-width: 400px;
            }
            
            .error-content h1 {
                color: var(--primary-gold);
                margin-bottom: 1rem;
            }
            
            .error-content p {
                margin-bottom: 1rem;
                color: var(--gray-600);
            }
            
            @media (max-width: 768px) {
                .global-message {
                    top: 10px;
                    right: 10px;
                    left: 10px;
                    max-width: none;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    window.bidaiApp = new BidAIWeddingApp();
    window.bidaiApp.addGlobalStyles();
});

// Export for global access
window.BidAIWeddingApp = BidAIWeddingApp;

// BID AI Wedding Assistant - Enhanced Main Application

// Global Application State
window.BidAI = {
    currentWedding: null,
    preferences: {},
    aiEnabled: true,
    lastSave: null,
    notifications: []
};

// Enhanced Notification System
class NotificationManager {
    constructor() {
        this.container = document.getElementById('notification-container');
        this.notifications = [];
    }

    show(message, type = 'info', duration = 5000) {
        const notification = this.createNotification(message, type, duration);
        this.container.appendChild(notification);
        this.notifications.push(notification);

        // Animate in
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        // Auto remove
        if (duration > 0) {
            setTimeout(() => {
                this.remove(notification);
            }, duration);
        }

        return notification;
    }

    createNotification(message, type, duration) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const icon = this.getIcon(type);
        const timestamp = new Date().toLocaleTimeString();
        
        notification.innerHTML = `
            <div class="notification-header">
                <span class="notification-icon">${icon}</span>
                <span class="notification-type">${type.charAt(0).toUpperCase() + type.slice(1)}</span>
                <span class="notification-time">${timestamp}</span>
                <button class="notification-close" onclick="window.notificationManager.remove(this.closest('.notification'))">&times;</button>
            </div>
            <div class="notification-body">
                <p>${message}</p>
            </div>
        `;

        return notification;
    }

    getIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️',
            ai: '🤖',
            wedding: '💍',
            save: '💾'
        };
        return icons[type] || '📢';
    }

    remove(notification) {
        if (!notification || !notification.parentNode) return;
        
        notification.style.animation = 'slideOutRight 0.3s ease forwards';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
            this.notifications = this.notifications.filter(n => n !== notification);
        }, 300);
    }

    clear() {
        this.notifications.forEach(notification => this.remove(notification));
    }
}

// Enhanced Loading Manager
class LoadingManager {
    constructor() {
        this.overlay = document.getElementById('loading-overlay');
        this.title = document.getElementById('loading-title');
        this.message = document.getElementById('loading-message');
        this.isVisible = false;
    }

    show(title = 'Processing...', message = 'Our AI is working its magic ✨') {
        this.title.textContent = title;
        this.message.textContent = message;
        this.overlay.style.display = 'flex';
        this.isVisible = true;
        
        // Add animation class
        setTimeout(() => {
            this.overlay.classList.add('show');
        }, 10);
    }

    hide() {
        this.overlay.classList.remove('show');
        setTimeout(() => {
            this.overlay.style.display = 'none';
            this.isVisible = false;
        }, 300);
    }

    update(title, message) {
        if (this.isVisible) {
            this.title.textContent = title;
            this.message.textContent = message;
        }
    }
}

// Enhanced Theme Manager
class ThemeManager {
    constructor() {
        this.themes = {
            default: {
                name: 'Rose Gold Elegance',
                primary: '#E8B4A8',
                secondary: '#A8A2D6',
                accent: '#9CAF88'
            },
            romantic: {
                name: 'Romantic Blush',
                primary: '#F7B2B0',
                secondary: '#E8A5C8',
                accent: '#B8A2D6'
            },
            royal: {
                name: 'Royal Luxury',
                primary: '#9B5DE5',
                secondary: '#F15BB5',
                accent: '#FEE440'
            },
            nature: {
                name: 'Natural Serenity',
                primary: '#7DB46C',
                secondary: '#A8DADC',
                accent: '#E8D5A2'
            }
        };
        this.currentTheme = 'default';
    }

    applyTheme(themeName) {
        if (!this.themes[themeName]) return;
        
        const theme = this.themes[themeName];
        const root = document.documentElement;
        
        root.style.setProperty('--primary-rose-gold', theme.primary);
        root.style.setProperty('--accent-lavender', theme.secondary);
        root.style.setProperty('--accent-sage', theme.accent);
        
        this.currentTheme = themeName;
        
        // Show notification
        window.notificationManager.show(
            `Theme changed to ${theme.name} 🎨`,
            'success',
            3000
        );
        
        // Save preference
        this.saveThemePreference(themeName);
    }

    saveThemePreference(themeName) {
        try {
            localStorage.setItem('bidai_theme', themeName);
        } catch (error) {
            console.warn('Could not save theme preference:', error);
        }
    }

    loadThemePreference() {
        try {
            const saved = localStorage.getItem('bidai_theme');
            if (saved && this.themes[saved]) {
                this.applyTheme(saved);
            }
        } catch (error) {
            console.warn('Could not load theme preference:', error);
        }
    }
}

// Enhanced Status Manager
class StatusManager {
    constructor() {
        this.statusElement = document.querySelector('.status-indicator');
        this.statusDot = document.querySelector('.status-dot');
        this.statusText = document.querySelector('.status-text');
        this.services = {
            ai: false,
            database: false,
            api: false
        };
    }

    updateStatus(service, status, message) {
        this.services[service] = status;
        this.updateDisplay();
        
        if (message) {
            window.notificationManager.show(message, status ? 'success' : 'error', 3000);
        }
    }

    updateDisplay() {
        const allActive = Object.values(this.services).every(status => status);
        const someActive = Object.values(this.services).some(status => status);
        
        if (allActive) {
            this.statusElement.className = 'status-indicator status-active';
            this.statusText.textContent = 'All Systems Active';
            this.statusDot.style.background = 'var(--accent-sage)';
        } else if (someActive) {
            this.statusElement.className = 'status-indicator status-partial';
            this.statusText.textContent = 'Some Services Active';
            this.statusDot.style.background = '#F59E0B';
        } else {
            this.statusElement.className = 'status-indicator status-inactive';
            this.statusText.textContent = 'Services Offline';
            this.statusDot.style.background = '#EF4444';
        }
    }

    async checkServices() {
        try {
            // Check AI Service
            const aiResponse = await fetch('/api/health');
            this.updateStatus('ai', aiResponse.ok);
            
            // Check API Service
            const apiResponse = await fetch('/api/status');
            this.updateStatus('api', apiResponse.ok);
            
            // Database is assumed working if we get this far
            this.updateStatus('database', true);
            
        } catch (error) {
            console.warn('Service check failed:', error);
            this.updateStatus('ai', false);
            this.updateStatus('api', false);
            this.updateStatus('database', false);
        }
    }
}

// Enhanced Progress Manager
class ProgressManager {
    constructor() {
        this.progressFill = document.getElementById('form-progress-fill');
        this.progressText = document.getElementById('form-progress-text');
        this.currentProgress = 0;
    }

    update(percentage, message) {
        this.currentProgress = Math.max(0, Math.min(100, percentage));
        
        if (this.progressFill) {
            this.progressFill.style.width = `${this.currentProgress}%`;
            this.progressFill.setAttribute('aria-valuenow', this.currentProgress);
        }
        
        if (this.progressText && message) {
            this.progressText.textContent = message;
        }
    }

    reset() {
        this.update(0, 'Ready to start');
    }

    complete() {
        this.update(100, 'Complete! ✨');
        setTimeout(() => {
            window.notificationManager.show(
                'Wedding form completed successfully! 🎉',
                'success',
                4000
            );
        }, 500);
    }
}

// Enhanced Save Manager
class SaveManager {
    constructor() {
        this.saveBtn = document.getElementById('save-data-btn');
        this.lastSave = null;
        this.autoSaveInterval = null;
        this.bindEvents();
    }

    bindEvents() {
        if (this.saveBtn) {
            this.saveBtn.addEventListener('click', () => this.saveAll());
        }
        
        // Auto-save every 30 seconds
        this.startAutoSave();
    }

    async saveAll() {
        try {
            window.loadingManager.show('Saving your data...', 'Please wait while we save your wedding plans 💾');
            
            const data = {
                wedding: window.BidAI.currentWedding,
                preferences: window.BidAI.preferences,
                timestamp: new Date().toISOString()
            };
            
            // Save to localStorage
            localStorage.setItem('bidai_wedding_data', JSON.stringify(data));
            
            // Simulate API save (replace with actual API call)
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            this.lastSave = new Date();
            window.BidAI.lastSave = this.lastSave;
            
            window.loadingManager.hide();
            window.notificationManager.show(
                'Your wedding data has been saved successfully! 💾',
                'save',
                3000
            );
            
            this.updateSaveButton();
            
        } catch (error) {
            console.error('Save failed:', error);
            window.loadingManager.hide();
            window.notificationManager.show(
                'Failed to save data. Please try again.',
                'error',
                5000
            );
        }
    }

    updateSaveButton() {
        if (this.saveBtn && this.lastSave) {
            const timeAgo = this.getTimeAgo(this.lastSave);
            this.saveBtn.title = `Last saved: ${timeAgo}`;
        }
    }

    getTimeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);
        
        if (seconds < 60) return 'just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
        return date.toLocaleDateString();
    }

    startAutoSave() {
        this.autoSaveInterval = setInterval(() => {
            if (window.BidAI.currentWedding) {
                this.saveAll();
            }
        }, 30000); // 30 seconds
    }

    stopAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
        }
    }
}

// Initialize Enhanced Systems
let notificationManager, loadingManager, themeManager, statusManager, progressManager, saveManager;

document.addEventListener('DOMContentLoaded', function() {
    console.log('🌸 BID AI Wedding Assistant - Enhanced Version Starting...');
    
    // Initialize all managers
    notificationManager = new NotificationManager();
    loadingManager = new LoadingManager();
    themeManager = new ThemeManager();
    statusManager = new StatusManager();
    progressManager = new ProgressManager();
    saveManager = new SaveManager();
    
    // Make managers globally available
    window.notificationManager = notificationManager;
    window.loadingManager = loadingManager;
    window.themeManager = themeManager;
    window.statusManager = statusManager;
    window.progressManager = progressManager;
    window.saveManager = saveManager;
    
    // Load saved theme
    themeManager.loadThemePreference();
    
    // Initial status check
    statusManager.checkServices();
    
    // Periodic status checks
    setInterval(() => {
        statusManager.checkServices();
    }, 60000); // Check every minute
    
    // Welcome message
    setTimeout(() => {
        notificationManager.show(
            'Welcome to BID AI! Your smart wedding planning assistant is ready ✨',
            'wedding',
            4000
        );
    }, 1000);
    
    // Add enhanced CSS for notifications
    addNotificationStyles();
    
    console.log('✅ BID AI Enhanced Systems Initialized');
});

function addNotificationStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .notification {
            background: white;
            border-radius: var(--radius-lg);
            box-shadow: var(--shadow-lg);
            margin-bottom: 1rem;
            overflow: hidden;
            transform: translateX(100%);
            opacity: 0;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            max-width: 100%;
        }

        .notification.show {
            transform: translateX(0);
            opacity: 1;
        }

        .notification-header {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 1rem 1rem 0.5rem;
            border-bottom: 1px solid var(--gray-200);
        }

        .notification-icon {
            font-size: 1.25rem;
        }

        .notification-type {
            font-weight: 600;
            font-size: 0.875rem;
            color: var(--gray-700);
            flex-grow: 1;
        }

        .notification-time {
            font-size: 0.75rem;
            color: var(--gray-500);
        }

        .notification-close {
            background: none;
            border: none;
            font-size: 1.25rem;
            color: var(--gray-400);
            cursor: pointer;
            padding: 0;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: var(--radius);
            transition: var(--transition);
        }

        .notification-close:hover {
            background: var(--gray-100);
            color: var(--gray-600);
        }

        .notification-body {
            padding: 0.5rem 1rem 1rem;
        }

        .notification-body p {
            margin: 0;
            font-size: 0.875rem;
            color: var(--gray-600);
            line-height: 1.5;
        }

        .notification.success {
            border-left: 4px solid var(--accent-sage);
        }

        .notification.error {
            border-left: 4px solid #EF4444;
        }

        .notification.warning {
            border-left: 4px solid #F59E0B;
        }

        .notification.info {
            border-left: 4px solid #3B82F6;
        }

        .notification.ai {
            border-left: 4px solid var(--accent-lavender);
        }

        .notification.wedding {
            border-left: 4px solid var(--primary-rose-gold);
        }

        .notification.save {
            border-left: 4px solid var(--primary-champagne);
        }

        .loading-overlay.show {
            opacity: 1;
            backdrop-filter: blur(10px);
        }

        .loading-overlay {
            opacity: 0;
            transition: all 0.3s ease;
        }

        .status-indicator.status-active {
            background: rgba(156, 175, 136, 0.1);
            border-color: var(--accent-sage);
            color: var(--accent-sage);
        }

        .status-indicator.status-partial {
            background: rgba(245, 158, 11, 0.1);
            border-color: #F59E0B;
            color: #F59E0B;
        }

        .status-indicator.status-inactive {
            background: rgba(239, 68, 68, 0.1);
            border-color: #EF4444;
            color: #EF4444;
        }

        @keyframes slideOutRight {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }

        .floating-element {
            pointer-events: none;
            user-select: none;
        }

        @media (prefers-reduced-motion: reduce) {
            .floating-element {
                animation: none;
            }
            
            .notification {
                transition: opacity 0.3s ease;
            }
        }
    `;
    document.head.appendChild(style);
}

// Export for other modules
window.BidAI = window.BidAI || {};
window.BidAI.managers = {
    notification: () => window.notificationManager,
    loading: () => window.loadingManager,
    theme: () => window.themeManager,
    status: () => window.statusManager,
    progress: () => window.progressManager,
    save: () => window.saveManager
}; 