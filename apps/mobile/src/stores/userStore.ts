import { create } from 'zustand';
import { User } from '../api/types';

interface UserStore {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  updateUserMode: (mode: 'personal' | 'business') => void;
  setActiveBusinessId: (businessId: string | undefined) => void;
  logout: () => void;
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  isAuthenticated: false,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
    }),

  updateUserMode: (mode) =>
    set((state) => ({
      user: state.user ? { ...state.user, userMode: mode } : null,
    })),

  setActiveBusinessId: (businessId) =>
    set((state) => ({
      user: state.user ? { ...state.user, activeBusinessId: businessId } : null,
    })),

  logout: () =>
    set({
      user: null,
      isAuthenticated: false,
    }),
}));
