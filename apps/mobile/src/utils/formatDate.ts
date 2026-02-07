import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';

export const formatDate = (date: string | Date, formatStr = 'yyyy년 MM월 dd일'): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatStr, { locale: ko });
};

export const formatDateTime = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'yyyy년 MM월 dd일 HH:mm', { locale: ko });
};

export const formatShortDate = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'MM/dd', { locale: ko });
};

export const formatMonthYear = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'yyyy년 MM월', { locale: ko });
};

export const toISODate = (date: Date): string => {
  return format(date, 'yyyy-MM-dd');
};
