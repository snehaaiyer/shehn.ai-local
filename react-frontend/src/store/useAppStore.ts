
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface AppState {
  // UI State
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  
  // Wedding Planning State
  weddingPreferences: {
    weddingType: string;
    city: string;
    guestCount: string;
    weddingStyle: string;
    weddingDate: string;
    budget: string;
    events: string[];
    priorities: string[];
    specialRequirements: string;
  };
  
  // Chat State
  chatHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
  }>;
  
  // Vendor State
  selectedVendors: any[];
  vendorSearchResults: any[];
}

interface AppStore extends AppState {
  // UI Actions
  setSidebarOpen: (open: boolean) => void;
  toggleTheme: () => void;
  
  // Wedding Preferences Actions
  updateWeddingPreferences: (preferences: Partial<AppState['weddingPreferences']>) => void;
  
  // Chat Actions
  addChatMessage: (message: { role: 'user' | 'assistant'; content: string }) => void;
  clearChatHistory: () => void;
  
  // Vendor Actions
  addSelectedVendor: (vendor: any) => void;
  removeSelectedVendor: (vendorId: string) => void;
  setVendorSearchResults: (results: any[]) => void;
  clearSelectedVendors: () => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Initial state
      sidebarOpen: false,
      theme: 'light',
      
      weddingPreferences: {
        weddingType: '',
        city: '',
        guestCount: '',
        weddingStyle: '',
        weddingDate: '',
        budget: '',
        events: [],
        priorities: [],
        specialRequirements: ''
      },
      
      chatHistory: [],
      selectedVendors: [],
      vendorSearchResults: [],
      
      // UI Actions
      setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),
      toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
      
      // Wedding Preferences Actions
      updateWeddingPreferences: (preferences) => 
        set((state) => ({
          weddingPreferences: { ...state.weddingPreferences, ...preferences }
        })),
      
      // Chat Actions
      addChatMessage: (message) => 
        set((state) => ({
          chatHistory: [...state.chatHistory, { ...message, timestamp: Date.now() }]
        })),
      
      clearChatHistory: () => set({ chatHistory: [] }),
      
      // Vendor Actions
      addSelectedVendor: (vendor) =>
        set((state) => ({
          selectedVendors: [...state.selectedVendors, vendor]
        })),
      
      removeSelectedVendor: (vendorId) =>
        set((state) => ({
          selectedVendors: state.selectedVendors.filter(v => v.id !== vendorId)
        })),
      
      setVendorSearchResults: (results) => set({ vendorSearchResults: results }),
      clearSelectedVendors: () => set({ selectedVendors: [] }),
    }),
    {
      name: 'shehnai-wedding-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        theme: state.theme,
        weddingPreferences: state.weddingPreferences,
        selectedVendors: state.selectedVendors,
      }),
    }
  )
);
