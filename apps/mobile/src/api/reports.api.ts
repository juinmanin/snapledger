import apiClient from './client';
import { IncomeExpenseReport, CategoryReport } from './types';

export const reportsApi = {
  getIncomeExpenseReport: async (params: {
    startDate: string;
    endDate: string;
    groupBy?: 'day' | 'week' | 'month';
  }): Promise<IncomeExpenseReport> => {
    const response = await apiClient.get<IncomeExpenseReport>(
      '/reports/income-expense',
      { params }
    );
    return response.data;
  },

  getCategoryReport: async (params: {
    startDate: string;
    endDate: string;
    type?: 'income' | 'expense';
  }): Promise<CategoryReport[]> => {
    const response = await apiClient.get<CategoryReport[]>(
      '/reports/category',
      { params }
    );
    return response.data;
  },
};
