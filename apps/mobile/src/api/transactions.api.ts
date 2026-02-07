import apiClient from './client';
import {
  Transaction,
  TransactionSummary,
  CreateTransactionRequest,
  UpdateTransactionRequest,
  PaginatedResponse,
} from './types';

export const transactionsApi = {
  getTransactions: async (params?: {
    page?: number;
    limit?: number;
    type?: 'income' | 'expense';
    category?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }): Promise<PaginatedResponse<Transaction>> => {
    const response = await apiClient.get<PaginatedResponse<Transaction>>(
      '/transactions',
      { params }
    );
    return response.data;
  },

  getTransaction: async (id: string): Promise<Transaction> => {
    const response = await apiClient.get<Transaction>(`/transactions/${id}`);
    return response.data;
  },

  createTransaction: async (
    data: CreateTransactionRequest
  ): Promise<Transaction> => {
    const response = await apiClient.post<Transaction>('/transactions', data);
    return response.data;
  },

  updateTransaction: async (
    id: string,
    data: UpdateTransactionRequest
  ): Promise<Transaction> => {
    const response = await apiClient.patch<Transaction>(
      `/transactions/${id}`,
      data
    );
    return response.data;
  },

  deleteTransaction: async (id: string): Promise<void> => {
    await apiClient.delete(`/transactions/${id}`);
  },

  getSummary: async (params?: {
    startDate?: string;
    endDate?: string;
    category?: string;
  }): Promise<TransactionSummary> => {
    const response = await apiClient.get<TransactionSummary>(
      '/transactions/summary',
      { params }
    );
    return response.data;
  },
};
