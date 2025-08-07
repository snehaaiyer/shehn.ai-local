// Enhanced Navigation System for BID AI Wedding Assistant
class WeddingNavigation {
    constructor() {
        this.currentScreen = 'dashboard';
        this.screens = ['dashboard', 'wedding-form', 'visual-preferences'];
        this.isAnimating = false;
        this.init();
    }

    init() {
        console.log('🧭 Initializing Enhanced Navigation System...');
        
        // Add click listeners to navigation items with improved event handling
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                // Get the screen from the button itself or its data attribute
                let screen = item.getAttribute('data-screen');
                
                // If clicked on child elements, get the parent button's data-screen
                if (!screen && item.closest('.nav-item')) {
                    screen = item.closest('.nav-item').getAttribute('data-screen');
                }
                
                // Also check the target element if it's a child
                if (!screen && e.target.closest('.nav-item')) {
                    screen = e.target.closest('.nav-item').getAttribute('data-screen');
                }
                
                if (screen && !this.isAnimating) {
                    console.log(`🔄 Navigating to: ${screen}`);
                    this.navigateTo(screen);
                } else if (!screen) {
                    console.warn('⚠️ No screen data found for navigation item');
                }
            });
        });

        // Add keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case '1':
                        e.preventDefault();
                        this.navigateTo('dashboard');
                        break;
                    case '2':
                        e.preventDefault();
                        this.navigateTo('wedding-form');
                        break;
                    case '3':
                        e.preventDefault();
                        this.navigateTo('visual-preferences');
                        break;
                }
            }
        });

        // Set initial screen
        this.showScreen(this.currentScreen);
        this.updateNavigation(this.currentScreen);
        
        console.log('✅ Navigation system initialized');
    }

    async navigateTo(screenName) {
        if (!this.screens.includes(screenName)) {
            console.error(`❌ Screen '${screenName}' not found`);
            if (window.notificationManager) {
                window.notificationManager.show(
                    `Screen '${screenName}' not available`,
                    'error',
                    3000
                );
            }
            return;
        }

        if (this.currentScreen === screenName) {
            console.log(`📍 Already on ${screenName} screen`);
            return;
        }

        if (this.isAnimating) {
            console.log('⏳ Navigation in progress, please wait...');
            return;
        }

        try {
            this.isAnimating = true;

            // Auto-save before navigation
            await this.autoSaveBeforeNavigation();

            // Show loading if needed
            if (screenName === 'wedding-form' && window.loadingManager) {
                window.loadingManager.show('Loading wedding form...', 'Preparing your personalized experience ✨');
            }

            // Hide current screen with animation
            await this.hideScreen(this.currentScreen);
            
            // Show new screen with animation
            await this.showScreen(screenName);
            
            // Update current screen
            const previousScreen = this.currentScreen;
            this.currentScreen = screenName;
            
            // Update navigation state
            this.updateNavigation(screenName);
            
            // Update URL
            this.updateURL(screenName);
            
            // Initialize screen-specific functionality
            await this.initializeScreen(screenName);
            
            // Update progress if applicable
            this.updateProgress(screenName);
            
            // Hide loading
            if (window.loadingManager) {
                window.loadingManager.hide();
            }
            
            // Show success notification
            if (window.notificationManager) {
                const screenTitles = {
                    'dashboard': 'Dashboard 📊',
                    'wedding-form': 'Wedding Form 📝',
                    'visual-preferences': 'Preferences 🎨'
                };
                
                window.notificationManager.show(
                    `Switched to ${screenTitles[screenName]}`,
                    'info',
                    2000
                );
            }
            
            console.log(`✅ Successfully navigated from ${previousScreen} to ${screenName}`);
            
        } catch (error) {
            console.error('❌ Navigation error:', error);
            if (window.notificationManager) {
                window.notificationManager.show(
                    'Navigation failed. Please try again.',
                    'error',
                    5000
                );
            }
        } finally {
            this.isAnimating = false;
        }
    }

    async showScreen(screenName) {
        return new Promise((resolve) => {
            const screen = document.getElementById(`${screenName}-screen`);
            if (screen) {
                screen.classList.add('active');
                // Wait for animation to complete
                setTimeout(resolve, 300);
            } else {
                console.error(`❌ Screen element not found: ${screenName}-screen`);
                resolve();
            }
        });
    }

    async hideScreen(screenName) {
        return new Promise((resolve) => {
            const screen = document.getElementById(`${screenName}-screen`);
            if (screen) {
                screen.classList.remove('active');
                // Wait for animation to complete
                setTimeout(resolve, 300);
            } else {
                resolve();
            }
        });
    }

    updateNavigation(activeScreen) {
        document.querySelectorAll('.nav-item').forEach(item => {
            const itemScreen = item.getAttribute('data-screen');
            if (itemScreen === activeScreen) {
                item.classList.add('active');
                item.setAttribute('aria-selected', 'true');
            } else {
                item.classList.remove('active');
                item.setAttribute('aria-selected', 'false');
            }
        });
    }

    async initializeScreen(screenName) {
        console.log(`🔄 Initializing ${screenName} screen...`);
        
        try {
            switch (screenName) {
                case 'dashboard':
                    if (window.dashboardManager) {
                        await window.dashboardManager.refresh();
                    } else {
                        console.warn('⚠️ Dashboard manager not available');
                    }
                    break;
                    
                case 'wedding-form':
                    if (window.weddingFormManager) {
                        await window.weddingFormManager.refresh();
                    } else {
                        console.warn('⚠️ Wedding form manager not available');
                    }
                    break;
                    
                case 'visual-preferences':
                    if (window.visualPreferencesManager) {
                        await window.visualPreferencesManager.refresh();
                    } else {
                        console.warn('⚠️ Visual preferences manager not available');
                    }
                    break;
            }
        } catch (error) {
            console.error(`❌ Error initializing ${screenName}:`, error);
        }
    }

    updateProgress(screenName) {
        if (window.progressManager) {
            const progress = {
                'dashboard': 0,
                'wedding-form': 50,
                'visual-preferences': 100
            };
            
            const messages = {
                'dashboard': 'Getting started',
                'wedding-form': 'Planning your wedding',
                'visual-preferences': 'Personalizing your experience'
            };
            
            window.progressManager.update(
                progress[screenName] || 0,
                messages[screenName] || 'In progress...'
            );
        }
    }

    getCurrentScreen() {
        return this.currentScreen;
    }

    // Enhanced navigation methods
    getNextScreen() {
        const currentIndex = this.screens.indexOf(this.currentScreen);
        if (currentIndex < this.screens.length - 1) {
            return this.screens[currentIndex + 1];
        }
        return null;
    }

    getPreviousScreen() {
        const currentIndex = this.screens.indexOf(this.currentScreen);
        if (currentIndex > 0) {
            return this.screens[currentIndex - 1];
        }
        return null;
    }

    async goNext() {
        const nextScreen = this.getNextScreen();
        if (nextScreen) {
            await this.navigateTo(nextScreen);
        } else {
            if (window.notificationManager) {
                window.notificationManager.show(
                    'You\'re on the last screen! 🎉',
                    'info',
                    2000
                );
            }
        }
    }

    async goPrevious() {
        const previousScreen = this.getPreviousScreen();
        if (previousScreen) {
            await this.navigateTo(previousScreen);
        } else {
            if (window.notificationManager) {
                window.notificationManager.show(
                    'You\'re on the first screen! 📍',
                    'info',
                    2000
                );
            }
        }
    }

    // URL-based navigation
    updateURL(screenName) {
        try {
            if (history.pushState) {
                const newURL = `${window.location.pathname}#${screenName}`;
                history.pushState({ screen: screenName }, '', newURL);
            }
        } catch (error) {
            console.warn('⚠️ Could not update URL:', error);
        }
    }

    handleURLChange() {
        const hash = window.location.hash.substring(1);
        if (hash && this.screens.includes(hash) && hash !== this.currentScreen) {
            this.navigateTo(hash);
        }
    }

    // Enhanced auto-save functionality
    async autoSaveBeforeNavigation() {
        try {
            console.log('💾 Auto-saving before navigation...');
            
            switch (this.currentScreen) {
                case 'wedding-form':
                    if (window.weddingFormManager && window.weddingFormManager.saveDraft) {
                        await window.weddingFormManager.saveDraft();
                    }
                    break;
                    
                case 'visual-preferences':
                    if (window.visualPreferencesManager && window.visualPreferencesManager.saveDraft) {
                        await window.visualPreferencesManager.saveDraft();
                    }
                    break;
            }
            
            // Global auto-save
            if (window.saveManager && window.saveManager.saveAll) {
                await window.saveManager.saveAll();
            }
            
        } catch (error) {
            console.warn('⚠️ Auto-save failed:', error);
        }
    }

    // Navigation shortcuts
    addNavigationShortcuts() {
        // Add floating navigation buttons for mobile
        const shortcuts = document.createElement('div');
        shortcuts.className = 'nav-shortcuts';
        shortcuts.innerHTML = `
            <button class="nav-shortcut" onclick="window.navigationManager.goPrevious()">
                <span>←</span>
            </button>
            <button class="nav-shortcut" onclick="window.navigationManager.goNext()">
                <span>→</span>
            </button>
        `;
        document.body.appendChild(shortcuts);
    }

    // Debug and testing methods
    getNavigationState() {
        return {
            currentScreen: this.currentScreen,
            screens: this.screens,
            isAnimating: this.isAnimating,
            url: window.location.hash
        };
    }

    // Enhanced error handling
    handleError(error, context = 'navigation') {
        console.error(`❌ Navigation error in ${context}:`, error);
        
        if (window.notificationManager) {
            window.notificationManager.show(
                `Navigation error: ${error.message}`,
                'error',
                5000
            );
        }
        
        // Reset animation state
        this.isAnimating = false;
        
        // Ensure we're on a valid screen
        if (!this.screens.includes(this.currentScreen)) {
            this.currentScreen = 'dashboard';
            this.showScreen('dashboard');
            this.updateNavigation('dashboard');
        }
    }
}

