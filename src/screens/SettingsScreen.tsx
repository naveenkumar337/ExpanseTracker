// src/screens/SettingsScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import {
  Text,
  Card,
  Button,
  TextInput,
  List,
  Divider,
  Snackbar,
  Appbar,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';

import { AuthStorage, AppStorage } from '../services/storage';
import { sheetsService } from '../services/googleSheets';

export default function SettingsScreen() {
  const navigation = useNavigation();
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [sheetId, setSheetId] = useState('');
  const [manualSheetId, setManualSheetId] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const email = await AuthStorage.getUserEmail();
    const savedSheetId = await AuthStorage.getSheetId();

    if (email) {
      setIsSignedIn(true);
      setUserEmail(email);
    }
    if (savedSheetId) {
      setSheetId(savedSheetId);
    }
  };

  // For Expo, we use a simplified auth flow
  // In production, integrate @react-native-google-signin/google-signin [^19^]
  const handleSignIn = async () => {
    setLoading(true);
    try {
      // Placeholder for Google Sign-In
      // In production: use GoogleSignin.signIn() from @react-native-google-signin/google-signin
      // For now, manual token entry for testing
      setSnackbar({ 
        visible: true, 
        message: 'Use manual OAuth token entry for testing' 
      });
    } catch (error) {
      setSnackbar({ visible: true, message: 'Sign-in failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSheet = async () => {
    setLoading(true);
    try {
      await sheetsService.initialize();
      const newSheetId = await sheetsService.createSpreadsheet('Expense Tracker');

      if (newSheetId) {
        setSheetId(newSheetId);
        setSnackbar({ visible: true, message: 'Spreadsheet created!' });
      } else {
        setSnackbar({ visible: true, message: 'Failed to create spreadsheet' });
      }
    } catch (error) {
      setSnackbar({ visible: true, message: 'Error: ' + (error as Error).message });
    } finally {
      setLoading(false);
    }
  };

  const handleSetManualSheet = async () => {
    if (!manualSheetId.trim()) return;

    await AuthStorage.saveSheetId(manualSheetId.trim());
    setSheetId(manualSheetId.trim());
    sheetsService.setConfig({ spreadsheetId: manualSheetId.trim() });
    setSnackbar({ visible: true, message: 'Sheet ID saved' });
    setManualSheetId('');
  };

  const handleSignOut = async () => {
    await AuthStorage.clearAuth();
    setIsSignedIn(false);
    setUserEmail('');
    setSheetId('');
    setSnackbar({ visible: true, message: 'Signed out' });
  };

  const handleClearData = async () => {
    await AppStorage.clearAll();
    setSnackbar({ visible: true, message: 'All local data cleared' });
  };

  return (
    <View style={styles.container}>
      <Appbar.Header style={{ backgroundColor: '#6650a4' }}>
        <Appbar.Content title="Settings" color="white" />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Google Account */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Google Sheets Integration
            </Text>
            <Divider style={styles.divider} />

            {isSignedIn ? (
              <>
                <List.Item
                  title={userEmail}
                  description="Signed in"
                  left={props => <List.Icon {...props} icon="account" color="#4CAF50" />}
                />
                <View style={styles.buttonRow}>
                  <Button 
                    mode="contained" 
                    onPress={handleCreateSheet}
                    loading={loading}
                    style={styles.button}
                  >
                    + New Sheet
                  </Button>
                  <Button 
                    mode="outlined" 
                    onPress={handleSignOut}
                    textColor="#E53935"
                    style={styles.button}
                  >
                    Disconnect
                  </Button>
                </View>
              </>
            ) : (
              <Button 
                mode="contained" 
                onPress={handleSignIn}
                loading={loading}
                style={styles.signInButton}
                icon="google"
              >
                Sign in with Google
              </Button>
            )}
          </Card.Content>
        </Card>

        {/* Sheet ID */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Spreadsheet
            </Text>
            <Divider style={styles.divider} />

            {sheetId ? (
              <>
                <Text variant="bodyMedium" style={{ color: '#49454F' }}>
                  Current Sheet ID:
                </Text>
                <Text 
                  variant="bodyMedium" 
                  style={{ fontWeight: '500', marginVertical: 4 }}
                  numberOfLines={1}
                >
                  {sheetId}
                </Text>
                <Button 
                  mode="text" 
                  onPress={() => {
                    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/edit`;
                    // Linking.openURL(url);
                  }}
                >
                  Open in Google Sheets
                </Button>
              </>
            ) : (
              <Text variant="bodyMedium" style={{ color: '#79747E' }}>
                No spreadsheet configured
              </Text>
            )}

            <Divider style={styles.divider} />

            <Text variant="bodySmall" style={{ color: '#49454F', marginBottom: 8 }}>
              Or enter existing Sheet ID:
            </Text>
            <View style={styles.inputRow}>
              <TextInput
                mode="outlined"
                value={manualSheetId}
                onChangeText={setManualSheetId}
                placeholder="Paste Sheet ID here"
                style={styles.input}
              />
              <Button 
                mode="contained" 
                onPress={handleSetManualSheet}
                disabled={!manualSheetId.trim()}
              >
                Save
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* OAuth Token (for testing) */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Developer Options
            </Text>
            <Divider style={styles.divider} />
            <Text variant="bodySmall" style={{ color: '#79747E', marginBottom: 8 }}>
              For testing without Google Sign-In:
            </Text>
            <TextInput
              mode="outlined"
              label="OAuth Access Token"
              placeholder="ya29.a0AfH6SMB..."
              style={styles.input}
              secureTextEntry
            />
            <Button 
              mode="outlined" 
              onPress={async () => {
                // Save token logic here
              }}
              style={{ marginTop: 8 }}
            >
              Save Token
            </Button>
          </Card.Content>
        </Card>

        {/* About */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              About
            </Text>
            <Divider style={styles.divider} />
            <List.Item title="Version" description="1.0.0" />
            <List.Item title="Supported Banks" description="HDFC, Canara, BOB" />
          </Card.Content>
        </Card>

        {/* Danger Zone */}
        <Card style={[styles.card, { borderColor: '#E53935', borderWidth: 1 }]}>
          <Card.Content>
            <Text variant="titleMedium" style={{ color: '#E53935' }}>
              Danger Zone
            </Text>
            <Divider style={styles.divider} />
            <Button 
              mode="outlined" 
              onPress={handleClearData}
              textColor="#E53935"
              style={{ borderColor: '#E53935' }}
            >
              Clear All Local Data
            </Button>
          </Card.Content>
        </Card>
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
    paddingBottom: 32,
  },
  card: {
    marginBottom: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    color: '#6650a4',
    fontWeight: 'bold',
  },
  divider: {
    marginVertical: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
  },
  signInButton: {
    backgroundColor: '#6650a4',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  input: {
    flex: 1,
  },
});
