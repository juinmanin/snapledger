import { create } from 'zustand';

interface TransactionFilters {
  type?: 'income' | 'expense';
  category?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

interface TransactionStore {
  filters: TransactionFilters;
  setFilters: (filters: TransactionFilters) => void;
  clearFilters: () => void;
  setFilter: (key: keyof TransactionFilters, value: any) => void;
}

export const useTransactionStore = create<TransactionStore>((set) => ({
  filters: {},

  setFilters: (filters) =>
    set({
      filters,
    }),

  clearFilters: () =>
    set({
      filters: {},
    }),

  setFilter: (key, value) =>
    set((state) => ({
      filters: {
        ...state.filters,
        [key]: value,
      },
    })),
}));
