import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, ProgressBar } from 'react-native-paper';
import { formatCurrency } from '../../utils/formatCurrency';
import { CategoryIcon } from '../common/CategoryIcon';

interface BudgetProgressBarProps {
  category: string;
  budget: number;
  spent: number;
}

export const BudgetProgressBar: React.FC<BudgetProgressBarProps> = ({
  category,
  budget,
  spent,
}) => {
  const progress = Math.min(spent / budget, 1);
  const remaining = budget - spent;
  const isOverBudget = spent > budget;

  const getProgressColor = () => {
    if (isOverBudget) return '#D32F2F';
    if (progress > 0.8) return '#F57C00';
    return '#2E7D32';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.categoryInfo}>
          <CategoryIcon category={category} size={20} />
          <Text variant="titleMedium" style={styles.category}>
            {category}
          </Text>
        </View>
        <Text
          variant="bodyMedium"
          style={[styles.percentage, isOverBudget && styles.overBudget]}
        >
          {(progress * 100).toFixed(0)}%
        </Text>
      </View>

      <ProgressBar
        progress={progress}
        color={getProgressColor()}
        style={styles.progressBar}
      />

      <View style={styles.footer}>
        <Text variant="bodySmall" style={styles.amount}>
          {formatCurrency(spent)} / {formatCurrency(budget)}
        </Text>
        <Text
          variant="bodySmall"
          style={[
            styles.remaining,
            isOverBudget ? styles.overBudgetText : styles.remainingText,
          ]}
        >
          {isOverBudget
            ? `${formatCurrency(Math.abs(remaining))} 초과`
            : `${formatCurrency(remaining)} 남음`}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  category: {
    fontWeight: '600',
  },
  percentage: {
    fontWeight: '600',
    color: '#2E7D32',
  },
  overBudget: {
    color: '#D32F2F',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  amount: {
    color: '#49454F',
  },
  remaining: {
    fontWeight: '500',
  },
  remainingText: {
    color: '#2E7D32',
  },
  overBudgetText: {
    color: '#D32F2F',
  },
});
