// ============================================
// SubVault - Zustand Store with localStorage
// ============================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Subscription, SubscriptionFormData, Provider, UserProfile, ReminderPreferences, Category } from '@/types';

// Generate unique IDs
function generateId(): string {
  return crypto.randomUUID ? crypto.randomUUID() : 
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
}

// Demo subscriptions for first-time users
const DEMO_SUBSCRIPTIONS: Subscription[] = [
  {
    id: generateId(),
    userId: 'demo',
    providerId: 'chatgpt',
    providerName: 'ChatGPT',
    category: 'ai',
    planName: 'Plus',
    billingCycle: 'monthly',
    amount: 20,
    currency: 'USD',
    startDate: '2025-01-15',
    expiryDate: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
    autoRenew: true,
    status: 'active',
    account: 'user@example.com',
    password: 'SecureP@ss123',
    notes: 'GPT-4 access, DALL-E, Advanced Data Analysis',
    tags: ['work', 'essential'],
    source: 'manual',
    createdAt: '2025-01-15T00:00:00Z',
    updatedAt: '2025-01-15T00:00:00Z',
  },
  {
    id: generateId(),
    userId: 'demo',
    providerId: 'claude',
    providerName: 'Claude',
    category: 'ai',
    planName: 'Pro',
    billingCycle: 'monthly',
    amount: 20,
    currency: 'USD',
    startDate: '2025-03-01',
    expiryDate: new Date(Date.now() + 12 * 86400000).toISOString().slice(0, 10),
    autoRenew: true,
    status: 'active',
    account: 'user@example.com',
    password: 'Cl@ude2025!',
    notes: 'Claude 3.5 Sonnet, 200K context',
    tags: ['work', 'essential'],
    source: 'manual',
    createdAt: '2025-03-01T00:00:00Z',
    updatedAt: '2025-03-01T00:00:00Z',
  },
  {
    id: generateId(),
    userId: 'demo',
    providerId: 'netflix',
    providerName: 'Netflix',
    category: 'streaming',
    planName: 'Premium',
    billingCycle: 'monthly',
    amount: 499,
    currency: 'THB',
    startDate: '2024-06-01',
    expiryDate: new Date(Date.now() + 20 * 86400000).toISOString().slice(0, 10),
    autoRenew: true,
    status: 'active',
    account: 'user.netflix@gmail.com',
    password: 'Netfl1x!Pwd',
    tags: ['personal', 'entertainment'],
    source: 'manual',
    createdAt: '2024-06-01T00:00:00Z',
    updatedAt: '2024-06-01T00:00:00Z',
  },
  {
    id: generateId(),
    userId: 'demo',
    providerId: 'nordvpn',
    providerName: 'NordVPN',
    category: 'vpn',
    planName: 'Complete',
    billingCycle: 'annual',
    amount: 4188,
    currency: 'THB',
    startDate: '2025-01-10',
    expiryDate: new Date(Date.now() + 45 * 86400000).toISOString().slice(0, 10),
    autoRenew: true,
    status: 'active',
    account: 'vpn_user@pm.me',
    password: 'N0rdVPN_s3cure!',
    notes: 'Threat Protection, Meshnet enabled',
    tags: ['security', 'essential'],
    source: 'manual',
    createdAt: '2025-01-10T00:00:00Z',
    updatedAt: '2025-01-10T00:00:00Z',
  },
  {
    id: generateId(),
    userId: 'demo',
    providerId: 'youtube-premium',
    providerName: 'YouTube Premium',
    category: 'streaming',
    planName: 'Individual',
    billingCycle: 'monthly',
    amount: 159,
    currency: 'THB',
    startDate: '2024-08-01',
    expiryDate: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
    autoRenew: true,
    status: 'active',
    account: 'user@gmail.com',
    password: 'YT_Pr3m1um!',
    tags: ['personal'],
    source: 'manual',
    createdAt: '2024-08-01T00:00:00Z',
    updatedAt: '2024-08-01T00:00:00Z',
  },
  {
    id: generateId(),
    userId: 'demo',
    providerId: 'spotify',
    providerName: 'Spotify',
    category: 'streaming',
    planName: 'Premium',
    billingCycle: 'monthly',
    amount: 149,
    currency: 'THB',
    startDate: '2024-03-01',
    expiryDate: new Date(Date.now() + 8 * 86400000).toISOString().slice(0, 10),
    autoRenew: true,
    status: 'active',
    account: 'music.lover@gmail.com',
    password: 'Sp0tify_22!',
    tags: ['personal', 'music'],
    source: 'manual',
    createdAt: '2024-03-01T00:00:00Z',
    updatedAt: '2024-03-01T00:00:00Z',
  },
  {
    id: generateId(),
    userId: 'demo',
    providerId: 'cursor',
    providerName: 'Cursor',
    category: 'ai',
    planName: 'Pro',
    billingCycle: 'monthly',
    amount: 20,
    currency: 'USD',
    startDate: '2025-05-01',
    expiryDate: new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
    autoRenew: true,
    status: 'active',
    account: 'dev@company.com',
    password: 'Curs0r_Dev!',
    notes: 'AI-powered code editor, 500 fast requests/mo',
    tags: ['work', 'dev-tools'],
    source: 'manual',
    createdAt: '2025-05-01T00:00:00Z',
    updatedAt: '2025-05-01T00:00:00Z',
  },
  {
    id: generateId(),
    userId: 'demo',
    providerId: 'notion',
    providerName: 'Notion',
    category: 'cloud',
    planName: 'Plus',
    billingCycle: 'annual',
    amount: 96,
    currency: 'USD',
    startDate: '2025-02-01',
    expiryDate: new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10),
    autoRenew: false,
    status: 'active',
    account: 'user@notion.so',
    password: 'Not1on_Pl4n!',
    tags: ['work', 'productivity'],
    source: 'manual',
    createdAt: '2025-02-01T00:00:00Z',
    updatedAt: '2025-02-01T00:00:00Z',
  },
  {
    id: generateId(),
    userId: 'demo',
    providerId: 'google-one',
    providerName: 'Google One',
    category: 'cloud',
    planName: '2TB',
    billingCycle: 'annual',
    amount: 3290,
    currency: 'THB',
    startDate: '2025-04-01',
    expiryDate: new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10),
    autoRenew: true,
    status: 'active',
    account: 'user@gmail.com',
    password: 'G00gle_1!',
    tags: ['personal', 'storage'],
    source: 'manual',
    createdAt: '2025-04-01T00:00:00Z',
    updatedAt: '2025-04-01T00:00:00Z',
  },
];

