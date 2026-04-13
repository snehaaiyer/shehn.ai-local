import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

type UserRole = 'couple' | 'vendor' | 'superadmin';

/* ─── Blueprint: the single source of truth for the couple's wedding plan ─── */
export interface BlueprintData {
  // Wedding basics
  city: string;
  date: string;
  guestCount: string;
  budget: string;
  theme: string;
  events: string[];
  weddingDays?: number;           // number of days for the wedding (1, 2, 3, etc.)
  // AI-generated plan
  budgetBreakdown: Record<string, number>;     // { venue: 1800000, photography: 500000, ... }
  categorySpecs: Record<string, any>;           // { venue: { requirements: {...}, notes: '' }, ... }
  timeline: any[];
  costSavingTips: string[];
  aiSummary: string;
}

export type PlanningStage = 'preferences' | 'blueprint' | 'published' | 'vendors' | 'booked';

interface AppState {
  // UI
  sidebarOpen: boolean;
  theme: 'light' | 'dark';

  // Role & Identity
  currentRole: UserRole;
  currentUserId: number;

  // ─── THE BLUEPRINT (single source of truth) ───
  blueprintId: number | null;
  blueprint: BlueprintData | null;
  planningStage: PlanningStage;

  // Vendor pipeline
  shortlistedVendors: Array<{ id: string; category: string; name: string }>;
  draftVendorMessages: any[];

  // Messaging
  activeConversationId: number | null;
  unreadMessageCount: number;

  // AI Planner chat memory (persisted so user doesn't lose conversation on navigation)
  plannerChatMessages: Array<{
    id: string;
    content: string;
    sender: 'user' | 'ai' | 'system';
    timestamp: string; // ISO string for serialization
    interactive?: any;
    feedback?: 'helpful' | 'not_helpful' | null;
  }>;

  // Legacy fields (kept for backward compatibility during migration)
  weddingPreferences: Record<string, any>;
  chatHistory: Array<{ role: 'user' | 'assistant'; content: string; timestamp: number }>;
  selectedVendors: any[];
  vendorSearchResults: any[];
}

interface AppStore extends AppState {
  // UI
  setSidebarOpen: (open: boolean) => void;
  toggleTheme: () => void;

  // Role
  setRole: (role: UserRole) => void;
  setUserId: (id: number) => void;

  // ─── BLUEPRINT ACTIONS (the only way plan data should be written) ───
  setBlueprintId: (id: number | null) => void;
  setBlueprint: (data: BlueprintData) => void;
  updateBlueprint: (partial: Partial<BlueprintData>) => void;
  setPlanningStage: (stage: PlanningStage) => void;
  clearPlan: () => void;

  // Vendor pipeline
  shortlistVendor: (vendor: { id: string; category: string; name: string }) => void;
  unshortlistVendor: (vendorId: string) => void;
  setDraftVendorMessages: (msgs: any[]) => void;

  // Messaging
  setActiveConversation: (id: number | null) => void;
  setUnreadCount: (count: number) => void;

  // Planner chat memory
  setPlannerChatMessages: (messages: AppState['plannerChatMessages']) => void;
  clearPlannerChatMessages: () => void;

  // Legacy (backward compat)
  updateWeddingPreferences: (prefs: Record<string, any>) => void;
  addChatMessage: (msg: { role: 'user' | 'assistant'; content: string }) => void;
  clearChatHistory: () => void;
  addSelectedVendor: (vendor: any) => void;
  removeSelectedVendor: (vendorId: string) => void;
  setVendorSearchResults: (results: any[]) => void;
  clearSelectedVendors: () => void;
}

