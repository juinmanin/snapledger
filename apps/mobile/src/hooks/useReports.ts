import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '../api/reports.api';

export const useIncomeExpenseReport = (params: {
  startDate: string;
  endDate: string;
  groupBy?: 'day' | 'week' | 'month';
}) => {
  return useQuery({
    queryKey: ['report', 'income-expense', params],
    queryFn: () => reportsApi.getIncomeExpenseReport(params),
    enabled: !!params.startDate && !!params.endDate,
  });
};

export const useCategoryReport = (params: {
  startDate: string;
  endDate: string;
  type?: 'income' | 'expense';
}) => {
  return useQuery({
    queryKey: ['report', 'category', params],
    queryFn: () => reportsApi.getCategoryReport(params),
    enabled: !!params.startDate && !!params.endDate,
  });
};
