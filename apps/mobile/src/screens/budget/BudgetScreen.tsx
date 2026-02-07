import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, FAB, Button, TextInput, Dialog, Portal, SegmentedButtons, Chip } from 'react-native-paper';
import { format } from 'date-fns';
import { useBudgets, useCreateBudget, useDeleteBudget } from '../../hooks/useBudget';
import { BudgetProgressBar } from '../../components/chart/BudgetProgressBar';
import { EmptyState } from '../../components/common/EmptyState';
import { CATEGORIES } from '../../utils/constants';
import { parseCurrency } from '../../utils/formatCurrency';

const BudgetScreen = () => {
  const { data: budgets, isLoading, refetch } = useBudgets({ active: true });
  const createMutation = useCreateBudget();
  const deleteMutation = useDeleteBudget();

  const [dialogVisible, setDialogVisible] = useState(false);
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [period, setPeriod] = useState<'monthly' | 'yearly'>('monthly');

  const showDialog = () => setDialogVisible(true);
  const hideDialog = () => {
    setDialogVisible(false);
    setCategory('');
    setAmount('');
    setPeriod('monthly');
  };

  const handleCreate = () => {
    if (!category || !amount) {
      return;
    }

    createMutation.mutate(
      {
        category,
        amount: parseCurrency(amount),
        period,
        startDate: format(new Date(), 'yyyy-MM-dd'),
      },
      {
        onSuccess: () => {
          hideDialog();
          refetch();
        },
      }
    );
  };

  const handleDelete = (budgetId: string) => {
    Alert.alert(
      '예산 삭제',
      '정말로 이 예산을 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => {
            deleteMutation.mutate(budgetId, {
              onSuccess: () => refetch(),
            });
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>
          예산 관리
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          카테고리별 예산을 설정하고 지출을 관리하세요
        </Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {budgets && budgets.length > 0 ? (
          <Card style={styles.card} mode="elevated">
            <Card.Content>
              {budgets.map((budget) => (
                <View key={budget.id} style={styles.budgetItem}>
                  <BudgetProgressBar
                    category={budget.category}
                    budget={budget.amount}
                    spent={budget.spent}
                  />
                  <Button
                    mode="text"
                    textColor="#D32F2F"
                    onPress={() => handleDelete(budget.id)}
                    compact
                  >
                    삭제
                  </Button>
                </View>
              ))}
            </Card.Content>
          </Card>
        ) : (
          <EmptyState
            icon="wallet-outline"
            message="설정된 예산이 없습니다"
            description="예산을 추가하여 지출을 관리해보세요"
          />
        )}
      </ScrollView>

      <FAB
        icon="plus"
        label="예산 추가"
        style={styles.fab}
        onPress={showDialog}
      />

      <Portal>
        <Dialog visible={dialogVisible} onDismiss={hideDialog}>
          <Dialog.Title>예산 추가</Dialog.Title>
          <Dialog.Content>
            <SegmentedButtons
              value={period}
              onValueChange={(value) => setPeriod(value as 'monthly' | 'yearly')}
              buttons={[
                { value: 'monthly', label: '월간' },
                { value: 'yearly', label: '연간' },
              ]}
              style={styles.segmentedButtons}
            />

            <Text variant="labelMedium" style={styles.inputLabel}>
              카테고리 *
            </Text>
            <View style={styles.categoryContainer}>
              {CATEGORIES.expense.map((cat) => (
                <Chip
                  key={cat}
                  selected={category === cat}
                  onPress={() => setCategory(cat)}
                  style={styles.categoryChip}
                  showSelectedCheck
                >
                  {cat}
                </Chip>
              ))}
            </View>

            <TextInput
              label="예산 금액 *"
              value={amount}
              onChangeText={setAmount}
              mode="outlined"
              keyboardType="numeric"
              style={styles.input}
              right={<TextInput.Affix text="원" />}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={hideDialog} disabled={createMutation.isPending}>
              취소
            </Button>
            <Button
              onPress={handleCreate}
              loading={createMutation.isPending}
              disabled={createMutation.isPending || !category || !amount}
            >
              추가
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
  },
  title: {
    fontWeight: 'bold',
    color: '#1C1B1F',
    marginBottom: 8,
  },
  subtitle: {
    color: '#49454F',
  },
  scrollView: {
    flex: 1,
  },
  card: {
    margin: 16,
  },
  budgetItem: {
    marginBottom: 16,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: '#2E7D32',
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  inputLabel: {
    marginBottom: 8,
    color: '#49454F',
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  categoryChip: {
    marginBottom: 8,
  },
  input: {
    marginBottom: 8,
  },
});

export default BudgetScreen;
