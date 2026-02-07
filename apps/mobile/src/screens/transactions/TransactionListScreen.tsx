import React, { useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, FAB, Chip, Searchbar, Card, Divider } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { format, parseISO } from 'date-fns';
import { useInfiniteTransactions } from '../../hooks/useTransactions';
import { useTransactionStore } from '../../stores/transactionStore';
import { TransactionStackParamList } from '../../navigation/MainTabNavigator';
import { Transaction } from '../../api/types';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import { CategoryIcon } from '../../components/common/CategoryIcon';
import { EmptyState } from '../../components/common/EmptyState';
import { CATEGORIES } from '../../utils/constants';

type TransactionListScreenNavigationProp = NativeStackNavigationProp<
  TransactionStackParamList,
  'TransactionList'
>;

const TransactionListScreen = () => {
  const navigation = useNavigation<TransactionListScreenNavigationProp>();
  const { filters, setFilter, clearFilters } = useTransactionStore();
  const [searchQuery, setSearchQuery] = useState('');

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useInfiniteTransactions({
    ...filters,
    search: searchQuery,
    limit: 20,
  });

  const transactions = data?.pages.flatMap((page) => page.data) || [];

  const groupedTransactions = transactions.reduce((acc, transaction) => {
    const date = format(parseISO(transaction.transactionDate), 'yyyy-MM-dd');
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(transaction);
    return acc;
  }, {} as Record<string, Transaction[]>);

  const sections = Object.entries(groupedTransactions).map(([date, items]) => ({
    date,
    data: items,
  }));

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleFilterType = (type: 'income' | 'expense' | undefined) => {
    setFilter('type', type);
    refetch();
  };

  const handleClearFilters = () => {
    clearFilters();
    setSearchQuery('');
    refetch();
  };

  const renderTransaction = (transaction: Transaction) => (
    <View key={transaction.id} style={styles.transactionItem}>
      <CategoryIcon category={transaction.category} size={20} />
      <View style={styles.transactionInfo}>
        <Text variant="bodyMedium" style={styles.transactionDescription}>
          {transaction.description}
        </Text>
        <Text variant="bodySmall" style={styles.transactionCategory}>
          {transaction.category}
        </Text>
      </View>
      <Text
        variant="bodyLarge"
        style={[
          styles.transactionAmount,
          transaction.type === 'income' ? styles.incomeText : styles.expenseText,
        ]}
      >
        {transaction.type === 'income' ? '+' : '-'}
        {formatCurrency(transaction.amount)}
      </Text>
    </View>
  );

  const renderSection = ({ item }: { item: { date: string; data: Transaction[] } }) => (
    <Card style={styles.dateCard} mode="outlined">
      <Card.Content>
        <Text variant="titleSmall" style={styles.dateHeader}>
          {formatDate(item.date)}
        </Text>
        <Divider style={styles.divider} />
        {item.data.map((transaction, index) => (
          <View key={transaction.id}>
            {index > 0 && <Divider style={styles.itemDivider} />}
            {renderTransaction(transaction)}
          </View>
        ))}
      </Card.Content>
    </Card>
  );

  const hasActiveFilters = filters.type || searchQuery;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>
          거래 내역
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="거래 내역 검색"
          onChangeText={handleSearch}
          value={searchQuery}
          style={styles.searchBar}
        />
      </View>

      <View style={styles.filterContainer}>
        <Chip
          selected={!filters.type}
          onPress={() => handleFilterType(undefined)}
          style={styles.filterChip}
        >
          전체
        </Chip>
        <Chip
          selected={filters.type === 'income'}
          onPress={() => handleFilterType('income')}
          style={styles.filterChip}
        >
          수입
        </Chip>
        <Chip
          selected={filters.type === 'expense'}
          onPress={() => handleFilterType('expense')}
          style={styles.filterChip}
        >
          지출
        </Chip>
        {hasActiveFilters && (
          <Chip icon="close" onPress={handleClearFilters} style={styles.filterChip}>
            초기화
          </Chip>
        )}
      </View>

      {sections.length > 0 ? (
        <FlatList
          data={sections}
          renderItem={renderSection}
          keyExtractor={(item) => item.date}
          contentContainerStyle={styles.listContent}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.5}
          refreshing={isLoading}
          onRefresh={refetch}
        />
      ) : (
        <EmptyState
          icon="receipt-text-outline"
          message="거래 내역이 없습니다"
          description="영수증을 스캔하거나 수동으로 거래를 추가해보세요"
        />
      )}

      <FAB
        icon="plus"
        label="추가"
        style={styles.fab}
        onPress={() => navigation.navigate('ManualEntry', {})}
      />
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
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  searchBar: {
    elevation: 2,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  filterChip: {
    height: 32,
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  dateCard: {
    marginBottom: 12,
  },
  dateHeader: {
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 8,
  },
  divider: {
    marginBottom: 8,
  },
  itemDivider: {
    marginVertical: 8,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontWeight: '500',
    marginBottom: 4,
  },
  transactionCategory: {
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
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: '#2E7D32',
  },
});

export default TransactionListScreen;
