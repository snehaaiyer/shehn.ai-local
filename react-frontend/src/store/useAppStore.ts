
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface WeddingData {
  venue?: string;
  theme?: string;
  budget?: number;
  guestCount?: number;
  date?: string;
  location?: string;
}

interface AppStore {
  // UI State
  sidebarOpen: boolean;
  theme: 'light' | 'dark';

  // Wedding Data
  weddingData: WeddingData;

  // Actions
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  updateWeddingData: (data: Partial<WeddingData>) => void;
  resetWeddingData: () => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Initial state
      sidebarOpen: false,
      theme: 'light',
      weddingData: {},

      // Actions
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setTheme: (theme) => set({ theme }),
      updateWeddingData: (data) => set((state) => ({
        weddingData: { ...state.weddingData, ...data }
      })),
      resetWeddingData: () => set({ weddingData: {} }),
    }),
    {
      name: 'wedding-app-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        theme: state.theme,
        weddingData: state.weddingData,
      }),
    }
  )
);
