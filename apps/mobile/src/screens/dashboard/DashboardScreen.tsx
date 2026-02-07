import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, FAB, Chip, Divider } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { useTransactionSummary, useTransactions } from '../../hooks/useTransactions';
import { useBudgets } from '../../hooks/useBudget';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import { ExpensePieChart } from '../../components/chart/ExpensePieChart';
import { BudgetProgressBar } from '../../components/chart/BudgetProgressBar';
import { CategoryIcon } from '../../components/common/CategoryIcon';
import { EmptyState } from '../../components/common/EmptyState';

const DashboardScreen = () => {
  const navigation = useNavigation();
  const currentDate = new Date();
  const startDate = format(startOfMonth(currentDate), 'yyyy-MM-dd');
  const endDate = format(endOfMonth(currentDate), 'yyyy-MM-dd');

  const { data: summary, isLoading: summaryLoading, refetch: refetchSummary } = useTransactionSummary({
    startDate,
    endDate,
  });

  const { data: recentTransactions, isLoading: transactionsLoading, refetch: refetchTransactions } = useTransactions({
    limit: 5,
    page: 1,
  });

  const { data: budgets, isLoading: budgetsLoading, refetch: refetchBudgets } = useBudgets({
    active: true,
  });

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchSummary(), refetchTransactions(), refetchBudgets()]);
    setRefreshing(false);
  }, []);

  const chartData = useMemo(() => {
    if (!summary?.categoryBreakdown) return [];
    return summary.categoryBreakdown
      .filter((item) => item.total > 0)
      .map((item) => ({
        category: item.category,
        amount: item.total,
      }));
  }, [summary]);

  const isLoading = summaryLoading || transactionsLoading || budgetsLoading;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.title}>
            대시보드
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            {format(currentDate, 'yyyy년 MM월')}
          </Text>
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <Card style={[styles.summaryCard, styles.incomeCard]} mode="elevated">
            <Card.Content>
              <Text variant="labelMedium" style={styles.summaryLabel}>
                수입
              </Text>
              <Text variant="headlineSmall" style={styles.incomeAmount}>
                {formatCurrency(summary?.totalIncome || 0)}
              </Text>
            </Card.Content>
          </Card>

          <Card style={[styles.summaryCard, styles.expenseCard]} mode="elevated">
            <Card.Content>
              <Text variant="labelMedium" style={styles.summaryLabel}>
                지출
              </Text>
              <Text variant="headlineSmall" style={styles.expenseAmount}>
                {formatCurrency(summary?.totalExpense || 0)}
              </Text>
            </Card.Content>
          </Card>
        </View>

        <Card style={styles.netCard} mode="elevated">
          <Card.Content>
            <Text variant="labelMedium" style={styles.summaryLabel}>
              순수입
            </Text>
            <Text
              variant="headlineMedium"
              style={[
                styles.netAmount,
                (summary?.netAmount || 0) < 0 && styles.negativeAmount,
              ]}
            >
              {formatCurrency(summary?.netAmount || 0)}
            </Text>
          </Card.Content>
        </Card>

        {/* Category Breakdown */}
        {chartData.length > 0 && (
          <Card style={styles.card} mode="elevated">
            <Card.Content>
              <Text variant="titleMedium" style={styles.cardTitle}>
                카테고리별 지출
              </Text>
              <ExpensePieChart data={chartData} />
            </Card.Content>
          </Card>
        )}

        {/* Budget Progress */}
        {budgets && budgets.length > 0 && (
          <Card style={styles.card} mode="elevated">
            <Card.Content>
              <Text variant="titleMedium" style={styles.cardTitle}>
                예산 현황
              </Text>
              {budgets.slice(0, 3).map((budget) => (
                <BudgetProgressBar
                  key={budget.id}
                  category={budget.category}
                  budget={budget.amount}
                  spent={budget.spent}
                />
              ))}
              {budgets.length > 3 && (
                <Chip
                  icon="arrow-right"
                  onPress={() => navigation.navigate('SettingsTab' as never)}
                  style={styles.moreChip}
                >
                  더 보기
                </Chip>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Recent Transactions */}
        <Card style={styles.card} mode="elevated">
          <Card.Content>
            <View style={styles.cardHeader}>
              <Text variant="titleMedium" style={styles.cardTitle}>
                최근 거래
              </Text>
              <Chip
                icon="arrow-right"
                onPress={() => navigation.navigate('TransactionsTab' as never)}
                compact
              >
                전체보기
              </Chip>
            </View>

            {recentTransactions?.data && recentTransactions.data.length > 0 ? (
              recentTransactions.data.map((transaction, index) => (
                <View key={transaction.id}>
                  {index > 0 && <Divider style={styles.divider} />}
                  <View style={styles.transactionItem}>
                    <CategoryIcon category={transaction.category} size={20} />
                    <View style={styles.transactionInfo}>
                      <Text variant="bodyMedium" style={styles.transactionDescription}>
                        {transaction.description}
                      </Text>
                      <Text variant="bodySmall" style={styles.transactionDate}>
                        {formatDate(transaction.transactionDate, 'MM월 dd일')}
                      </Text>
                    </View>
                    <Text
                      variant="bodyLarge"
                      style={[
                        styles.transactionAmount,
                        transaction.type === 'income'
                          ? styles.incomeText
                          : styles.expenseText,
                      ]}
                    >
                      {transaction.type === 'income' ? '+' : '-'}
                      {formatCurrency(transaction.amount)}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <EmptyState
                icon="receipt-text-outline"
                message="거래 내역이 없습니다"
                description="영수증을 스캔하거나 수동으로 거래를 추가해보세요"
              />
            )}
          </Card.Content>
        </Card>
      </ScrollView>

      <FAB
        icon="camera"
        label="스캔"
        style={styles.fab}
        onPress={() => navigation.navigate('ScanTab' as never)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingTop: 60,
  },
  title: {
    fontWeight: 'bold',
    color: '#1C1B1F',
  },
  subtitle: {
    color: '#49454F',
    marginTop: 4,
  },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
  },
  incomeCard: {
    backgroundColor: '#E8F5E9',
  },
  expenseCard: {
    backgroundColor: '#FFEBEE',
  },
  summaryLabel: {
    color: '#49454F',
    marginBottom: 4,
  },
  incomeAmount: {
    color: '#2E7D32',
    fontWeight: 'bold',
  },
  expenseAmount: {
    color: '#D32F2F',
    fontWeight: 'bold',
  },
  netCard: {
    marginHorizontal: 16,
    marginTop: 12,
  },
  netAmount: {
    color: '#2E7D32',
    fontWeight: 'bold',
  },
  negativeAmount: {
    color: '#D32F2F',
  },
  card: {
    margin: 16,
    marginTop: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontWeight: '600',
  },
  moreChip: {
    alignSelf: 'flex-start',
    marginTop: 12,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontWeight: '500',
    marginBottom: 4,
  },
  transactionDate: {
    color: '#79747E',
  },
  transactionAmount: {
    fontWeight: '600',
  },
  incomeText: {
    color: '#2E7D32',
  },
  expenseText: {
    color: '#D32F2F',
  },
  divider: {
    marginVertical: 8,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: '#2E7D32',
  },
});

export default DashboardScreen;
