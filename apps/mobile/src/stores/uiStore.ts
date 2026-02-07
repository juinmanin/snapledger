import { create } from 'zustand';

interface ToastMessage {
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
}

interface UIStore {
  isLoading: boolean;
  toast: ToastMessage | null;
  setLoading: (loading: boolean) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info', duration?: number) => void;
  hideToast: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  isLoading: false,
  toast: null,

  setLoading: (loading) =>
    set({
      isLoading: loading,
    }),

  showToast: (message, type = 'info', duration = 3000) =>
    set({
      toast: { message, type, duration },
    }),

  hideToast: () =>
    set({
      toast: null,
    }),
}));
