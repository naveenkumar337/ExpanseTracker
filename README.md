# Expense Tracker - Expo Edition

## Overview
Cross-platform expense tracking app built with Expo and React Native. Tracks bank transactions by importing SMS messages and syncing to Google Sheets.

## Key Features
- **Manual SMS Import**: Share from SMS app or paste text directly
- **Smart Parsing**: Regex-based extraction for HDFC, Canara, BOB
- **Auto-Categorization**: 40+ merchant keywords → 9 categories
- **Google Sheets Sync**: OAuth 2.0 or API Key authentication
- **Offline Storage**: AsyncStorage for transactions, SecureStore for auth
- **Expense Analytics**: Weekly/monthly summaries with net calculation

## Tech Stack
- React Native 0.74 + Expo SDK 51
- TypeScript
- React Navigation (Bottom Tabs + Stack)
- React Native Paper (Material Design 3)
- Axios (Google Sheets REST API)
- expo-secure-store (Encrypted auth tokens)
- expo-linking (Share intent handling)

## Project Structure
```
ExpenseTracker_Expo/
├── App.tsx                    # Entry point with deep linking
├── app.json                   # Expo config with intent filters
├── eas.json                   # EAS build profiles
├── package.json               # Dependencies
├── src/
│   ├── screens/
│   │   ├── DashboardScreen.tsx      # Home with summaries
│   │   ├── TransactionsScreen.tsx   # Full transaction list
│   │   ├── SettingsScreen.tsx       # Google auth & config
│   │   └── ShareReceiverScreen.tsx  # SMS paste/parse UI
│   ├── services/
│   │   ├── storage.ts              # AsyncStorage + SecureStore
│   │   └── googleSheets.ts         # Sheets API REST client
│   ├── utils/
│   │   └── smsParser.ts            # Regex parser engine
│   └── hooks/
│       └── useShareIntent.ts       # Deep link handler
```

## Quick Start

### 1. Install Dependencies
```bash
cd ExpenseTracker_Expo
npm install
```

### 2. Configure Google Cloud
1. Create project at https://console.cloud.google.com
2. Enable Google Sheets API
3. Create OAuth 2.0 credentials (Android + Web)
4. Add your SHA-1 fingerprint from `eas credentials`

### 3. Build & Run
```bash
# Development (requires expo-dev-client)
npx expo start --dev-client

# Or standard Expo
npx expo start

# Build APK via EAS
eas build --profile preview --platform android
```

## Using the App

### Adding Transactions
**Method 1 - Share from SMS:**
1. Open your SMS app
2. Long-press a bank SMS
3. Tap "Share" → Select "Expense Tracker"
4. App opens with SMS pre-filled

**Method 2 - Manual:**
1. Tap "+" on Dashboard
2. Paste SMS text
3. Tap "Parse SMS"
4. Review extracted data
5. Tap "Save Transaction"

### Syncing to Google Sheets
1. Go to Settings
2. Enter OAuth token or sign in with Google
3. Create new spreadsheet or enter existing ID
4. Tap "Sync" on Dashboard
5. Check Google Sheets for your data

## Google Sheets Format
| Date | Purpose | Amount | Type | Paid For | Bank Name | Account/Card | Category |
|------|---------|--------|------|----------|-----------|--------------|----------|
| 2026-04-27 | BMTC BUS KA42F1702 | 24.00 | DEBIT | BMTC BUS KA42F1702 | HDFC | *4819 | Transport |

## Security
- OAuth tokens stored in `expo-secure-store` (hardware encrypted)
- Transaction data in `AsyncStorage` (device-only)
- No data sent to any server except Google Sheets API

## Limitations vs Native Android
| Feature | Expo | Native |
|---------|------|--------|
| Auto SMS read | ❌ Manual only | ✅ Automatic |
| Background sync | ❌ Manual only | ✅ WorkManager |
| Storage | AsyncStorage | Room SQL |
| Distribution | EAS / Expo | Side-load APK |
| iOS support | ✅ Yes | ❌ No |

## Troubleshooting
| Issue | Solution |
|-------|----------|
| SMS not parsing | Check format matches supported banks |
| Google auth error | Verify SHA-1 in Cloud Console |
| Sync fails | Check token validity, internet connection |
| App not in share list | Rebuild with `expo prebuild` |

## License
Personal use only.
