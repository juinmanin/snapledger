import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { budgetsApi } from '../api/budgets.api';
import { useUIStore } from '../stores/uiStore';
import { CreateBudgetRequest, UpdateBudgetRequest } from '../api/types';

export const useBudgets = (params?: {
  category?: string;
  period?: 'monthly' | 'yearly';
  active?: boolean;
}) => {
  return useQuery({
    queryKey: ['budgets', params],
    queryFn: () => budgetsApi.getBudgets(params),
  });
};

export const useBudget = (id: string) => {
  return useQuery({
    queryKey: ['budget', id],
    queryFn: () => budgetsApi.getBudget(id),
    enabled: !!id,
  });
};

export const useCreateBudget = () => {
  const queryClient = useQueryClient();
  const showToast = useUIStore((state) => state.showToast);

  return useMutation({
    mutationFn: (data: CreateBudgetRequest) => budgetsApi.createBudget(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      showToast('예산이 추가되었습니다', 'success');
    },
    onError: (error: any) => {
      showToast(
        error.response?.data?.message || '예산 추가 실패',
        'error'
      );
    },
  });
};

export const useUpdateBudget = () => {
  const queryClient = useQueryClient();
  const showToast = useUIStore((state) => state.showToast);

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBudgetRequest }) =>
      budgetsApi.updateBudget(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      showToast('예산이 수정되었습니다', 'success');
    },
    onError: (error: any) => {
      showToast(
        error.response?.data?.message || '예산 수정 실패',
        'error'
      );
    },
  });
};

export const useDeleteBudget = () => {
  const queryClient = useQueryClient();
  const showToast = useUIStore((state) => state.showToast);

  return useMutation({
    mutationFn: (id: string) => budgetsApi.deleteBudget(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      showToast('예산이 삭제되었습니다', 'success');
    },
    onError: (error: any) => {
      showToast(
        error.response?.data?.message || '예산 삭제 실패',
        'error'
      );
    },
  });
};