const EMPTY_BLUEPRINT: BlueprintData = {
  city: '', date: '', guestCount: '', budget: '', theme: '', events: [],
  budgetBreakdown: {}, categorySpecs: {}, timeline: [], costSavingTips: [], aiSummary: '',
};

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // ─── Initial state ───
      sidebarOpen: false,
      theme: 'light',
      currentRole: 'couple',
      currentUserId: 1,

      blueprintId: null,
      blueprint: null,
      planningStage: 'preferences',

      shortlistedVendors: [],
      draftVendorMessages: [],

      activeConversationId: null,
      unreadMessageCount: 0,

      // Planner chat memory
      plannerChatMessages: [],

      // Legacy
      weddingPreferences: {},
      chatHistory: [],
      selectedVendors: [],
      vendorSearchResults: [],

      // ─── UI Actions ───
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleTheme: () => set((s) => ({ theme: s.theme === 'light' ? 'dark' : 'light' })),

      // ─── Role ───
      setRole: (role) => { localStorage.setItem('shehnai_role', role); set({ currentRole: role }); },
      setUserId: (id) => { localStorage.setItem('shehnai_user_id', String(id)); set({ currentUserId: id }); },

      // ─── BLUEPRINT ACTIONS ───
      setBlueprintId: (id) => {
        const stage = id ? (get().planningStage === 'preferences' ? 'blueprint' : get().planningStage) : 'preferences';
        set({ blueprintId: id, planningStage: stage });
      },

      setBlueprint: (data) => {
        set({ blueprint: data, planningStage: data ? 'blueprint' : 'preferences' });
        // Sync to legacy weddingPreferences for backward compat
        set({
          weddingPreferences: {
            basicDetails: { location: data.city, guestCount: data.guestCount, budgetRange: data.budget, weddingDate: data.date },
            theme: { selectedTheme: data.theme },
            events: data.events,
            budget_breakdown: data.budgetBreakdown,
            category_specs: data.categorySpecs,
          }
        });
      },

      updateBlueprint: (partial) => {
        const current = get().blueprint || EMPTY_BLUEPRINT;
        const updated = { ...current, ...partial };
        set({ blueprint: updated });
        // Keep legacy in sync
        if (partial.city || partial.guestCount || partial.budget || partial.date || partial.theme) {
          const prefs = get().weddingPreferences || {};
          set({
            weddingPreferences: {
              ...prefs,
              basicDetails: {
                ...(prefs.basicDetails || {}),
                ...(partial.city ? { location: partial.city } : {}),
                ...(partial.guestCount ? { guestCount: partial.guestCount } : {}),
                ...(partial.budget ? { budgetRange: partial.budget } : {}),
                ...(partial.date ? { weddingDate: partial.date } : {}),
              },
              ...(partial.theme ? { theme: { selectedTheme: partial.theme } } : {}),
            }
          });
        }
      },

      setPlanningStage: (stage) => set({ planningStage: stage }),

      clearPlan: () => set({
        blueprintId: null, blueprint: null, planningStage: 'preferences',
        shortlistedVendors: [], draftVendorMessages: [],
        weddingPreferences: {}, plannerChatMessages: [],
      }),

      // ─── Vendor Pipeline ───
      shortlistVendor: (vendor) => {
        const current = get().shortlistedVendors;
        if (!current.find(v => v.id === vendor.id)) {
          const updated = [...current, vendor];
          set({ shortlistedVendors: updated });
          localStorage.setItem('shortlistedVendors', JSON.stringify(updated));
          // Auto-advance stage
          if (get().planningStage === 'published') set({ planningStage: 'vendors' });
        }
      },
      unshortlistVendor: (vendorId) => {
        const updated = get().shortlistedVendors.filter(v => v.id !== vendorId);
        set({ shortlistedVendors: updated });
        localStorage.setItem('shortlistedVendors', JSON.stringify(updated));
      },
      setDraftVendorMessages: (msgs) => set({ draftVendorMessages: msgs }),

      // ─── Messaging ───
      setActiveConversation: (id) => set({ activeConversationId: id }),
      setUnreadCount: (count) => set({ unreadMessageCount: count }),

      // ─── Planner Chat Memory ───
      setPlannerChatMessages: (messages) => set({ plannerChatMessages: messages }),
      clearPlannerChatMessages: () => set({ plannerChatMessages: [] }),

      // ─── Legacy (backward compat) ───
      updateWeddingPreferences: (prefs) => set((s) => ({
        weddingPreferences: { ...s.weddingPreferences, ...prefs }
      })),
      addChatMessage: (msg) => set((s) => ({
        chatHistory: [...s.chatHistory, { ...msg, timestamp: Date.now() }]
      })),
      clearChatHistory: () => set({ chatHistory: [] }),
      addSelectedVendor: (vendor) => set((s) => ({
        selectedVendors: [...s.selectedVendors, vendor]
      })),
      removeSelectedVendor: (vendorId) => set((s) => ({
        selectedVendors: s.selectedVendors.filter(v => v.id !== vendorId)
      })),
      setVendorSearchResults: (results) => set({ vendorSearchResults: results }),
      clearSelectedVendors: () => set({ selectedVendors: [] }),
    }),
    {
      name: 'shehnai-wedding-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        theme: state.theme,
        currentRole: state.currentRole,
        currentUserId: state.currentUserId,
        blueprintId: state.blueprintId,
        blueprint: state.blueprint,
        planningStage: state.planningStage,
        shortlistedVendors: state.shortlistedVendors,
        draftVendorMessages: state.draftVendorMessages,
        weddingPreferences: state.weddingPreferences,
        selectedVendors: state.selectedVendors,
        plannerChatMessages: state.plannerChatMessages,
      }),
    }
  )
);
