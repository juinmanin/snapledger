import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          await AsyncStorage.removeItem('authToken');
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth
  async login(email: string, password: string) {
    const response = await this.client.post('/api/v1/auth/login', { email, password });
    return response.data;
  }

  async register(name: string, email: string, password: string) {
    const response = await this.client.post('/api/v1/auth/register', { name, email, password });
    return response.data;
  }

  async loginWithGoogle(token: string) {
    const response = await this.client.post('/api/v1/auth/google', { token });
    return response.data;
  }

  async loginWithApple(token: string) {
    const response = await this.client.post('/api/v1/auth/apple', { token });
    return response.data;
  }

  async loginWithKakao(token: string) {
    const response = await this.client.post('/api/v1/auth/kakao', { token });
    return response.data;
  }

  async logout() {
    await this.client.post('/api/v1/auth/logout');
    await AsyncStorage.removeItem('authToken');
  }

  async getProfile() {
    const response = await this.client.get('/api/v1/auth/profile');
    return response.data;
  }

  async updateProfile(data: any) {
    const response = await this.client.put('/api/v1/auth/profile', data);
    return response.data;
  }

  // Transactions
  async getTransactions(params?: any) {
    const response = await this.client.get('/api/v1/transactions', { params });
    return response.data;
  }

  async getTransaction(id: string) {
    const response = await this.client.get(`/api/v1/transactions/${id}`);
    return response.data;
  }

  async createTransaction(data: any) {
    const response = await this.client.post('/api/v1/transactions', data);
    return response.data;
  }

  async updateTransaction(id: string, data: any) {
    const response = await this.client.put(`/api/v1/transactions/${id}`, data);
    return response.data;
  }

  async deleteTransaction(id: string) {
    const response = await this.client.delete(`/api/v1/transactions/${id}`);
    return response.data;
  }

  // Receipts
  async uploadReceipt(file: any, onUploadProgress?: (progress: number) => void) {
    const formData = new FormData();
    formData.append('receipt', file);

    const response = await this.client.post('/api/v1/receipts/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onUploadProgress?.(percentCompleted);
        }
      },
    });
    return response.data;
  }

  // Budgets
  async getBudgets() {
    const response = await this.client.get('/api/v1/budgets');
    return response.data;
  }

  async getBudget(id: string) {
    const response = await this.client.get(`/api/v1/budgets/${id}`);
    return response.data;
  }

  async createBudget(data: any) {
    const response = await this.client.post('/api/v1/budgets', data);
    return response.data;
  }

  async updateBudget(id: string, data: any) {
    const response = await this.client.put(`/api/v1/budgets/${id}`, data);
    return response.data;
  }

  async deleteBudget(id: string) {
    const response = await this.client.delete(`/api/v1/budgets/${id}`);
    return response.data;
  }

  // Reports
  async getMonthlyStats(year: number, month: number) {
    const response = await this.client.get('/api/v1/reports/monthly', { params: { year, month } });
    return response.data;
  }

  async getCategoryStats(startDate: string, endDate: string) {
    const response = await this.client.get('/api/v1/reports/category', {
      params: { startDate, endDate },
    });
    return response.data;
  }

  async exportToGoogleSheets(startDate: string, endDate: string) {
    const response = await this.client.post('/api/v1/reports/export/google-sheets', {
      startDate,
      endDate,
    });
    return response.data;
  }

  // Backup
  async backupToGoogleDrive() {
    const response = await this.client.post('/api/v1/backup/google-drive');
    return response.data;
  }

  async getBackupList() {
    const response = await this.client.get('/api/v1/backup/google-drive/list');
    return response.data;
  }

  async restoreFromGoogleDrive(backupId: string) {
    const response = await this.client.post('/api/v1/backup/google-drive/restore', { backupId });
    return response.data;
  }
}

export default new ApiService();
