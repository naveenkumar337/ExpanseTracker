// src/screens/ShareReceiverScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TextInput, ScrollView } from 'react-native';
import {
  Text,
  Button,
  Card,
  Chip,
  ActivityIndicator,
  Snackbar,
  Appbar,
} from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';

import { parseSms, ParsedTransaction } from '../utils/smsParser';
import { AppStorage } from '../services/storage';

export default function ShareReceiverScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const [smsText, setSmsText] = useState('');
  const [parsed, setParsed] = useState<ParsedTransaction | null>(null);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' });

  // Check if opened via share intent
  useEffect(() => {
    const sharedText = route.params?.sharedText as string;
    if (sharedText) {
      setSmsText(sharedText);
      handleParse(sharedText);
    }
  }, [route.params]);

  const handleParse = (text: string) => {
    const result = parseSms(text);
    setParsed(result);

    if (!result) {
      setSnackbar({ visible: true, message: 'Could not parse this SMS. Check format.' });
    }
  };

  const handleSave = async () => {
    if (!parsed) return;

    setSaving(true);
    try {
      const added = await AppStorage.addTransaction(parsed);
      if (added) {
        setSnackbar({ visible: true, message: 'Transaction saved!' });
        setTimeout(() => navigation.goBack(), 1500);
      } else {
        setSnackbar({ visible: true, message: 'Duplicate transaction (already exists)' });
      }
    } catch (error) {
      setSnackbar({ visible: true, message: 'Save failed' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Appbar.Header style={{ backgroundColor: '#6650a4' }}>
        <Appbar.BackAction onPress={() => navigation.goBack()} color="white" />
        <Appbar.Content title="Add Transaction" color="white" />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="bodyMedium" style={styles.label}>
          Paste bank SMS text:
        </Text>
        <TextInput
          style={styles.textInput}
          multiline
          numberOfLines={6}
          value={smsText}
          onChangeText={setSmsText}
          placeholder="Sent Rs.24.00 From HDFC Bank A/C *4819 To BMTC BUS..."
          textAlignVertical="top"
        />

        <Button 
          mode="outlined" 
          onPress={() => handleParse(smsText)}
          style={styles.parseButton}
          disabled={!smsText.trim()}
        >
          Parse SMS
        </Button>

        {parsed && (
          <Card style={styles.resultCard}>
            <Card.Content>
              <Text variant="titleMedium" style={{ color: '#4CAF50', fontWeight: 'bold', marginBottom: 12 }}>
                ✅ Parsed Successfully
              </Text>

              <View style={styles.detailRow}>
                <Text variant="bodyMedium" style={styles.detailLabel}>Amount:</Text>
                <Text variant="bodyMedium" style={styles.detailValue}>Rs.{parsed.amount}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text variant="bodyMedium" style={styles.detailLabel}>Type:</Text>
                <Chip style={{ backgroundColor: parsed.type === 'DEBIT' ? '#FFEBEE' : '#E8F5E9' }}>
                  <Text style={{ color: parsed.type === 'DEBIT' ? '#E53935' : '#4CAF50' }}>
                    {parsed.type}
                  </Text>
                </Chip>
              </View>
              <View style={styles.detailRow}>
                <Text variant="bodyMedium" style={styles.detailLabel}>Merchant:</Text>
                <Text variant="bodyMedium" style={styles.detailValue}>{parsed.merchant}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text variant="bodyMedium" style={styles.detailLabel}>Category:</Text>
                <Chip icon="tag">{parsed.category}</Chip>
              </View>
              <View style={styles.detailRow}>
                <Text variant="bodyMedium" style={styles.detailLabel}>Bank:</Text>
                <Text variant="bodyMedium" style={styles.detailValue}>{parsed.bankName}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text variant="bodyMedium" style={styles.detailLabel}>Account:</Text>
                <Text variant="bodyMedium" style={styles.detailValue}>{parsed.accountNumber}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text variant="bodyMedium" style={styles.detailLabel}>Date:</Text>
                <Text variant="bodyMedium" style={styles.detailValue}>
                  {new Date(parsed.transactionDate).toLocaleDateString('en-IN')}
                </Text>
              </View>
            </Card.Content>
          </Card>
        )}

        {parsed && (
          <Button
            mode="contained"
            onPress={handleSave}
            loading={saving}
            disabled={saving}
            style={styles.saveButton}
            icon="content-save"
          >
            Save Transaction
          </Button>
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
  content: {
    padding: 16,
  },
  label: {
    marginBottom: 8,
    color: '#49454F',
  },
  textInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#79747E',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  parseButton: {
    marginVertical: 16,
    borderColor: '#6650a4',
  },
  resultCard: {
    backgroundColor: '#F1F8E9',
    borderRadius: 12,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  detailLabel: {
    color: '#49454F',
    flex: 1,
  },
  detailValue: {
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  saveButton: {
    backgroundColor: '#6650a4',
    marginTop: 8,
  },
});
