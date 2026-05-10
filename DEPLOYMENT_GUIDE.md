# Expense Tracker - Complete Deployment Guide

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Google Sheets Integration Deep Dive](#google-sheets-integration)
3. [Expo Deployment Steps](#expo-deployment)
4. [Native Android Deployment](#native-android-deployment)
5. [Data Flow Diagrams](#data-flow-diagrams)
6. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

### Two Deployment Options

| Aspect | Expo (React Native) | Native Android (Kotlin) |
|--------|---------------------|------------------------|
| **SMS Input** | Share from SMS app / Manual paste | Automatic via BroadcastReceiver |
| **Storage** | AsyncStorage + SecureStore | Room Database + EncryptedSharedPreferences |
| **Sync** | Manual button only | Manual + Background WorkManager |
| **Auth** | OAuth REST API | Google Sign-In SDK |
| **Build** | EAS Build / expo-dev-client | Android Studio + Gradle |
| **Distribution** | EAS / TestFlight / APK | Side-load APK only |
| **iOS Support** | ✅ Yes | ❌ No |

---

## Google Sheets Integration

### How Data Saves to Google Sheets

```
Step 1: User Authentication
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────────┐
│   Your Phone    │────▶│  Google OAuth 2.0    │────▶│  Google Account │
│  (Expense App)  │     │  (Sign-In Screen)    │     │  (your@gmail)   │
└─────────────────┘     └──────────────────────┘     └─────────────────┘
         │                       │
         │                       ▼
         │              ┌──────────────────────┐
         │              │   Access Token       │
         │              │   (ya29.a0AfH6S...) │
         │              │   + Refresh Token    │
         │              └──────────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────────────────────────────────┐
│  Token stored in expo-secure-store          │
│  (Hardware encrypted, iOS Keychain /         │
│   Android Keystore) [^8^]                   │
└─────────────────────────────────────────────┘

Step 2: Data Preparation
┌─────────────────────────────────────────────┐
│  Local Transaction (from SMS)               │
│  {                                          │
│    amount: 24.00,                           │
│    merchant: "BMTC BUS KA42F1702",          │
│    date: "2026-04-27",                      │
│    type: "DEBIT",                           │
│    bank: "HDFC",                            │
│    account: "*4819",                        │
│    category: "Transport"                    │
│  }                                          │
└─────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────┐
│  Format as Google Sheets API ValueRange     │
│  {                                          │
│    "values": [                              │
│      ["2026-04-27", "BMTC BUS", "24.00",    │
│       "DEBIT", "BMTC BUS", "HDFC",          │
│       "*4819", "Transport"]               │
│    ]                                        │
│  }                                          │
└─────────────────────────────────────────────┘

Step 3: API Call
┌─────────────────┐     ┌────────────────────────────────────────┐
│   Your Phone    │────▶│  POST                                  │
│  (with token)   │     │  https://sheets.googleapis.com/v4/      │
│                 │     │  spreadsheets/{SPREADSHEET_ID}/       │
│                 │     │  values/Sheet1!A:H:append              │
│                 │     │                                        │
│                 │     │  Headers:                              │
│                 │     │    Authorization: Bearer {token}       │
│                 │     │    Content-Type: application/json       │
│                 │     │                                        │
│                 │     │  Body: {values: [[...]]}               │
└─────────────────┘     └────────────────────────────────────────┘
                                   │
                                   ▼
                          ┌─────────────────┐
                          │  Google Sheets  │
                          │  (Cloud)        │
                          └─────────────────┘

Step 4: Confirmation
┌─────────────────────────────────────────────┐
│  Response: {                                │
│    "updates": {                             │
│      "updatedRows": 1,                      │
│      "updatedColumns": 8                    │
│    }                                        │
│  }                                          │
│                                             │
│  App marks transaction as "synced: true"    │
│  in local storage                           │
└─────────────────────────────────────────────┘
```

### Authentication Methods Comparison

| Method | Best For | Setup | Security |
|--------|----------|-------|----------|
| **OAuth 2.0 (User)** | Personal use, private sheets | Google Cloud Console + SHA-1 fingerprint | High (token refresh) |
| **API Key** | Public/read-only sheets | Enable API in Cloud Console | Low (key in URL) |
| **Service Account** | Server automation | JSON key file | Medium (file-based) |

### Required Google Cloud Setup

1. **Create Project** at https://console.cloud.google.com
2. **Enable APIs**:
   - Google Sheets API
   - Google Drive API (for creating sheets)
3. **Configure OAuth Consent Screen**:
   - Type: External (for testing)
   - App name: "Expense Tracker"
   - Scopes: `https://www.googleapis.com/auth/spreadsheets`
   - Test users: Add your Gmail
4. **Create Credentials**:
   - **For Android**: OAuth 2.0 Client ID (Android type)
     - Package name: `com.yourname.expensetracker`
     - SHA-1: Get from `eas credentials` or `keytool`
   - **For Web** (Expo fallback): OAuth 2.0 Client ID (Web type)
     - Authorized redirect URIs: `https://auth.expo.io/@yourusername/expense-tracker-expo`

---

## Expo Deployment

### Prerequisites
- Node.js 18+ installed
- Expo account (https://expo.dev)
- EAS CLI installed: `npm install -g eas-cli`
- Google Cloud project configured

### Step-by-Step Deployment

```bash
# 1. Install dependencies
cd ExpenseTracker_Expo
npm install

# 2. Login to Expo
eas login

# 3. Configure project (creates eas.json)
eas build:configure

# 4. Get Android credentials (for SHA-1 fingerprint)
eas credentials
# Select: Android > production > Keystore > Download
# Extract SHA-1 from the keystore or EAS dashboard

# 5. Add SHA-1 to Google Cloud Console
# Go to: APIs & Services > Credentials > Your Android OAuth ID
# Add the SHA-1 fingerprint from step 4

# 6. Prebuild (generate native code)
npx expo prebuild --clean

# 7. Build development client (for testing share intents)
eas build --profile development --platform android

# 8. Install on device
# Download APK from EAS dashboard or:
eas build --profile development --platform android --local

# 9. For production release
eas build --profile production --platform android
```

### Important: expo-share-intent Requirements

The `expo-share-intent` library [^20^] requires **native code**, so you **CANNOT** use Expo Go. You must use:

- **Development Build**: `expo-dev-client` + EAS Build
- **Local Build**: `expo run:android` (requires Android Studio)

```bash
# Install expo-dev-client
npx expo install expo-dev-client

# Build custom development client
eas build --profile development --platform android

# Start dev server
npx expo start --dev-client
```

### iOS Deployment (if needed)

```bash
# iOS requires Apple Developer account ($99/year)
# Build via EAS
eas build --profile production --platform ios

# Or local build (requires macOS + Xcode)
expo run:ios
```

---

## Native Android Deployment

### Prerequisites
- Android Studio Hedgehog or newer
- JDK 17
- Android SDK with API 34

### Build Steps

```bash
# 1. Open in Android Studio
# File > Open > ExpenseTracker (native Kotlin project)

# 2. Sync Gradle (first time takes 10-15 min)
# Click "Sync Now" in notification bar

# 3. Get SHA-1 for debug keystore
keytool -list -v   -keystore ~/.android/debug.keystore   -alias androiddebugkey   -storepass android   -keypass android

# 4. Add SHA-1 to Google Cloud Console
# Same as Expo step 5 above

# 5. Build debug APK
./gradlew assembleDebug

# 6. Install on device
adb install app/build/outputs/apk/debug/app-debug.apk

# 7. For release (create signing keystore first)
./gradlew assembleRelease
# Sign with your release keystore
```

### Side-Loading APK

Since SMS permissions are restricted on Play Store, you must side-load:

1. **Enable Developer Options** on phone:
   - Settings > About Phone > Tap "Build Number" 7 times

2. **Enable USB Debugging**:
   - Settings > Developer Options > USB Debugging

3. **Install APK**:
   ```bash
   adb install app-debug.apk
   # OR
   # Transfer APK to phone and tap to install
   ```

4. **Grant SMS Permission**:
   - First launch: Allow SMS permission when prompted
   - If missed: Settings > Apps > Expense Tracker > Permissions > SMS

---

## Data Flow Diagrams

### Complete User Journey (Expo Version)

```
User receives bank SMS
         │
         ▼
┌─────────────────────┐
│  Long-press SMS     │
│  Tap "Share"        │
│  Select "Expense    │
│  Tracker"           │
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│  App opens via      │
│  expo-share-intent  │
│  [^20^]             │
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│  ShareReceiver      │
│  Screen opens with  │
│  SMS text pre-filled│
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│  User taps          │
│  "Parse SMS"        │
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│  Regex Parser runs  │
│  Extracts:          │
│  - Rs.24.00         │
│  - BMTC BUS         │
│  - 27/04/26         │
│  - HDFC *4819       │
│  - Category:        │
│    Transport        │
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│  User reviews &     │
│  taps "Save"        │
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│  Saved to           │
│  AsyncStorage       │
│  (local)            │
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│  Dashboard shows    │
│  new transaction    │
│  with summary       │
│  updated            │
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│  User taps "Sync"   │
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│  Read unsynced      │
│  transactions       │
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│  POST to Google     │
│  Sheets API         │
│  (with OAuth token) │
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│  Mark as synced     │
│  Show success       │
│  message            │
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│  Open Google Sheets │
│  app/web to view    │
│  organized data     │
└─────────────────────┘
```

---

## Troubleshooting

### Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| **App not in share list** | expo-share-intent not configured | Run `expo prebuild` after adding plugin [^20^] |
| **SMS not parsing** | Format doesn't match regex | Share exact SMS text for pattern update |
| **Google auth fails** | Wrong SHA-1 or package name | Verify in Cloud Console credentials |
| **Sync returns 401** | Expired OAuth token | Re-authenticate in Settings |
| **Sync returns 403** | Sheet not shared with user | Check sheet permissions |
| **Build fails** | Native code mismatch | Run `expo prebuild --clean` |
| **Expo Go crashes** | Using native modules | Must use `expo-dev-client` [^20^] |
| **iOS share not working** | App Group not configured | Add `group.com.yourname.expensetracker` |

### Debug Commands

```bash
# Check if app receives share intent
adb shell am start -a android.intent.action.SEND   -t text/plain   -e android.intent.extra.TEXT "Sent Rs.24.00 From HDFC..."   com.yourname.expensetracker

# View app logs
adb logcat | grep "ExpenseTracker"

# Check deep linking
npx uri-scheme open "expensetracker://share?text=Test" --android
```

---

## Security Checklist

- [ ] OAuth tokens stored in `expo-secure-store` (not AsyncStorage) [^8^]
- [ ] No API keys hardcoded in source
- [ ] `android:allowBackup="false"` in manifest
- [ ] `android:dataExtractionRules` excludes financial data
- [ ] HTTPS only for API calls
- [ ] Biometric auth for sensitive screens (optional)
- [ ] App lock with PIN (optional)

---

## Next Steps

1. **Choose your deployment method** (Expo vs Native)
2. **Download the appropriate project**
3. **Follow the setup steps above**
4. **Test with your actual bank SMS**
5. **Share more SMS samples** if parsing fails for other formats

For questions or issues, check:
- Expo docs: https://docs.expo.dev
- Google Sheets API: https://developers.google.com/sheets/api
- expo-share-intent: https://github.com/achorein/expo-share-intent
