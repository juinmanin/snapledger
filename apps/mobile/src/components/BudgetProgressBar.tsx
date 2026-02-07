import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Budget } from '../types';
import { formatCurrency } from '../utils/formatCurrency';

interface BudgetProgressBarProps {
  budget: Budget;
}

export const BudgetProgressBar: React.FC<BudgetProgressBarProps> = ({ budget }) => {
  const { t, i18n } = useTranslation();

  const percentage = Math.min((budget.spent / budget.limit) * 100, 100);
  const remaining = Math.max(budget.limit - budget.spent, 0);
  const categoryLabel = t(`categories.${budget.category}`, budget.category);

  let statusColor = '#4CAF50';
  let statusLabel = t('budget.onTrack');

  if (percentage >= 100) {
    statusColor = '#F44336';
    statusLabel = t('budget.overBudget');
  } else if (percentage >= 80) {
    statusColor = '#FF9800';
    statusLabel = t('budget.nearLimit');
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.category}>{categoryLabel}</Text>
          <Text style={[styles.status, { color: statusColor }]}>
            {statusLabel}
          </Text>
        </View>
        <Text style={styles.percentage}>{percentage.toFixed(0)}%</Text>
      </View>

      <View style={styles.progressBarContainer}>
        <View
          style={[
            styles.progressBar,
            { width: `${percentage}%`, backgroundColor: statusColor },
          ]}
        />
      </View>

      <View style={styles.amounts}>
        <Text style={styles.amountText}>
          {t('budget.spent')}: {formatCurrency(budget.spent, i18n.language)}
        </Text>
        <Text style={styles.amountText}>
          {t('budget.remaining')}: {formatCurrency(remaining, i18n.language)}
        </Text>
      </View>

      <Text style={styles.limit}>
        {t('budget.limit')}: {formatCurrency(budget.limit, i18n.language)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  category: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  status: {
    fontSize: 14,
    fontWeight: '600',
  },
  percentage: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  amounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  amountText: {
    fontSize: 14,
    color: '#666',
  },
  limit: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});