// Enhanced initialization with better error handling
document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log('🚀 Initializing BID AI Navigation System...');
        
        window.navigationManager = new WeddingNavigation();
        
        // Handle browser back/forward buttons
        window.addEventListener('popstate', (event) => {
            if (event.state && event.state.screen) {
                window.navigationManager.navigateTo(event.state.screen);
            } else {
                window.navigationManager.handleURLChange();
            }
        });
        
        // Handle initial URL
        setTimeout(() => {
            window.navigationManager.handleURLChange();
        }, 100);
        
        // Add navigation shortcuts for mobile
        if (window.innerWidth <= 768) {
            window.navigationManager.addNavigationShortcuts();
        }
        
        console.log('✅ Navigation system fully initialized');
        
    } catch (error) {
        console.error('❌ Failed to initialize navigation:', error);
        
        // Fallback navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const screen = e.target.closest('.nav-item')?.getAttribute('data-screen');
                if (screen) {
                    // Simple fallback navigation
                    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
                    document.getElementById(`${screen}-screen`)?.classList.add('active');
                    
                    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
                    e.target.closest('.nav-item')?.classList.add('active');
                }
            });
        });
    }
});

// Add CSS for navigation shortcuts
const navShortcutStyles = `
    .nav-shortcuts {
        position: fixed;
        bottom: 20px;
        right: 20px;
        display: none;
        gap: 10px;
        z-index: 1000;
    }
    
    .nav-shortcut {
        width: 50px;
        height: 50px;
        background: var(--gradient-button);
        border: none;
        border-radius: 50%;
        color: white;
        font-size: 20px;
        cursor: pointer;
        box-shadow: var(--shadow-lg);
        transition: var(--transition);
    }
    
    .nav-shortcut:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-xl);
    }
    
    @media (max-width: 768px) {
        .nav-shortcuts {
            display: flex;
        }
    }
`;

// Add styles to document
const styleSheet = document.createElement('style');
styleSheet.textContent = navShortcutStyles;
document.head.appendChild(styleSheet); 