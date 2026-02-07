import apiClient from './client';
import {
  Budget,
  CreateBudgetRequest,
  UpdateBudgetRequest,
} from './types';

export const budgetsApi = {
  getBudgets: async (params?: {
    category?: string;
    period?: 'monthly' | 'yearly';
    active?: boolean;
  }): Promise<Budget[]> => {
    const response = await apiClient.get<Budget[]>('/budgets', { params });
    return response.data;
  },

  getBudget: async (id: string): Promise<Budget> => {
    const response = await apiClient.get<Budget>(`/budgets/${id}`);
    return response.data;
  },

  createBudget: async (data: CreateBudgetRequest): Promise<Budget> => {
    const response = await apiClient.post<Budget>('/budgets', data);
    return response.data;
  },

  updateBudget: async (
    id: string,
    data: UpdateBudgetRequest
  ): Promise<Budget> => {
    const response = await apiClient.patch<Budget>(`/budgets/${id}`, data);
    return response.data;
  },

  deleteBudget: async (id: string): Promise<void> => {
    await apiClient.delete(`/budgets/${id}`);
  },
};
