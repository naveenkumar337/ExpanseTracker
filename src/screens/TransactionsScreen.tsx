// src/screens/TransactionsScreen.tsx
import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import {
  Text,
  Card,
  Chip,
  IconButton,
  Appbar,
  Snackbar,
} from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

import { AppStorage } from '../services/storage';
import { ParsedTransaction } from '../utils/smsParser';

export default function TransactionsScreen() {
  const navigation = useNavigation();
  const [transactions, setTransactions] = useState<ParsedTransaction[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'DEBIT' | 'CREDIT'>('ALL');
  const [refreshing, setRefreshing] = useState(false);
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' });

  const loadData = useCallback(async () => {
    const data = await AppStorage.getTransactions();
    setTransactions(data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const filteredTransactions = transactions.filter(t => {
    if (filter === 'ALL') return true;
    return t.type === filter;
  });

  const handleDelete = async (id: string) => {
    await AppStorage.deleteTransaction(id);
    await loadData();
    setSnackbar({ visible: true, message: 'Transaction deleted' });
  };

  const formatCurrency = (amount: number) => {
    return 'Rs.' + amount.toLocaleString('en-IN', { minimumFractionDigits: 2 });
  };

  const renderItem = ({ item }: { item: ParsedTransaction }) => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.row}>
          <View style={styles.left}>
            <Text variant="bodyLarge" style={{ fontWeight: '500' }} numberOfLines={1}>
              {item.merchant}
            </Text>
            <View style={styles.chipRow}>
              <Chip icon="bank" style={styles.chip}>{item.bankName}</Chip>
              <Chip icon="tag" style={styles.chip}>{item.category}</Chip>
            </View>
            <Text variant="bodySmall" style={{ color: '#79747E' }}>
              {new Date(item.transactionDate).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'short', year: 'numeric'
              })}
            </Text>
          </View>
          <View style={styles.right}>
            <Text 
              variant="titleMedium" 
              style={{ 
                fontWeight: 'bold', 
                color: item.type === 'DEBIT' ? '#E53935' : '#4CAF50' 
              }}
            >
              {formatCurrency(item.amount)}
            </Text>
            <Text variant="bodySmall" style={{ color: '#79747E' }}>
              {item.type}
            </Text>
            {item.syncedToSheets && (
              <Text variant="bodySmall" style={{ color: '#4CAF50' }}>[v] Synced</Text>
            )}
          </View>
        </View>
      </Card.Content>
      <Card.Actions>
        <IconButton 
          icon="delete" 
          size={20} 
          onPress={() => handleDelete(item.id)}
          iconColor="#E53935"
        />
      </Card.Actions>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Appbar.Header style={{ backgroundColor: '#6650a4' }}>
        <Appbar.Content title="All Transactions" color="white" />
      </Appbar.Header>

      <View style={styles.filterRow}>
        {(['ALL', 'DEBIT', 'CREDIT'] as const).map((f) => (
          <Chip
            key={f}
            selected={filter === f}
            onPress={() => setFilter(f)}
            style={[
              styles.filterChip,
              filter === f && { backgroundColor: '#E8DDFF' }
            ]}
          >
            {f === 'ALL' ? 'All' : f === 'DEBIT' ? 'Debits' : 'Credits'}
          </Chip>
        ))}
      </View>

      <FlatList
        data={filteredTransactions}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadData} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text variant="bodyMedium" style={{ color: '#49454F' }}>
              No transactions found
            </Text>
          </View>
        }
      />

      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar({ ...snackbar, visible: false })}
        duration={2000}
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
  filterRow: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
  },
  filterChip: {
    borderRadius: 16,
  },
  list: {
    padding: 12,
    paddingBottom: 24,
  },
  card: {
    marginBottom: 8,
    borderRadius: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  left: {
    flex: 1,
    marginRight: 8,
  },
  right: {
    alignItems: 'flex-end',
  },
  chipRow: {
    flexDirection: 'row',
    gap: 4,
    marginVertical: 4,
  },
  chip: {
    height: 28,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 48,
  },
});