interface StoreState {
  // Auth
  isAuthenticated: boolean;
  user: UserProfile | null;
  hasInitialized: boolean;
  
  // Data
  subscriptions: Subscription[];
  customProviders: Provider[];
  reminderPreferences: ReminderPreferences;
  
  // UI
  sidebarOpen: boolean;
  
  // Integrations & AI
  geminiApiKey: string;
  selectedGeminiModel: string;
  setGeminiConfig: (apiKey: string, model: string) => void;

  // Actions
  login: (username: string, password: string) => boolean;
  logout: () => void;
  syncWithCloud: () => Promise<void>;
  
  addSubscription: (data: SubscriptionFormData) => void;
  updateSubscription: (id: string, data: Partial<Subscription>) => void;
  deleteSubscription: (id: string) => void;
  restoreSubscription: (id: string) => void;
  permanentlyDeleteSubscription: (id: string) => void;
  
  addCustomProvider: (provider: Omit<Provider, 'id' | 'isPreset'>) => void;
  updateCustomProvider: (id: string, data: Partial<Provider>) => void;
  
  updateReminderPreferences: (prefs: Partial<ReminderPreferences>) => void;
  
  setSidebarOpen: (open: boolean) => void;
  
  // Demo
  loadDemoData: () => void;
  clearAllData: () => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      // Initial state
      isAuthenticated: false,
      user: null,
      hasInitialized: false,
      subscriptions: [],
      customProviders: [],
      reminderPreferences: {
        telegramEnabled: true,
        reminderDays: [30, 14, 7, 3, 1, 0],
        dailyDigestEnabled: false,
        dailyDigestHourUtc: 1,
      },
      sidebarOpen: true,
      geminiApiKey: '',
      selectedGeminiModel: 'gemini-3.5-flash-lite',

      setGeminiConfig: (apiKey: string, model: string) => {
        set({ geminiApiKey: apiKey, selectedGeminiModel: model });
      },

      // Auth
      login: (username: string, password: string) => {
        // Simple single-user auth for MVP (demo mode)
        if (username.length >= 3 && password.length >= 6) {
          const user: UserProfile = {
            id: 'user-1',
            username,
            createdAt: new Date().toISOString(),
          };
          set({ isAuthenticated: true, user });
          
          // Load demo data only on initial first-time launch
          if (!get().hasInitialized) {
            set({ subscriptions: DEMO_SUBSCRIPTIONS, hasInitialized: true });
          }
          
          // Trigger cloud sync asynchronously
          get().syncWithCloud();
          return true;
        }
        return false;
      },
      
