// src/services/storage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { ParsedTransaction } from '../utils/smsParser';

const KEYS = {
  TRANSACTIONS: 'transactions',
  GOOGLE_TOKEN: 'google_token',
  SHEET_ID: 'sheet_id',
  USER_EMAIL: 'user_email',
};

// Public data - AsyncStorage
export const AppStorage = {
  async saveTransactions(transactions: ParsedTransaction[]) {
    try {
      await AsyncStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(transactions));
    } catch (e) {
      console.error('Save transactions failed', e);
    }
  },

  async getTransactions(): Promise<ParsedTransaction[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.TRANSACTIONS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Load transactions failed', e);
      return [];
    }
  },

  async addTransaction(transaction: ParsedTransaction) {
    const existing = await this.getTransactions();
    const exists = existing.some(t => t.smsHash === transaction.smsHash);
    if (!exists) {
      existing.unshift(transaction);
      await this.saveTransactions(existing);
      return true;
    }
    return false;
  },

  async updateTransaction(id: string, updates: Partial<ParsedTransaction>) {
    const transactions = await this.getTransactions();
    const index = transactions.findIndex(t => t.id === id);
    if (index >= 0) {
      transactions[index] = { ...transactions[index], ...updates };
      await this.saveTransactions(transactions);
    }
  },

  async deleteTransaction(id: string) {
    const transactions = await this.getTransactions();
    const filtered = transactions.filter(t => t.id !== id);
    await this.saveTransactions(filtered);
  },

  async getUnsyncedTransactions(): Promise<ParsedTransaction[]> {
    const transactions = await this.getTransactions();
    return transactions.filter(t => !t.syncedToSheets);
  },

  async clearAll() {
    await AsyncStorage.clear();
  }
};

// Sensitive data - SecureStore [^8^]
export const AuthStorage = {
  async saveGoogleToken(token: string) {
    await SecureStore.setItemAsync(KEYS.GOOGLE_TOKEN, token);
  },

  async getGoogleToken(): Promise<string | null> {
    return await SecureStore.getItemAsync(KEYS.GOOGLE_TOKEN);
  },

  async saveSheetId(id: string) {
    await SecureStore.setItemAsync(KEYS.SHEET_ID, id);
  },

  async getSheetId(): Promise<string | null> {
    return await SecureStore.getItemAsync(KEYS.SHEET_ID);
  },

  async saveUserEmail(email: string) {
    await SecureStore.setItemAsync(KEYS.USER_EMAIL, email);
  },

  async getUserEmail(): Promise<string | null> {
    return await SecureStore.getItemAsync(KEYS.USER_EMAIL);
  },

  async clearAuth() {
    await SecureStore.deleteItemAsync(KEYS.GOOGLE_TOKEN);
    await SecureStore.deleteItemAsync(KEYS.SHEET_ID);
    await SecureStore.deleteItemAsync(KEYS.USER_EMAIL);
  }
};
