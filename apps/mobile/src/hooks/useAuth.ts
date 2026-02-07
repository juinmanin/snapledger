import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/auth.api';
import { useUserStore } from '../stores/userStore';
import { useUIStore } from '../stores/uiStore';
import { LoginRequest, RegisterRequest } from '../api/types';

export const useAuth = () => {
  const queryClient = useQueryClient();
  const setUser = useUserStore((state) => state.setUser);
  const logout = useUserStore((state) => state.logout);
  const showToast = useUIStore((state) => state.showToast);

  const loginMutation = useMutation({
    mutationFn: (credentials: LoginRequest) => authApi.login(credentials),
    onSuccess: (data) => {
      setUser(data.user);
      queryClient.invalidateQueries();
      showToast('로그인 성공', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || '로그인 실패', 'error');
    },
  });

  const registerMutation = useMutation({
    mutationFn: (data: RegisterRequest) => authApi.register(data),
    onSuccess: (data) => {
      setUser(data.user);
      queryClient.invalidateQueries();
      showToast('회원가입 성공', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || '회원가입 실패', 'error');
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      logout();
      queryClient.clear();
      showToast('로그아웃 되었습니다', 'info');
    },
  });

  return {
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout: logoutMutation.mutate,
    isLoginLoading: loginMutation.isPending,
    isRegisterLoading: registerMutation.isPending,
  };
};