      logout: () => {
        set({ isAuthenticated: false, user: null });
      },

      syncWithCloud: async () => {
        try {
          const res = await fetch('/api/subscriptions');
          if (!res.ok) return;
          const data = await res.json();
          if (data.status === 'success' && Array.isArray(data.subscriptions) && data.subscriptions.length > 0) {
            set({ subscriptions: data.subscriptions, hasInitialized: true });
          }
        } catch (e) {
          console.warn('Sync with cloud skipped or offline:', e);
        }
      },

      // Subscriptions
      addSubscription: async (data: SubscriptionFormData) => {
        const now = new Date().toISOString();
        const newSub: Subscription = {
          id: generateId(),
          userId: get().user?.id || 'user-1',
          providerId: data.providerId,
          providerName: data.providerName,
          customProviderName: data.customProviderName,
          category: data.category,
          planName: data.planName,
          billingCycle: data.billingCycle,
          amount: data.amount,
          currency: data.currency,
          startDate: data.startDate,
          expiryDate: data.expiryDate,
          autoRenew: data.autoRenew,
          status: 'active',
          account: data.account,
          password: data.password,
          notes: data.notes,
          supportContact: data.supportContact,
          tags: data.tags,
          source: data.source,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          subscriptions: [...state.subscriptions, newSub],
          hasInitialized: true,
        }));

        try {
          await fetch('/api/subscriptions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newSub),
          });
        } catch (e) {
          console.warn('Could not post to cloud API:', e);
        }
      },

      updateSubscription: async (id: string, data: Partial<Subscription>) => {
        set((state) => ({
          subscriptions: state.subscriptions.map((s) =>
            s.id === id ? { ...s, ...data, updatedAt: new Date().toISOString() } : s
          ),
        }));

        try {
          await fetch('/api/subscriptions', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, ...data }),
          });
        } catch (e) {
          console.warn('Could not update in cloud API:', e);
        }
      },

      deleteSubscription: async (id: string) => {
        const deletedAt = new Date().toISOString();
        set((state) => ({
          subscriptions: state.subscriptions.map((s) =>
            s.id === id ? { ...s, deletedAt } : s
          ),
        }));

        try {
          await fetch('/api/subscriptions', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, deletedAt }),
          });
        } catch (e) {
          console.warn('Could not soft-delete in cloud API:', e);
        }
      },

      restoreSubscription: async (id: string) => {
        set((state) => ({
          subscriptions: state.subscriptions.map((s) =>
            s.id === id ? { ...s, deletedAt: undefined } : s
          ),
        }));

        try {
          await fetch('/api/subscriptions', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, deletedAt: null }),
          });
        } catch (e) {
          console.warn('Could not restore in cloud API:', e);
        }
      },

      permanentlyDeleteSubscription: async (id: string) => {
        set((state) => ({
          subscriptions: state.subscriptions.filter((s) => s.id !== id),
        }));

        try {
          await fetch(`/api/subscriptions?id=${id}`, {
            method: 'DELETE',
          });
        } catch (e) {
          console.warn('Could not delete from cloud API:', e);
        }
      },

      // Custom Providers
      addCustomProvider: (provider) => {
        const newProvider: Provider = {
          ...provider,
          id: `custom-${generateId()}`,
          isPreset: false,
        };
        set((state) => ({
          customProviders: [...state.customProviders, newProvider],
        }));
      },

      updateCustomProvider: (id: string, data: Partial<Provider>) => {
        set((state) => ({
          customProviders: state.customProviders.map((p) =>
            p.id === id ? { ...p, ...data } : p
          ),
        }));
      },

      // Preferences
      updateReminderPreferences: (prefs) => {
        set((state) => ({
          reminderPreferences: { ...state.reminderPreferences, ...prefs },
        }));
      },

      // UI
      setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),

      // Demo
      loadDemoData: () => {
        set({ subscriptions: DEMO_SUBSCRIPTIONS });
      },

      clearAllData: () => {
        set({
          subscriptions: [],
          customProviders: [],
          hasInitialized: true,
        });
      },
    }),
    {
      name: 'subvault-storage',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        hasInitialized: state.hasInitialized,
        subscriptions: state.subscriptions,
        customProviders: state.customProviders,
        reminderPreferences: state.reminderPreferences,
      }),
    }
  )
);
