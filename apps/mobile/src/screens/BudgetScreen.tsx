import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { BudgetProgressBar } from '../components/BudgetProgressBar';
import { Budget } from '../types';
import apiService from '../services/api';

export const BudgetScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { t } = useTranslation();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadBudgets();
  }, []);

  const loadBudgets = async () => {
    try {
      const response = await apiService.getBudgets();
      setBudgets(response.budgets || []);
      checkBudgetAlerts(response.budgets || []);
    } catch (error) {
      console.error('Failed to load budgets:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const checkBudgetAlerts = (budgetList: Budget[]) => {
    budgetList.forEach((budget) => {
      const percentage = (budget.spent / budget.limit) * 100;
      const categoryLabel = t(`categories.${budget.category}`, budget.category);

      if (percentage >= 100 && budget.alertAt100) {
        Alert.alert(
          t('budget.alert'),
          t('budget.budgetExceeded') + ': ' + categoryLabel
        );
      } else if (percentage >= 80 && percentage < 100 && budget.alertAt80) {
        Alert.alert(
          t('budget.alert'),
          t('budget.budgetNearLimit', { percent: percentage.toFixed(0) }) +
            ' - ' +
            categoryLabel
        );
      }
    });
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadBudgets();
  };

  const handleAddBudget = () => {
    // Navigate to add budget screen (to be implemented)
    Alert.alert(t('common.confirm'), t('budget.addBudget'));
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {budgets.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>{t('budget.noBudgets')}</Text>
          <Text style={styles.emptyText}>{t('budget.createFirst')}</Text>
          <TouchableOpacity style={styles.addButton} onPress={handleAddBudget}>
            <Text style={styles.addButtonText}>{t('budget.addBudget')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ScrollView
            style={styles.scrollView}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          >
            <View style={styles.header}>
              <Text style={styles.headerTitle}>{t('budget.title')}</Text>
              <Text style={styles.headerSubtitle}>
                {budgets.length} {t('budget.period')}
              </Text>
            </View>

            {budgets.map((budget) => (
              <BudgetProgressBar key={budget.id} budget={budget} />
            ))}

            <View style={styles.spacer} />
          </ScrollView>

          <TouchableOpacity style={styles.fab} onPress={handleAddBudget}>
            <Text style={styles.fabText}>+</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
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
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#fff',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginBottom: 32,
  },
  addButton: {
    backgroundColor: '#2196F3',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  spacer: {
    height: 80,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  fabText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '300',
  },
});
