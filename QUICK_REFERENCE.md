# Quick Reference Card

## File Locations
| File | Purpose |
|------|---------|
| `App.tsx` | Entry point, navigation setup |
| `app.json` | Expo config, plugins, intent filters |
| `eas.json` | Build profiles (dev/preview/production) |
| `src/utils/smsParser.ts` | Regex engine for all banks |
| `src/services/storage.ts` | AsyncStorage + SecureStore |
| `src/services/googleSheets.ts` | REST API client |
| `src/screens/DashboardScreen.tsx` | Home with summaries |
| `src/screens/ShareReceiverScreen.tsx` | SMS paste/parse UI |
| `src/screens/SettingsScreen.tsx` | Google auth config |

## Key Commands
```bash
# Development
npm install
npx expo start --dev-client

# Build
eas build --profile development --platform android
eas build --profile preview --platform android
eas build --profile production --platform android

# Prebuild (generate native code)
npx expo prebuild --clean

# Credentials
eas credentials
```

## Google Cloud Console URLs
- Projects: https://console.cloud.google.com/projectselector2
- APIs: https://console.cloud.google.com/apis/library
- Credentials: https://console.cloud.google.com/apis/credentials
- OAuth Consent: https://console.cloud.google.com/apis/credentials/consent

## Test SMS Samples
```
# HDFC UPI (your sample)
Sent Rs.24.00
From HDFC Bank A/C *4819
To BMTC BUS KA42F1702
On 27/04/26
Ref 102959890220

# Expected output:
# Amount: 24.00, Merchant: BMTC BUS KA42F1702
# Category: Transport, Bank: HDFC, Account: *4819
```
