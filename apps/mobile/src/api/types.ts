export interface User {
  id: string;
  email: string;
  name: string;
  userMode: 'personal' | 'business';
  activeBusinessId?: string;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  userMode: 'personal' | 'business';
  businessName?: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
}

export interface Receipt {
  id: string;
  userId: string;
  businessId?: string;
  imageUrl: string;
  ocrText: string;
  merchantName?: string;
  transactionDate?: string;
  totalAmount?: number;
  aiClassification?: string;
  confidence?: number;
  status: 'pending' | 'confirmed' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface ScanReceiptResponse {
  receipt: Receipt;
  suggestedTransaction?: {
    description: string;
    amount: number;
    category: string;
    transactionDate: string;
  };
}

export interface Transaction {
  id: string;
  userId: string;
  businessId?: string;
  receiptId?: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  transactionDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionSummary {
  totalIncome: number;
  totalExpense: number;
  netAmount: number;
  transactionCount: number;
  categoryBreakdown: {
    category: string;
    total: number;
    count: number;
  }[];
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface IncomeExpenseReport {
  period: string;
  income: number;
  expense: number;
  net: number;
  data: {
    date: string;
    income: number;
    expense: number;
  }[];
}

export interface CategoryReport {
  category: string;
  amount: number;
  count: number;
  percentage: number;
}

export interface Budget {
  id: string;
  userId: string;
  businessId?: string;
  category: string;
  amount: number;
  period: 'monthly' | 'yearly';
  startDate: string;
  endDate?: string;
  spent: number;
  remaining: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBudgetRequest {
  category: string;
  amount: number;
  period: 'monthly' | 'yearly';
  startDate: string;
}

export interface UpdateBudgetRequest {
  amount?: number;
  endDate?: string;
}

export interface CreateTransactionRequest {
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  transactionDate: string;
  receiptId?: string;
}

export interface UpdateTransactionRequest {
  type?: 'income' | 'expense';
  category?: string;
  amount?: number;
  description?: string;
  transactionDate?: string;
}

export interface ErrorResponse {
  message: string;
  statusCode: number;
  error?: string;
}
