import apiClient, { setAuthToken, setRefreshToken, clearTokens } from './client';
import {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  RefreshTokenResponse,
} from './types';

export const authApi = {
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
    const { accessToken, refreshToken } = response.data;
    await setAuthToken(accessToken);
    await setRefreshToken(refreshToken);
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);
    const { accessToken, refreshToken } = response.data;
    await setAuthToken(accessToken);
    await setRefreshToken(refreshToken);
    return response.data;
  },

  refresh: async (refreshToken: string): Promise<RefreshTokenResponse> => {
    const response = await apiClient.post<RefreshTokenResponse>('/auth/refresh', {
      refreshToken,
    });
    await setAuthToken(response.data.accessToken);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await clearTokens();
  },
};
