import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Transaction } from '../types';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDateTime } from '../utils/formatDate';
import { CategoryIcon } from '../components/CategoryIcon';
import apiService from '../services/api';

export const TransactionDetailScreen: React.FC<{ route: any; navigation: any }> = ({
  route,
  navigation,
}) => {
  const { t, i18n } = useTranslation();
  const { id } = route.params;
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTransaction();
  }, [id]);

  const loadTransaction = async () => {
    try {
      const data = await apiService.getTransaction(id);
      setTransaction(data);
    } catch (error) {
      console.error('Failed to load transaction:', error);
      Alert.alert(t('common.error'), t('common.error'));
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      t('transactions.deleteTransaction'),
      t('transactions.deleteConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.deleteTransaction(id);
              navigation.goBack();
            } catch (error) {
              Alert.alert(t('common.error'), t('common.error'));
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  if (!transaction) {
    return null;
  }

  const categoryLabel = t(`categories.${transaction.category}`, transaction.category);
  const typeColor = transaction.type === 'income' ? '#4CAF50' : '#F44336';
  const amountPrefix = transaction.type === 'income' ? '+' : '-';

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <CategoryIcon category={transaction.category} size={80} />
        <Text style={[styles.amount, { color: typeColor }]}>
          {amountPrefix}
          {formatCurrency(transaction.amount, i18n.language)}
        </Text>
        <Text style={styles.category}>{categoryLabel}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('transactions.title')}</Text>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>{t('transactions.type')}</Text>
          <Text style={[styles.detailValue, { color: typeColor }]}>
            {t(`transactions.${transaction.type}`)}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>{t('transactions.merchant')}</Text>
          <Text style={styles.detailValue}>{transaction.merchant || '-'}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>{t('transactions.date')}</Text>
          <Text style={styles.detailValue}>
            {formatDateTime(transaction.date, i18n.language)}
          </Text>
        </View>

        {transaction.description && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('transactions.description')}</Text>
            <Text style={styles.detailValue}>{transaction.description}</Text>
          </View>
        )}
      </View>

      {transaction.receiptUrl && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('transactions.receipt')}</Text>
          <Image
            source={{ uri: transaction.receiptUrl }}
            style={styles.receiptImage}
            resizeMode="contain"
          />
        </View>
      )}

      <View style={styles.actions}>
        <TouchableOpacity style={styles.editButton} onPress={() => {}}>
          <Text style={styles.editButtonText}>{t('common.edit')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteButtonText}>{t('common.delete')}</Text>
        </TouchableOpacity>
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
    backgroundColor: '#fff',
    padding: 32,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  amount: {
    fontSize: 36,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  category: {
    fontSize: 18,
    color: '#666',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  detailLabel: {
    fontSize: 16,
    color: '#666',
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  receiptImage: {
    width: '100%',
    height: 300,
    borderRadius: 8,
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    marginTop: 16,
  },
  editButton: {
    flex: 1,
    backgroundColor: '#2196F3',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginRight: 8,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#F44336',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginLeft: 8,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
