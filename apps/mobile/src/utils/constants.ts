export const API_URL = __DEV__
  ? 'http://localhost:3000/api'
  : 'https://api.snapledger.app/api';

export const CATEGORIES = {
  expense: ['식비', '교통', '쇼핑', '의료', '주거', '문화', '교육', '기타'],
  income: ['급여', '부수입', '사업소득', '기타'],
};

export const COLORS = {
  primary: '#2E7D32',
  secondary: '#66BB6A',
  error: '#D32F2F',
  warning: '#F57C00',
  info: '#1976D2',
  success: '#388E3C',
  background: '#FAFAFA',
  surface: '#FFFFFF',
  text: '#1C1B1F',
  textSecondary: '#49454F',
  border: '#CAC4D0',
  disabled: '#79747E',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

export const FONT_SIZES = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 24,
  xxl: 32,
};
