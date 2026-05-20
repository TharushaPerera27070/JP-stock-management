import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CompanySettings {
  name: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  taxId?: string;
  logo?: string; // base64 or URL
}

export interface User {
  id: string;
  email: string;
  name: string;
  companySettings: CompanySettings;
}

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;
  login: (user: User) => void;
  logout: () => void;
  updateCompanySettings: (settings: CompanySettings) => void;
  setHasHydrated: (value: boolean) => void;
}

const defaultCompanySettings: CompanySettings = {
  name: 'My Company',
  address: '123 Business St, City, State 12345',
  phone: '+1 (555) 000-0000',
  email: 'info@mycompany.com',
  website: 'www.mycompany.com',
  taxId: 'TAX-12345',
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      hasHydrated: false,
      login: (user: User) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
      setHasHydrated: (value: boolean) => set({ hasHydrated: value }),
      updateCompanySettings: (settings: CompanySettings) =>
        set((state) => {
          if (!state.user) return state;
          return {
            user: {
              ...state.user,
              companySettings: settings,
            },
          };
        }),
    }),
    {
      name: 'auth-storage',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
