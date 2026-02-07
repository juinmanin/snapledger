export const formatCurrency = (
  amount: number,
  locale: string,
  currency: string = 'KRW'
): string => {
  const currencyMap: Record<string, { symbol: string; code: string }> = {
    ko: { symbol: '₩', code: 'KRW' },
    en: { symbol: '$', code: 'USD' },
    ms: { symbol: 'RM', code: 'MYR' },
    zh: { symbol: '¥', code: 'CNY' },
  };

  const { symbol } = currencyMap[locale] || currencyMap.ko;
  
  const formattedAmount = Math.abs(amount).toLocaleString(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  return `${symbol}${formattedAmount}`;
};

export const formatCurrencyWithSign = (
  amount: number,
  locale: string,
  type: 'income' | 'expense'
): string => {
  const sign = type === 'income' ? '+' : '-';
  return `${sign}${formatCurrency(Math.abs(amount), locale)}`;
};
