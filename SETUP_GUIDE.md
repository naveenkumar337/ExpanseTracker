# Expo Expense Tracker - Setup Guide

## 1. Google Cloud Console Setup

### Create Project
1. Go to https://console.cloud.google.com
2. Create new project: "ExpenseTracker-Expo"
3. Enable APIs:
   - Google Sheets API
   - Google Drive API

### OAuth Consent Screen
1. APIs & Services > OAuth consent screen
2. Choose "External" (for testing)
3. Fill app name: "Expense Tracker"
4. Add test user: your Gmail address

### Create Credentials
1. APIs & Services > Credentials
2. Create Credentials > OAuth client ID
3. For Android:
   - Package name: com.yourname.expensetracker
   - SHA-1: Get from `eas credentials` command
4. For Web application:
   - No restrictions needed for testing

## 2. EAS Build Setup

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure build
eas build:configure

# Get credentials (for SHA-1 fingerprint)
eas credentials

# Build development client (for testing)
eas build --profile development --platform android

# Build APK for distribution
eas build --profile preview --platform android
```

## 3. Running the App

```bash
# Install dependencies
npm install

# Start Expo (for development with expo-dev-client)
npx expo start --dev-client

# Or standard Expo (limited features)
npx expo start
```

## 4. Adding Transactions

Since Expo can't read SMS directly, use these methods:

### Method A: Share from SMS App
1. Open your SMS app
2. Long-press a bank SMS
3. Tap "Share"
4. Select "Expense Tracker"
5. App opens with SMS pre-filled

### Method B: Manual Paste
1. Open Expense Tracker
2. Tap "+" button on Dashboard
3. Paste SMS text
4. Tap "Parse SMS"
5. Review and Save

## 5. Google Sheets Sync

### Option 1: OAuth Sign-In (Recommended)
1. Go to Settings
2. Tap "Sign in with Google"
3. Grant Sheets permission
4. Tap "+ New Sheet" or enter existing ID

### Option 2: API Key (Read-only/Public sheets)
1. Create API Key in Google Cloud Console
2. Enter in Settings > Developer Options
3. Sheet must be "Published to web"

### Option 3: Manual Token (Testing)
1. Get OAuth token from OAuth Playground
2. Paste in Developer Options
3. Use for testing without full auth flow

## 6. Data Storage

| Data Type | Storage | Security |
|-----------|---------|----------|
| Transactions | AsyncStorage | Unencrypted (device only) |
| OAuth Token | SecureStore | Hardware encrypted [^8^] |
| Sheet ID | SecureStore | Hardware encrypted |
| User Email | SecureStore | Hardware encrypted |

## 7. Troubleshooting

| Issue | Solution |
|-------|----------|
| SMS not parsing | Check format matches HDFC/Canara/BOB patterns |
| Google auth fails | Verify SHA-1 fingerprint in Cloud Console |
| Sync fails | Check internet, verify token not expired |
| Duplicate entries | App checks SMS hash before saving |
| Data lost | Backup via Google Sheets sync regularly |

## 8. Architecture

```
User shares/pastes SMS
         ↓
Regex Parser (same patterns as Android native)
         ↓
AsyncStorage (local persistence)
         ↓
Google Sheets REST API (axios)
         ↓
OAuth 2.0 / API Key authentication
```

## 9. Differences from Native Android App

| Feature | Native Android | Expo Version |
|---------|---------------|--------------|
| SMS Reading | Automatic (BroadcastReceiver) | Manual share/paste |
| Background Sync | WorkManager | Manual only |
| Storage | Room Database | AsyncStorage |
| Auth | Google Sign-In SDK | REST API + tokens |
| Distribution | Side-load APK | EAS Build / Expo Go |
| Security | EncryptedSharedPreferences | expo-secure-store |

## 10. Production Checklist

- [ ] Replace placeholder Google Sign-In with @react-native-google-signin/google-signin
- [ ] Add proper error handling and retry logic
- [ ] Implement background sync with expo-background-fetch
- [ ] Add transaction editing and categorization override
- [ ] Export/import functionality
- [ ] Biometric authentication for sensitive data
- [ ] Analytics and crash reporting
