import { useMutation, useQueryClient } from '@tanstack/react-query';
import { receiptsApi } from '../api/receipts.api';
import { useUIStore } from '../stores/uiStore';

export const useScanReceipt = () => {
  const queryClient = useQueryClient();
  const showToast = useUIStore((state) => state.showToast);

  const scanMutation = useMutation({
    mutationFn: (imageUri: string) => receiptsApi.scanReceipt(imageUri),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      showToast('영수증 스캔 완료', 'success');
    },
    onError: (error: any) => {
      showToast(
        error.response?.data?.message || '영수증 스캔 실패',
        'error'
      );
    },
  });

  const confirmMutation = useMutation({
    mutationFn: ({
      receiptId,
      transactionData,
    }: {
      receiptId: string;
      transactionData: {
        type: 'income' | 'expense';
        category: string;
        amount: number;
        description: string;
        transactionDate: string;
      };
    }) => receiptsApi.confirmReceipt(receiptId, transactionData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
      showToast('거래 내역이 생성되었습니다', 'success');
    },
    onError: (error: any) => {
      showToast(
        error.response?.data?.message || '거래 확인 실패',
        'error'
      );
    },
  });

  return {
    scan: scanMutation.mutate,
    confirm: confirmMutation.mutate,
    isScanning: scanMutation.isPending,
    isConfirming: confirmMutation.isPending,
    scanResult: scanMutation.data,
  };
};
