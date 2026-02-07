export interface User {
  id: string;
  email: string;
  name: string;
  mode: 'personal' | 'business';
  language: 'ko' | 'en' | 'ms' | 'zh';
  currency: 'KRW' | 'USD' | 'MYR' | 'CNY';
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  merchant?: string;
  description?: string;
  date: string;
  receiptUrl?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  id: string;
  category: string;
  limit: number;
  spent: number;
  period: 'daily' | 'weekly' | 'monthly';
  userId: string;
  alertAt80: boolean;
  alertAt100: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MonthlyStats {
  income: number;
  expense: number;
  balance: number;
}

export interface CategoryStats {
  category: string;
  amount: number;
  percentage: number;
}

export interface BackupInfo {
  id: string;
  timestamp: string;
  size: number;
}

export interface OcrResult {
  merchant?: string;
  amount?: number;
  date?: string;
  category?: string;
  confidence?: number;
}
