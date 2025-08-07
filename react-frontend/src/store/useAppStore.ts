import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WeddingData {
  couple: {
    partner1: string;
    partner2: string;
    weddingDate: string;
    location: string;
    daysUntil: number;
  };
  budget: {
    total: number;
    spent: number;
    remaining: number;
  };
  vendors: Array<{
    category: string;
    count: number;
    icon: React.ReactNode;
  }>;
}

interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    duration?: number;
  }>;
}

interface AppStore extends UIState {
  weddingData: WeddingData;
  userPreferences: Record<string, any>;
  
  // Actions
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  addNotification: (notification: Omit<UIState['notifications'][0], 'id'>) => void;
  removeNotification: (id: string) => void;
  updateWeddingData: (data: Partial<WeddingData>) => void;
  updateUserPreferences: (key: string, value: any) => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Initial state
      sidebarOpen: false,
      theme: 'light',
      notifications: [],
      weddingData: {
        couple: {
          partner1: 'Priya',
          partner2: 'Rahul',
          weddingDate: '2025-03-15',
          location: 'Bangalore',
          daysUntil: 45
        },
        budget: {
          total: 500000,
          spent: 125000,
          remaining: 375000
        },
        vendors: [
          { category: 'Venues', count: 12, icon: '🏛️' },
          { category: 'Photography', count: 8, icon: '📸' },
          { category: 'Catering', count: 15, icon: '🍽️' },
          { category: 'Decoration', count: 10, icon: '🌸' },
          { category: 'Entertainment', count: 6, icon: '🎵' },
          { category: 'Beauty', count: 9, icon: '💄' }
        ]
      },
      userPreferences: {},

      // Actions
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setTheme: (theme) => set({ theme }),
      addNotification: (notification) => {
        const id = Date.now().toString();
        const newNotification = { ...notification, id };
        set((state) => ({
          notifications: [...state.notifications, newNotification]
        }));
        
        // Auto-remove notification after duration
        if (notification.duration !== 0) {
          setTimeout(() => {
            get().removeNotification(id);
          }, notification.duration || 5000);
        }
      },
      removeNotification: (id) => set((state) => ({
        notifications: state.notifications.filter(n => n.id !== id)
      })),
      updateWeddingData: (data) => set((state) => ({
        weddingData: { ...state.weddingData, ...data }
      })),
      updateUserPreferences: (key, value) => set((state) => ({
        userPreferences: { ...state.userPreferences, [key]: value }
      }))
    }),
    {
      name: 'wedding-app-storage',
      partialize: (state) => ({
        weddingData: state.weddingData,
        userPreferences: state.userPreferences,
        theme: state.theme
      })
    }
  )
); 