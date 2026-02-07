import {
  useQuery,
  useMutation,
  useInfiniteQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { transactionsApi } from '../api/transactions.api';
import { useUIStore } from '../stores/uiStore';
import { CreateTransactionRequest, UpdateTransactionRequest } from '../api/types';

export const useTransactions = (params?: {
  page?: number;
  limit?: number;
  type?: 'income' | 'expense';
  category?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}) => {
  return useQuery({
    queryKey: ['transactions', params],
    queryFn: () => transactionsApi.getTransactions(params),
  });
};

export const useInfiniteTransactions = (params?: {
  limit?: number;
  type?: 'income' | 'expense';
  category?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}) => {
  return useInfiniteQuery({
    queryKey: ['transactions', 'infinite', params],
    queryFn: ({ pageParam = 1 }) =>
      transactionsApi.getTransactions({ ...params, page: pageParam }),
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
    initialPageParam: 1,
  });
};

export const useTransaction = (id: string) => {
  return useQuery({
    queryKey: ['transaction', id],
    queryFn: () => transactionsApi.getTransaction(id),
    enabled: !!id,
  });
};

export const useTransactionSummary = (params?: {
  startDate?: string;
  endDate?: string;
  category?: string;
}) => {
  return useQuery({
    queryKey: ['summary', params],
    queryFn: () => transactionsApi.getSummary(params),
  });
};

export const useCreateTransaction = () => {
  const queryClient = useQueryClient();
  const showToast = useUIStore((state) => state.showToast);

  return useMutation({
    mutationFn: (data: CreateTransactionRequest) =>
      transactionsApi.createTransaction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
      showToast('거래가 추가되었습니다', 'success');
    },
    onError: (error: any) => {
      showToast(
        error.response?.data?.message || '거래 추가 실패',
        'error'
      );
    },
  });
};

export const useUpdateTransaction = () => {
  const queryClient = useQueryClient();
  const showToast = useUIStore((state) => state.showToast);

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateTransactionRequest;
    }) => transactionsApi.updateTransaction(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
      showToast('거래가 수정되었습니다', 'success');
    },
    onError: (error: any) => {
      showToast(
        error.response?.data?.message || '거래 수정 실패',
        'error'
      );
    },
  });
};

export const useDeleteTransaction = () => {
  const queryClient = useQueryClient();
  const showToast = useUIStore((state) => state.showToast);

  return useMutation({
    mutationFn: (id: string) => transactionsApi.deleteTransaction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
      showToast('거래가 삭제되었습니다', 'success');
    },
    onError: (error: any) => {
      showToast(
        error.response?.data?.message || '거래 삭제 실패',
        'error'
      );
    },
  });
};
