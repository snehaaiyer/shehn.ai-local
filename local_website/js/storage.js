// Local Storage Management for BID AI Wedding Assistant
class WeddingStorage {
    constructor() {
        this.keys = {
            DASHBOARD_DATA: 'bidai_dashboard_data',
            WEDDING_FORM: 'bidai_wedding_form',
            VISUAL_PREFERENCES: 'bidai_visual_preferences',
            USER_SETTINGS: 'bidai_user_settings'
        };
    }

    // Generic storage methods
    set(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Storage error:', error);
            return false;
        }
    }

    get(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (error) {
            console.error('Storage retrieval error:', error);
            return defaultValue;
        }
    }

    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Storage removal error:', error);
            return false;
        }
    }

    clear() {
        try {
            Object.values(this.keys).forEach(key => {
                localStorage.removeItem(key);
            });
            return true;
        } catch (error) {
            console.error('Storage clear error:', error);
            return false;
        }
    }

    // Dashboard data methods
    saveDashboardData(data) {
        const defaultData = {
            coupleName: "Priya & Arjun",
            weddingDate: "",
            progress: 0,
            daysLeft: 0,
            budget: "₹25 Lakhs",
            budgetUsed: "₹0",
            lastUpdated: new Date().toISOString()
        };
        
        const dashboardData = { ...defaultData, ...data };
        return this.set(this.keys.DASHBOARD_DATA, dashboardData);
    }

    getDashboardData() {
        return this.get(this.keys.DASHBOARD_DATA, {
            coupleName: "Priya & Arjun",
            weddingDate: "",
            progress: 0,
            daysLeft: 0,
            budget: "₹25 Lakhs",
            budgetUsed: "₹0",
            lastUpdated: new Date().toISOString()
        });
    }

    // Wedding form data methods
    saveWeddingForm(data) {
        const defaultData = {
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
            specialRequests: "",
            lastUpdated: new Date().toISOString()
        };
        
        const formData = { ...defaultData, ...data };
        return this.set(this.keys.WEDDING_FORM, formData);
    }

    getWeddingForm() {
        return this.get(this.keys.WEDDING_FORM, {
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
            specialRequests: "",
            lastUpdated: new Date().toISOString()
        });
    }

    // Visual preferences data methods
    saveVisualPreferences(data) {
        const defaultData = {
            decorTheme: '',
            cuisineStyle: '',
            photoStyle: '',
            venueType: '',
            specialRequests: '',
            lastUpdated: new Date().toISOString()
        };
        
        const visualData = { ...defaultData, ...data };
        return this.set(this.keys.VISUAL_PREFERENCES, visualData);
    }

    getVisualPreferences() {
        return this.get(this.keys.VISUAL_PREFERENCES, {
            decorTheme: '',
            cuisineStyle: '',
            photoStyle: '',
            venueType: '',
            specialRequests: '',
            lastUpdated: new Date().toISOString()
        });
    }

    // User settings methods
    saveUserSettings(data) {
        return this.set(this.keys.USER_SETTINGS, data);
    }

    getUserSettings() {
        return this.get(this.keys.USER_SETTINGS, {
            theme: 'default',
            notifications: true,
            language: 'en'
        });
    }

    // Calculate overall progress
    calculateOverallProgress() {
        const weddingForm = this.getWeddingForm();
        const visualPrefs = this.getVisualPreferences();
        
        let totalFields = 0;
        let completedFields = 0;

        // Wedding form progress
        const formFields = ['yourName', 'partnerName', 'contactNumber', 'email', 'weddingDate'];
        formFields.forEach(field => {
            totalFields++;
            if (weddingForm[field] && weddingForm[field].toString().trim()) {
                completedFields++;
            }
        });

        // Visual preferences progress
        const visualFields = ['decorTheme', 'cuisineStyle', 'photoStyle', 'venueType'];
        visualFields.forEach(field => {
            totalFields++;
            if (visualPrefs[field] && visualPrefs[field].toString().trim()) {
                completedFields++;
            }
        });

        return Math.round((completedFields / totalFields) * 100);
    }

    // Calculate days until wedding
    calculateDaysUntilWedding() {
        const weddingForm = this.getWeddingForm();
        if (!weddingForm.weddingDate) return 0;

        const today = new Date();
        const weddingDate = new Date(weddingForm.weddingDate);
        const diffTime = weddingDate - today;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    // Export all data
    exportData() {
        return {
            dashboard: this.getDashboardData(),
            weddingForm: this.getWeddingForm(),
            visualPreferences: this.getVisualPreferences(),
            userSettings: this.getUserSettings(),
            exportDate: new Date().toISOString()
        };
    }

    // Import data
    importData(data) {
        try {
            if (data.dashboard) this.saveDashboardData(data.dashboard);
            if (data.weddingForm) this.saveWeddingForm(data.weddingForm);
            if (data.visualPreferences) this.saveVisualPreferences(data.visualPreferences);
            if (data.userSettings) this.saveUserSettings(data.userSettings);
            return true;
        } catch (error) {
            console.error('Import error:', error);
            return false;
        }
    }
}

// Create global storage instance
window.weddingStorage = new WeddingStorage(); 