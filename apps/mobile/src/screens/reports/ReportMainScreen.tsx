import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, SegmentedButtons, Button } from 'react-native-paper';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { useIncomeExpenseReport, useCategoryReport } from '../../hooks/useReports';
import { formatCurrency } from '../../utils/formatCurrency';
import { TrendLineChart } from '../../components/chart/TrendLineChart';
import { ExpensePieChart } from '../../components/chart/ExpensePieChart';
import { CategoryIcon } from '../../components/common/CategoryIcon';

type Period = 'this-month' | 'last-month' | 'last-3-months';

const ReportMainScreen = () => {
  const [period, setPeriod] = useState<Period>('this-month');

  const getDateRange = () => {
    const now = new Date();
    switch (period) {
      case 'this-month':
        return {
          startDate: format(startOfMonth(now), 'yyyy-MM-dd'),
          endDate: format(endOfMonth(now), 'yyyy-MM-dd'),
        };
      case 'last-month':
        const lastMonth = subMonths(now, 1);
        return {
          startDate: format(startOfMonth(lastMonth), 'yyyy-MM-dd'),
          endDate: format(endOfMonth(lastMonth), 'yyyy-MM-dd'),
        };
      case 'last-3-months':
        return {
          startDate: format(subMonths(now, 3), 'yyyy-MM-dd'),
          endDate: format(now, 'yyyy-MM-dd'),
        };
    }
  };

  const dateRange = getDateRange();

  const { data: incomeExpenseData, isLoading: incomeExpenseLoading } =
    useIncomeExpenseReport({
      ...dateRange,
      groupBy: 'day',
    });

  const { data: categoryData, isLoading: categoryLoading } = useCategoryReport({
    ...dateRange,
    type: 'expense',
  });

  const isLoading = incomeExpenseLoading || categoryLoading;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>
          리포트
        </Text>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.periodContainer}>
          <SegmentedButtons
            value={period}
            onValueChange={(value) => setPeriod(value as Period)}
            buttons={[
              { value: 'this-month', label: '이번달' },
              { value: 'last-month', label: '지난달' },
              { value: 'last-3-months', label: '3개월' },
            ]}
          />
        </View>

        {/* Summary Card */}
        <Card style={styles.card} mode="elevated">
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              요약
            </Text>

            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text variant="bodyMedium" style={styles.summaryLabel}>
                  총 수입
                </Text>
                <Text variant="headlineSmall" style={styles.incomeAmount}>
                  {formatCurrency(incomeExpenseData?.income || 0)}
                </Text>
              </View>

              <View style={styles.summaryItem}>
                <Text variant="bodyMedium" style={styles.summaryLabel}>
                  총 지출
                </Text>
                <Text variant="headlineSmall" style={styles.expenseAmount}>
                  {formatCurrency(incomeExpenseData?.expense || 0)}
                </Text>
              </View>
            </View>

            <View style={styles.netContainer}>
              <Text variant="bodyMedium" style={styles.summaryLabel}>
                순수입
              </Text>
              <Text
                variant="headlineMedium"
                style={[
                  styles.netAmount,
                  (incomeExpenseData?.net || 0) < 0 && styles.negativeAmount,
                ]}
              >
                {formatCurrency(incomeExpenseData?.net || 0)}
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Trend Chart */}
        <Card style={styles.card} mode="elevated">
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              수입/지출 추이
            </Text>
            {incomeExpenseData?.data && incomeExpenseData.data.length > 0 ? (
              <TrendLineChart data={incomeExpenseData.data} />
            ) : (
              <View style={styles.emptyChart}>
                <Text variant="bodyMedium" style={styles.emptyText}>
                  데이터가 없습니다
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Category Breakdown */}
        <Card style={styles.card} mode="elevated">
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              카테고리별 지출
            </Text>
            {categoryData && categoryData.length > 0 ? (
              <>
                <ExpensePieChart
                  data={categoryData.map((item) => ({
                    category: item.category,
                    amount: item.amount,
                  }))}
                />

                <View style={styles.categoryList}>
                  {categoryData.map((item) => (
                    <View key={item.category} style={styles.categoryItem}>
                      <CategoryIcon category={item.category} size={20} />
                      <View style={styles.categoryInfo}>
                        <Text variant="bodyMedium" style={styles.categoryName}>
                          {item.category}
                        </Text>
                        <Text variant="bodySmall" style={styles.categoryCount}>
                          {item.count}건
                        </Text>
                      </View>
                      <View style={styles.categoryAmountContainer}>
                        <Text variant="bodyLarge" style={styles.categoryAmount}>
                          {formatCurrency(item.amount)}
                        </Text>
                        <Text variant="bodySmall" style={styles.categoryPercentage}>
                          {item.percentage.toFixed(1)}%
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </>
            ) : (
              <View style={styles.emptyChart}>
                <Text variant="bodyMedium" style={styles.emptyText}>
                  데이터가 없습니다
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 16,
  },
  title: {
    fontWeight: 'bold',
    color: '#1C1B1F',
  },
  scrollView: {
    flex: 1,
  },
  periodContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  card: {
    margin: 16,
    marginTop: 0,
  },
  cardTitle: {
    fontWeight: '600',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  summaryItem: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
  },
  summaryLabel: {
    color: '#49454F',
    marginBottom: 8,
  },
  incomeAmount: {
    color: '#2E7D32',
    fontWeight: 'bold',
  },
  expenseAmount: {
    color: '#D32F2F',
    fontWeight: 'bold',
  },
  netContainer: {
    padding: 16,
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    alignItems: 'center',
  },
  netAmount: {
    color: '#2E7D32',
    fontWeight: 'bold',
  },
  negativeAmount: {
    color: '#D32F2F',
  },
  emptyChart: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#79747E',
  },
  categoryList: {
    marginTop: 16,
    gap: 12,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontWeight: '500',
    marginBottom: 4,
  },
  categoryCount: {
    color: '#79747E',
  },
  categoryAmountContainer: {
    alignItems: 'flex-end',
  },
  categoryAmount: {
    fontWeight: '600',
    color: '#1C1B1F',
    marginBottom: 4,
  },
  categoryPercentage: {
    color: '#79747E',
  },
});

export default ReportMainScreen;
