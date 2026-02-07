import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text } from 'react-native-paper';
import { PieChart } from 'react-native-chart-kit';
import { categoryColors } from '../../theme/theme';

interface ExpensePieChartProps {
  data: {
    category: string;
    amount: number;
  }[];
}

export const ExpensePieChart: React.FC<ExpensePieChartProps> = ({ data }) => {
  const chartData = data.map((item) => ({
    name: item.category,
    amount: item.amount,
    color: categoryColors[item.category as keyof typeof categoryColors] || '#616161',
    legendFontColor: '#49454F',
    legendFontSize: 12,
  }));

  if (data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text variant="bodyMedium" style={styles.emptyText}>
          데이터가 없습니다
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <PieChart
        data={chartData}
        width={Dimensions.get('window').width - 32}
        height={220}
        chartConfig={{
          color: (opacity = 1) => `rgba(46, 125, 50, ${opacity})`,
        }}
        accessor="amount"
        backgroundColor="transparent"
        paddingLeft="15"
        absolute
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  emptyContainer: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#79747E',
  },
});
