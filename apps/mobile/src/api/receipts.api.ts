import apiClient from './client';
import { Receipt, ScanReceiptResponse } from './types';

export const receiptsApi = {
  scanReceipt: async (imageUri: string): Promise<ScanReceiptResponse> => {
    const formData = new FormData();
    
    const filename = imageUri.split('/').pop() || 'receipt.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    formData.append('image', {
      uri: imageUri,
      name: filename,
      type,
    } as any);

    const response = await apiClient.post<ScanReceiptResponse>(
      '/receipts/scan',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  getReceipts: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<{ receipts: Receipt[]; total: number }> => {
    const response = await apiClient.get<{ receipts: Receipt[]; total: number }>(
      '/receipts',
      { params }
    );
    return response.data;
  },

  getReceipt: async (id: string): Promise<Receipt> => {
    const response = await apiClient.get<Receipt>(`/receipts/${id}`);
    return response.data;
  },

  confirmReceipt: async (
    id: string,
    transactionData: {
      type: 'income' | 'expense';
      category: string;
      amount: number;
      description: string;
      transactionDate: string;
    }
  ): Promise<{ receipt: Receipt; transaction: any }> => {
    const response = await apiClient.post(`/receipts/${id}/confirm`, transactionData);
    return response.data;
  },

  rejectReceipt: async (id: string): Promise<Receipt> => {
    const response = await apiClient.post<Receipt>(`/receipts/${id}/reject`);
    return response.data;
  },
};
