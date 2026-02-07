import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, SegmentedButtons, Chip } from 'react-native-paper';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { format } from 'date-fns';
import { TransactionStackParamList } from '../../navigation/MainTabNavigator';
import { useCreateTransaction, useUpdateTransaction, useTransaction } from '../../hooks/useTransactions';
import { parseCurrency } from '../../utils/formatCurrency';
import { CATEGORIES } from '../../utils/constants';

type ManualEntryScreenRouteProp = RouteProp<TransactionStackParamList, 'ManualEntry'>;

const ManualEntryScreen = () => {
  const route = useRoute<ManualEntryScreenRouteProp>();
  const navigation = useNavigation();
  const { transactionId } = route.params;

  const isEditing = !!transactionId;

  const { data: existingTransaction } = useTransaction(transactionId || '');
  const createMutation = useCreateTransaction();
  const updateMutation = useUpdateTransaction();

  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [transactionDate, setTransactionDate] = useState(
    format(new Date(), 'yyyy-MM-dd')
  );

  useEffect(() => {
    if (existingTransaction) {
      setType(existingTransaction.type);
      setCategory(existingTransaction.category);
      setAmount(existingTransaction.amount.toString());
      setDescription(existingTransaction.description);
      setTransactionDate(
        format(new Date(existingTransaction.transactionDate), 'yyyy-MM-dd')
      );
    }
  }, [existingTransaction]);

  const handleSubmit = () => {
    if (!category || !amount || !description || !transactionDate) {
      return;
    }

    const data = {
      type,
      category,
      amount: parseCurrency(amount),
      description,
      transactionDate,
    };

    if (isEditing && transactionId) {
      updateMutation.mutate(
        { id: transactionId, data },
        {
          onSuccess: () => {
            navigation.goBack();
          },
        }
      );
    } else {
      createMutation.mutate(data, {
        onSuccess: () => {
          navigation.goBack();
        },
      });
    }
  };

  const categories = type === 'income' ? CATEGORIES.income : CATEGORIES.expense;

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text variant="headlineSmall" style={styles.title}>
            {isEditing ? '거래 수정' : '거래 추가'}
          </Text>
        </View>

        <View style={styles.form}>
          <SegmentedButtons
            value={type}
            onValueChange={(value) => {
              setType(value as 'income' | 'expense');
              setCategory('');
            }}
            buttons={[
              { value: 'expense', label: '지출' },
              { value: 'income', label: '수입' },
            ]}
            style={styles.segmentedButtons}
          />

          <Text variant="labelMedium" style={styles.inputLabel}>
            카테고리 *
          </Text>
          <View style={styles.categoryContainer}>
            {categories.map((cat) => (
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
            label="금액 *"
            value={amount}
            onChangeText={setAmount}
            mode="outlined"
            keyboardType="numeric"
            style={styles.input}
            right={<TextInput.Affix text="원" />}
          />

          <TextInput
            label="내용 *"
            value={description}
            onChangeText={setDescription}
            mode="outlined"
            style={styles.input}
            placeholder="예: 점심 식사"
          />

          <TextInput
            label="거래일자 *"
            value={transactionDate}
            onChangeText={setTransactionDate}
            mode="outlined"
            style={styles.input}
            placeholder="YYYY-MM-DD"
            keyboardType="default"
          />

          <View style={styles.actions}>
            <Button
              mode="outlined"
              onPress={() => navigation.goBack()}
              disabled={isLoading}
              style={styles.actionButton}
            >
              취소
            </Button>
            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={isLoading}
              disabled={isLoading || !category || !amount || !description}
              style={styles.actionButton}
            >
              {isEditing ? '수정' : '추가'}
            </Button>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  content: {
    padding: 24,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontWeight: 'bold',
    color: '#1C1B1F',
  },
  form: {
    gap: 16,
  },
  segmentedButtons: {
    marginBottom: 8,
  },
  inputLabel: {
    marginBottom: 8,
    color: '#49454F',
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  categoryChip: {
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
  },
  actions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 24,
  },
  actionButton: {
    flex: 1,
  },
});

export default ManualEntryScreen;
