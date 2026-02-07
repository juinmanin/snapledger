import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import ScanReceiptScreen from '../screens/scan/ScanReceiptScreen';
import ReceiptResultScreen from '../screens/scan/ReceiptResultScreen';
import TransactionListScreen from '../screens/transactions/TransactionListScreen';
import ManualEntryScreen from '../screens/transactions/ManualEntryScreen';
import ReportMainScreen from '../screens/reports/ReportMainScreen';
import BudgetScreen from '../screens/budget/BudgetScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';

export type MainTabParamList = {
  DashboardTab: undefined;
  ScanTab: undefined;
  TransactionsTab: undefined;
  ReportsTab: undefined;
  SettingsTab: undefined;
};

export type ScanStackParamList = {
  ScanReceipt: undefined;
  ReceiptResult: {
    receiptId: string;
  };
};

export type TransactionStackParamList = {
  TransactionList: undefined;
  ManualEntry: {
    transactionId?: string;
  };
};

const Tab = createBottomTabNavigator<MainTabParamList>();
const ScanStack = createNativeStackNavigator<ScanStackParamList>();
const TransactionStack = createNativeStackNavigator<TransactionStackParamList>();

const ScanNavigator = () => {
  return (
    <ScanStack.Navigator>
      <ScanStack.Screen
        name="ScanReceipt"
        component={ScanReceiptScreen}
        options={{ title: '영수증 스캔' }}
      />
      <ScanStack.Screen
        name="ReceiptResult"
        component={ReceiptResultScreen}
        options={{ title: '스캔 결과' }}
      />
    </ScanStack.Navigator>
  );
};

const TransactionNavigator = () => {
  return (
    <TransactionStack.Navigator>
      <TransactionStack.Screen
        name="TransactionList"
        component={TransactionListScreen}
        options={{ title: '거래 내역' }}
      />
      <TransactionStack.Screen
        name="ManualEntry"
        component={ManualEntryScreen}
        options={{ title: '수동 입력' }}
      />
    </TransactionStack.Navigator>
  );
};

export const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#2E7D32',
        tabBarInactiveTintColor: '#79747E',
        tabBarStyle: {
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="DashboardTab"
        component={DashboardScreen}
        options={{
          title: '대시보드',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="view-dashboard" size={size} color={color} />
          ),
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="ScanTab"
        component={ScanNavigator}
        options={{
          title: '스캔',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="camera" size={size} color={color} />
          ),
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="TransactionsTab"
        component={TransactionNavigator}
        options={{
          title: '거래',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="format-list-bulleted" size={size} color={color} />
          ),
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="ReportsTab"
        component={ReportMainScreen}
        options={{
          title: '리포트',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="chart-bar" size={size} color={color} />
          ),
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsScreen}
        options={{
          title: '설정',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cog" size={size} color={color} />
          ),
          headerShown: false,
        }}
      />
    </Tab.Navigator>
  );
};
