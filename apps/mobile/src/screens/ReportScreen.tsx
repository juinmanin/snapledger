import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '../utils/formatCurrency';
import { CategoryStats } from '../types';
import apiService from '../services/api';

export const ReportScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [period, setPeriod] = useState<'thisMonth' | 'lastMonth' | 'last3Months'>('thisMonth');
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [stats, setStats] = useState<{
    totalIncome: number;
    totalExpense: number;
    netIncome: number;
  }>({
    totalIncome: 0,
    totalExpense: 0,
    netIncome: 0,
  });
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);

  React.useEffect(() => {
    loadReportData();
  }, [period]);

  const loadReportData = async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = getPeriodDates();
      const data = await apiService.getCategoryStats(startDate, endDate);

      setStats({
        totalIncome: data.totalIncome || 0,
        totalExpense: data.totalExpense || 0,
        netIncome: (data.totalIncome || 0) - (data.totalExpense || 0),
      });
      setCategoryStats(data.categories || []);
    } catch (error) {
      console.error('Failed to load report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPeriodDates = () => {
    const now = new Date();
    let startDate: Date;
    let endDate = new Date();

    switch (period) {
      case 'thisMonth':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'lastMonth':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'last3Months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    };
  };

  const handleExportToSheets = async () => {
    Alert.alert(
      t('reports.exportToSheets'),
      t('common.confirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          onPress: async () => {
            setExporting(true);
            try {
              const { startDate, endDate } = getPeriodDates();
              await apiService.exportToGoogleSheets(startDate, endDate);
              Alert.alert(t('common.confirm'), t('reports.exportSuccess'));
            } catch (error: any) {
              Alert.alert(
                t('common.error'),
                error.message || t('reports.exportFailed')
              );
            } finally {
              setExporting(false);
            }
          },
        },
      ]
    );
  };

  const renderPeriodButton = (
    periodType: 'thisMonth' | 'lastMonth' | 'last3Months',
    label: string
  ) => (
    <TouchableOpacity
      style={[styles.periodButton, period === periodType && styles.activePeriodButton]}
      onPress={() => setPeriod(periodType)}
    >
      <Text
        style={[
          styles.periodButtonText,
          period === periodType && styles.activePeriodButtonText,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.periodSelector}>
        <Text style={styles.periodTitle}>{t('reports.selectPeriod')}</Text>
        <View style={styles.periodButtons}>
          {renderPeriodButton('thisMonth', t('reports.thisMonth'))}
          {renderPeriodButton('lastMonth', t('reports.lastMonth'))}
          {renderPeriodButton('last3Months', t('reports.last3Months'))}
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
        </View>
      ) : (
        <ScrollView style={styles.scrollView}>
          <View style={styles.summaryContainer}>
            <View style={[styles.summaryCard, styles.incomeCard]}>
              <Text style={styles.summaryLabel}>{t('reports.totalIncome')}</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(stats.totalIncome, i18n.language)}
              </Text>
            </View>

            <View style={[styles.summaryCard, styles.expenseCard]}>
              <Text style={styles.summaryLabel}>{t('reports.totalExpense')}</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(stats.totalExpense, i18n.language)}
              </Text>
            </View>

            <View style={[styles.summaryCard, styles.netCard]}>
              <Text style={styles.summaryLabel}>{t('reports.netIncome')}</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(stats.netIncome, i18n.language)}
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('reports.categoryBreakdown')}</Text>
            {categoryStats.length === 0 ? (
              <Text style={styles.noDataText}>{t('reports.noData')}</Text>
            ) : (
              categoryStats.map((cat, index) => (
                <View key={index} style={styles.categoryItem}>
                  <View style={styles.categoryLeft}>
                    <Text style={styles.categoryName}>
                      {t(`categories.${cat.category}`, cat.category)}
                    </Text>
                    <View style={styles.progressBar}>
                      <View
                        style={[styles.progressFill, { width: `${cat.percentage}%` }]}
                      />
                    </View>
                  </View>
                  <View style={styles.categoryRight}>
                    <Text style={styles.categoryAmount}>
                      {formatCurrency(cat.amount, i18n.language)}
                    </Text>
                    <Text style={styles.categoryPercentage}>{cat.percentage.toFixed(1)}%</Text>
                  </View>
                </View>
              ))
            )}
          </View>

          <TouchableOpacity
            style={[styles.exportButton, exporting && styles.disabledButton]}
            onPress={handleExportToSheets}
            disabled={exporting}
          >
            {exporting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.exportButtonText}>{t('reports.exportToSheets')}</Text>
                <Text style={styles.exportIcon}>📊</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.spacer} />
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  periodSelector: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  periodTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
  },
  periodButtons: {
    flexDirection: 'row',
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  activePeriodButton: {
    backgroundColor: '#2196F3',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activePeriodButtonText: {
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  summaryContainer: {
    padding: 16,
  },
  summaryCard: {
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
  netCard: {
    backgroundColor: '#2196F3',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  noDataText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    paddingVertical: 24,
  },
  categoryItem: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  categoryLeft: {
    flex: 1,
    marginRight: 16,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2196F3',
    borderRadius: 4,
  },
  categoryRight: {
    alignItems: 'flex-end',
  },
  categoryAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  categoryPercentage: {
    fontSize: 14,
    color: '#666',
  },
  exportButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  disabledButton: {
    backgroundColor: '#BDBDBD',
  },
  exportButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  exportIcon: {
    fontSize: 20,
  },
  spacer: {
    height: 32,
  },
});
