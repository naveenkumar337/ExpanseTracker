// src/screens/DashboardScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import {
  Text,
  Card,
  Button,
  FAB,
  ActivityIndicator,
  Snackbar,
  Divider,
  Chip,
} from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { AppStorage } from '../services/storage';
import { sheetsService } from '../services/googleSheets';
import { ParsedTransaction } from '../utils/smsParser';

interface Summary {
  expenses: number;
  income: number;
  net: number;
}

export default function DashboardScreen() {
  const navigation = useNavigation();
  const [transactions, setTransactions] = useState<ParsedTransaction[]>([]);
  const [weeklySummary, setWeeklySummary] = useState<Summary | null>(null);
  const [monthlySummary, setMonthlySummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' });

  const loadData = useCallback(async () => {
    const data = await AppStorage.getTransactions();
    setTransactions(data.slice(0, 5));
    calculateSummaries(data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const calculateSummaries = (data: ParsedTransaction[]) => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const weekly = data.filter(t => new Date(t.transactionDate) >= weekAgo);
    const monthly = data.filter(t => new Date(t.transactionDate) >= monthStart);

    const calc = (items: ParsedTransaction[]): Summary => {
      const expenses = items.filter(t => t.type === 'DEBIT').reduce((sum, t) => sum + t.amount, 0);
      const income = items.filter(t => t.type === 'CREDIT').reduce((sum, t) => sum + t.amount, 0);
      return { expenses, income, net: income - expenses };
    };

    setWeeklySummary(calc(weekly));
    setMonthlySummary(calc(monthly));
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await sheetsService.initialize();
      const unsynced = await AppStorage.getUnsyncedTransactions();

      if (unsynced.length === 0) {
        setSnackbar({ visible: true, message: 'No transactions to sync' });
        return;
      }

      const success = await sheetsService.appendTransactions(unsynced);

      if (success) {
        for (const t of unsynced) {
          await AppStorage.updateTransaction(t.id, { syncedToSheets: true });
        }
        await loadData();
        setSnackbar({ visible: true, message: `Synced ${unsynced.length} transactions!` });
      } else {
        setSnackbar({ visible: true, message: 'Sync failed. Check your connection.' });
      }
    } catch (error) {
      setSnackbar({ visible: true, message: 'Sync error: ' + (error as Error).message });
    } finally {
      setSyncing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return 'Rs.' + amount.toLocaleString('en-IN', { minimumFractionDigits: 2 });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} />}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Weekly Summary */}
        <Card style={[styles.summaryCard, { backgroundColor: '#E8DDFF' }]}>
          <Card.Content>
            <Text variant="titleMedium" style={{ color: '#6650a4', fontWeight: 'bold' }}>
              This Week
            </Text>
            <View style={styles.summaryRow}>
              <View>
                <Text variant="bodySmall" style={{ color: '#49454F' }}>Expenses</Text>
                <Text variant="titleSmall" style={{ color: '#E53935', fontWeight: 'bold' }}>
                  {weeklySummary ? formatCurrency(weeklySummary.expenses) : 'Rs.0.00'}
                </Text>
              </View>
              <View>
                <Text variant="bodySmall" style={{ color: '#49454F' }}>Income</Text>
                <Text variant="titleSmall" style={{ color: '#4CAF50', fontWeight: 'bold' }}>
                  {weeklySummary ? formatCurrency(weeklySummary.income) : 'Rs.0.00'}
                </Text>
              </View>
            </View>
            <Divider style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text variant="bodyMedium">Net</Text>
              <Text 
                variant="titleSmall" 
                style={{ 
                  fontWeight: 'bold', 
                  color: (weeklySummary?.net || 0) >= 0 ? '#4CAF50' : '#E53935' 
                }}
              >
                {(weeklySummary?.net || 0) >= 0 ? '+' : ''}
                {weeklySummary ? formatCurrency(Math.abs(weeklySummary.net)) : 'Rs.0.00'}
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Monthly Summary */}
        <Card style={[styles.summaryCard, { backgroundColor: '#D6E3FF' }]}>
          <Card.Content>
            <Text variant="titleMedium" style={{ color: '#6650a4', fontWeight: 'bold' }}>
              This Month
            </Text>
            <View style={styles.summaryRow}>
              <View>
                <Text variant="bodySmall" style={{ color: '#49454F' }}>Expenses</Text>
                <Text variant="titleSmall" style={{ color: '#E53935', fontWeight: 'bold' }}>
                  {monthlySummary ? formatCurrency(monthlySummary.expenses) : 'Rs.0.00'}
                </Text>
              </View>
              <View>
                <Text variant="bodySmall" style={{ color: '#49454F' }}>Income</Text>
                <Text variant="titleSmall" style={{ color: '#4CAF50', fontWeight: 'bold' }}>
                  {monthlySummary ? formatCurrency(monthlySummary.income) : 'Rs.0.00'}
                </Text>
              </View>
            </View>
            <Divider style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text variant="bodyMedium">Net</Text>
              <Text 
                variant="titleSmall" 
                style={{ 
                  fontWeight: 'bold', 
                  color: (monthlySummary?.net || 0) >= 0 ? '#4CAF50' : '#E53935' 
                }}
              >
                {(monthlySummary?.net || 0) >= 0 ? '+' : ''}
                {monthlySummary ? formatCurrency(Math.abs(monthlySummary.net)) : 'Rs.0.00'}
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Quick Actions */}
        <View style={styles.actionsRow}>
          <Button 
            mode="contained" 
            onPress={() => navigation.navigate('ShareReceiver' as never)}
            style={styles.actionButton}
            icon="plus"
          >
            Add SMS
          </Button>
          <Button 
            mode="contained" 
            onPress={handleSync}
            loading={syncing}
            disabled={syncing}
            style={styles.actionButton}
            icon="cloud-upload"
          >
            Sync
          </Button>
        </View>

        {/* Recent Transactions */}
        <Text variant="titleLarge" style={styles.sectionTitle}>Recent Transactions</Text>

        {transactions.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <MaterialCommunityIcons name="inbox" size={48} color="#79747E" />
              <Text variant="bodyMedium" style={{ color: '#49454F', marginTop: 8 }}>
                No transactions yet
              </Text>
              <Text variant="bodySmall" style={{ color: '#79747E' }}>
                Tap "Add SMS" to import from your messages
              </Text>
            </Card.Content>
          </Card>
        ) : (
          transactions.map((t) => (
            <Card key={t.id} style={styles.transactionCard}>
              <Card.Content>
                <View style={styles.transactionRow}>
                  <View style={styles.transactionLeft}>
                    <Text variant="bodyLarge" style={{ fontWeight: '500' }} numberOfLines={1}>
                      {t.merchant}
                    </Text>
                    <Text variant="bodySmall" style={{ color: '#49454F' }}>
                      {t.bankName} . {t.category}
                    </Text>
                    <Text variant="bodySmall" style={{ color: '#79747E' }}>
                      {new Date(t.transactionDate).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </Text>
                  </View>
                  <View style={styles.transactionRight}>
                    <Text 
                      variant="titleMedium" 
                      style={{ 
                        fontWeight: 'bold', 
                        color: t.type === 'DEBIT' ? '#E53935' : '#4CAF50' 
                      }}
                    >
                      {formatCurrency(t.amount)}
                    </Text>
                    <Text variant="bodySmall" style={{ color: '#79747E' }}>
                      {t.type}
                    </Text>
                    {t.syncedToSheets && (
                      <MaterialCommunityIcons name="check-circle" size={14} color="#4CAF50" />
                    )}
                  </View>
                </View>
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>

      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar({ ...snackbar, visible: false })}
        duration={3000}
      >
        {snackbar.message}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEF7FF',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
  },
  summaryCard: {
    marginBottom: 12,
    borderRadius: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  divider: {
    marginVertical: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 16,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#6650a4',
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#1D1B20',
  },
  transactionCard: {
    marginBottom: 8,
    borderRadius: 12,
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionLeft: {
    flex: 1,
    marginRight: 8,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  emptyCard: {
    marginVertical: 16,
    borderRadius: 12,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 32,
  },
});
