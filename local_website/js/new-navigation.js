// New Navigation System for Vivaha AI
class NavigationManager {
    constructor() {
        this.currentScreen = 'overview';
        this.init();
    }

    init() {
        this.bindEvents();
        this.updateBreadcrumb();
        this.initMobileToggle();
    }

    bindEvents() {
        // Sidebar navigation items
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const screenId = item.getAttribute('data-screen');
                console.log(`Nav item clicked: ${screenId}`);
                this.switchScreen(screenId);
            });
        });

        // CTA button on hero card
        const ctaBtn = document.querySelector('.cta-btn');
        if (ctaBtn) {
            ctaBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('CTA button clicked, switching to couple-details');
                this.switchScreen('couple-details');
            });
        }

        // Suggestion items
        const suggestionItems = document.querySelectorAll('.suggestion-item');
        suggestionItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                // Get the suggestion type and navigate accordingly
                const suggestionText = item.querySelector('h4').textContent;
                console.log('Suggestion clicked:', suggestionText);
                if (suggestionText.includes('couple details')) {
                    this.switchScreen('couple-details');
                } else if (suggestionText.includes('wedding date')) {
                    this.switchScreen('couple-details');
                }
            });
        });
    }

    switchScreen(screenId) {
        // Hide all screens
        const screens = document.querySelectorAll('.screen');
        screens.forEach(screen => {
            screen.classList.remove('active');
        });

        // Show target screen
        const targetScreen = document.getElementById(`${screenId}-screen`);
        if (targetScreen) {
            targetScreen.classList.add('active');
        }

        // Update nav items
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-screen') === screenId) {
                item.classList.add('active');
            }
        });

        // Update current screen
        this.currentScreen = screenId;
        this.updateBreadcrumb();

        // Close mobile sidebar if open
        this.closeMobileSidebar();
    }

    updateBreadcrumb() {
        const breadcrumb = document.getElementById('current-section');
        if (breadcrumb) {
            const screenNames = {
                'overview': 'Overview',
                'couple-details': 'Couple Details',
                'venue-selection': 'Venues',
                'style-design': 'Style & Design',
                'vendors': 'Vendors',
                'budget': 'Budget',
                'timeline': 'Timeline',
                'guest-list': 'Guest List',
                'checklist': 'Checklist'
            };
            breadcrumb.textContent = screenNames[this.currentScreen] || 'Overview';
        }
    }

    initMobileToggle() {
        const sidebarToggle = document.querySelector('.sidebar-toggle');
        const sidebar = document.querySelector('.sidebar');
        
        if (sidebarToggle && sidebar) {
            sidebarToggle.addEventListener('click', () => {
                sidebar.classList.toggle('open');
            });

            // Close sidebar when clicking outside on mobile
            document.addEventListener('click', (e) => {
                if (window.innerWidth <= 768) {
                    if (!sidebar.contains(e.target) && !sidebarToggle.contains(e.target)) {
                        sidebar.classList.remove('open');
                    }
                }
            });
        }
    }

    closeMobileSidebar() {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar && window.innerWidth <= 768) {
            sidebar.classList.remove('open');
        }
    }
}

// Initialize navigation when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.navigationManager = new NavigationManager();
}); 