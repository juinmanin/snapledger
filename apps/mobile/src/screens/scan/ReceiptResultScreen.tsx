import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image } from 'react-native';
import { Text, Card, TextInput, Button, Chip, SegmentedButtons } from 'react-native-paper';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { receiptsApi } from '../../api/receipts.api';
import { ScanStackParamList } from '../../navigation/MainTabNavigator';
import { useScanReceipt } from '../../hooks/useScanReceipt';
import { formatCurrency, parseCurrency } from '../../utils/formatCurrency';
import { CATEGORIES } from '../../utils/constants';
import { LoadingOverlay } from '../../components/common/LoadingOverlay';

type ReceiptResultScreenRouteProp = RouteProp<ScanStackParamList, 'ReceiptResult'>;

const ReceiptResultScreen = () => {
  const route = useRoute<ReceiptResultScreenRouteProp>();
  const navigation = useNavigation();
  const { receiptId } = route.params;

  const { data: receipt, isLoading } = useQuery({
    queryKey: ['receipt', receiptId],
    queryFn: () => receiptsApi.getReceipt(receiptId),
  });

  const { confirm, isConfirming } = useScanReceipt();

  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [transactionDate, setTransactionDate] = useState('');

  useEffect(() => {
    if (receipt) {
      setType('expense');
      setCategory(receipt.aiClassification || CATEGORIES.expense[0]);
      setAmount(receipt.totalAmount?.toString() || '');
      setDescription(receipt.merchantName || '');
      setTransactionDate(receipt.transactionDate || new Date().toISOString().split('T')[0]);
    }
  }, [receipt]);

  const handleConfirm = () => {
    if (!category || !amount || !description || !transactionDate) {
      return;
    }

    confirm(
      {
        receiptId,
        transactionData: {
          type,
          category,
          amount: parseCurrency(amount),
          description,
          transactionDate,
        },
      },
      {
        onSuccess: () => {
          navigation.navigate('DashboardTab' as never);
        },
      }
    );
  };

  if (isLoading) {
    return <LoadingOverlay visible={true} message="영수증을 분석하는 중..." />;
  }

  if (!receipt) {
    return (
      <View style={styles.container}>
        <Text>영수증을 찾을 수 없습니다.</Text>
      </View>
    );
  }

  const categories = type === 'income' ? CATEGORIES.income : CATEGORIES.expense;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {receipt.imageUrl && (
          <Image source={{ uri: receipt.imageUrl }} style={styles.receiptImage} />
        )}

        <Card style={styles.card} mode="elevated">
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              AI 분석 결과
            </Text>

            {receipt.aiClassification && (
              <View style={styles.aiInfo}>
                <Chip icon="robot" style={styles.chip}>
                  {receipt.aiClassification}
                </Chip>
                {receipt.confidence && (
                  <Text variant="bodySmall" style={styles.confidence}>
                    신뢰도: {(receipt.confidence * 100).toFixed(0)}%
                  </Text>
                )}
              </View>
            )}

            {receipt.ocrText && (
              <View style={styles.ocrContainer}>
                <Text variant="labelMedium" style={styles.label}>
                  OCR 텍스트:
                </Text>
                <Text variant="bodySmall" style={styles.ocrText}>
                  {receipt.ocrText}
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        <Card style={styles.card} mode="elevated">
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              거래 정보
            </Text>

            <SegmentedButtons
              value={type}
              onValueChange={(value) => setType(value as 'income' | 'expense')}
              buttons={[
                { value: 'expense', label: '지출' },
                { value: 'income', label: '수입' },
              ]}
              style={styles.segmentedButtons}
            />

            <Text variant="labelMedium" style={styles.inputLabel}>
              카테고리
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
              label="금액"
              value={amount}
              onChangeText={setAmount}
              mode="outlined"
              keyboardType="numeric"
              style={styles.input}
              right={<TextInput.Affix text="원" />}
            />

            <TextInput
              label="내용"
              value={description}
              onChangeText={setDescription}
              mode="outlined"
              style={styles.input}
            />

            <TextInput
              label="거래일자"
              value={transactionDate}
              onChangeText={setTransactionDate}
              mode="outlined"
              style={styles.input}
              placeholder="YYYY-MM-DD"
            />
          </Card.Content>
        </Card>

        <View style={styles.actions}>
          <Button
            mode="outlined"
            onPress={() => navigation.goBack()}
            disabled={isConfirming}
            style={styles.actionButton}
          >
            취소
          </Button>
          <Button
            mode="contained"
            onPress={handleConfirm}
            loading={isConfirming}
            disabled={isConfirming || !category || !amount || !description}
            style={styles.actionButton}
          >
            확인
          </Button>
        </View>
      </ScrollView>
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
  receiptImage: {
    width: '100%',
    height: 300,
    resizeMode: 'contain',
    backgroundColor: '#000',
  },
  card: {
    margin: 16,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 16,
  },
  aiInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  chip: {
    backgroundColor: '#E8F5E9',
  },
  confidence: {
    color: '#49454F',
  },
  ocrContainer: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
  },
  label: {
    marginBottom: 8,
    color: '#49454F',
  },
  ocrText: {
    color: '#1C1B1F',
    lineHeight: 20,
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
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 16,
    padding: 16,
  },
  actionButton: {
    flex: 1,
  },
});

export default ReceiptResultScreen;
