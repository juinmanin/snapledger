import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { TransactionCard } from '../components/TransactionCard';
import { BudgetProgressBar } from '../components/BudgetProgressBar';
import { formatCurrency } from '../utils/formatCurrency';
import { Transaction, Budget, MonthlyStats } from '../types';
import apiService from '../services/api';

export const DashboardScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<MonthlyStats>({ income: 0, expense: 0, balance: 0 });
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const now = new Date();
      const [statsData, transactionsData, budgetsData] = await Promise.all([
        apiService.getMonthlyStats(now.getFullYear(), now.getMonth() + 1),
        apiService.getTransactions({ limit: 5 }),
        apiService.getBudgets(),
      ]);

      setStats(statsData);
      setRecentTransactions(transactionsData.transactions || []);
      setBudgets(budgetsData.budgets || []);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>{t('dashboard.welcomeBack')}</Text>
        <Text style={styles.userName}>{user?.name}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('dashboard.monthlyOverview')}</Text>
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, styles.incomeCard]}>
            <Text style={styles.statLabel}>{t('dashboard.income')}</Text>
            <Text style={styles.statValue}>
              {formatCurrency(stats.income, i18n.language)}
            </Text>
          </View>
          <View style={[styles.statCard, styles.expenseCard]}>
            <Text style={styles.statLabel}>{t('dashboard.expense')}</Text>
            <Text style={styles.statValue}>
              {formatCurrency(stats.expense, i18n.language)}
            </Text>
          </View>
          <View style={[styles.statCard, styles.balanceCard]}>
            <Text style={styles.statLabel}>{t('dashboard.balance')}</Text>
            <Text style={styles.statValue}>
              {formatCurrency(stats.balance, i18n.language)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('dashboard.quickActions')}</Text>
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('ScanReceipt')}
          >
            <Text style={styles.actionEmoji}>📸</Text>
            <Text style={styles.actionText}>{t('dashboard.scanReceipt')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Transactions')}
          >
            <Text style={styles.actionEmoji}>➕</Text>
            <Text style={styles.actionText}>{t('dashboard.addTransaction')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Reports')}
          >
            <Text style={styles.actionEmoji}>📊</Text>
            <Text style={styles.actionText}>{t('dashboard.viewReports')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('dashboard.budgetStatus')}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Budget')}>
            <Text style={styles.viewAllText}>{t('dashboard.viewAll')}</Text>
          </TouchableOpacity>
        </View>
        {budgets.length > 0 ? (
          budgets.slice(0, 2).map((budget) => (
            <BudgetProgressBar key={budget.id} budget={budget} />
          ))
        ) : (
          <Text style={styles.emptyText}>{t('budget.noBudgets')}</Text>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('dashboard.recentTransactions')}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Transactions')}>
            <Text style={styles.viewAllText}>{t('dashboard.viewAll')}</Text>
          </TouchableOpacity>
        </View>
        {recentTransactions.length > 0 ? (
          recentTransactions.map((transaction) => (
            <TransactionCard
              key={transaction.id}
              transaction={transaction}
              onPress={() =>
                navigation.navigate('TransactionDetail', { id: transaction.id })
              }
            />
          ))
        ) : (
          <Text style={styles.emptyText}>{t('dashboard.noTransactions')}</Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 24,
    backgroundColor: '#2196F3',
  },
  greeting: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 4,
  },
  section: {
    marginTop: 16,
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  viewAllText: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '600',
  },
  statsContainer: {
    paddingHorizontal: 16,
  },
  statCard: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
  },
  incomeCard: {
    backgroundColor: '#4CAF50',
  },
  expenseCard: {
    backgroundColor: '#F44336',
  },
  balanceCard: {
    backgroundColor: '#2196F3',
  },
  statLabel: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
  },
  actionButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    marginVertical: 24,
  },
});
