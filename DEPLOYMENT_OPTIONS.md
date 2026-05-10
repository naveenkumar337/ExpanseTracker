
# Expense Tracker - Deployment Options Comparison

## Option 1: Native Android (Kotlin + Android Studio)
**Best for:** Full automation, power users, side-loading

### Pros
- ✅ Automatic SMS reading via BroadcastReceiver
- ✅ Real-time transaction capture
- ✅ Background sync with WorkManager
- ✅ Room database (SQL, fast queries)
- ✅ Full Google Sign-In SDK integration
- ✅ No dependency on Expo/EAS

### Cons
- ❌ Cannot publish to Play Store (SMS permission restriction)
- ❌ Must side-load APK
- ❌ Only Android
- ❌ Longer build setup

### Build Command
```bash
./gradlew assembleDebug
adb install app/build/outputs/apk/debug/app-debug.apk
```

---

## Option 2: Expo (React Native + EAS Build)
**Best for:** Cross-platform, easier deployment, iOS support

### Pros
- ✅ Works on iOS and Android
- ✅ Easier to build and deploy
- ✅ Can use Expo Go for quick testing
- ✅ EAS Build for production APK/AAB
- ✅ Share intent integration (manual SMS import)
- ✅ Same Google Sheets API integration

### Cons
- ❌ Cannot auto-read SMS (Expo limitation)
- ❌ Must manually share/paste each SMS
- ❌ Requires EAS Build for native features
- ❌ AsyncStorage instead of Room (simpler but less powerful)

### Build Commands
```bash
# Development
npx expo start --dev-client

# Build APK via EAS
eas build --profile preview --platform android

# Build for stores
eas build --profile production --platform android
```

---

## Google Sheets Integration - How It Works

### Authentication Methods

| Method | Use Case | Setup Complexity |
|--------|----------|-----------------|
| **OAuth 2.0** | Private sheets, full CRUD | High (Cloud Console + SHA-1) |
| **API Key** | Public/read-only sheets | Low (just enable API) |
| **Service Account** | Server-to-server | Medium (JSON key file) |

### Data Flow
```
1. User shares/pastes bank SMS
         ↓
2. Regex parser extracts:
   - Amount (Rs.24.00)
   - Merchant (BMTC BUS)
   - Date (27/04/26)
   - Bank (HDFC)
   - Account (*4819)
         ↓
3. Auto-categorize ("Transport")
         ↓
4. Save to local storage
         ↓
5. User taps "Sync"
         ↓
6. POST to Google Sheets API:
   POST https://sheets.googleapis.com/v4/spreadsheets/{ID}/values/Sheet1!A:H:append
   Body: { values: [["2026-04-27", "BMTC BUS", "24.00", "DEBIT", ...]] }
         ↓
7. Mark as synced locally
```

### Sheet Format
| Date | Purpose | Amount | Type | Paid For | Bank Name | Account/Card | Category |
|------|---------|--------|------|----------|-----------|--------------|----------|
| 2026-04-27 | BMTC BUS KA42F1702 | 24.00 | DEBIT | BMTC BUS KA42F1702 | HDFC | *4819 | Transport |
| 2026-04-26 | SWIGGY | 450.00 | DEBIT | SWIGGY | HDFC | *4819 | Food & Dining |

---

## Recommended Approach

### For Personal Use (Android only)
→ Use **Native Android** version
- Full automation
- Real-time SMS capture
- No manual steps needed

### For Cross-Platform / Sharing
→ Use **Expo** version
- iOS support
- Easier to share with family
- Can build via EAS without Android Studio

### Hybrid Workflow
1. Use Native Android for daily automatic tracking
2. Sync to Google Sheets
3. View/manage data in Google Sheets web/app
4. Share sheet with family members

---

## Security Notes

- **Never** hardcode API keys in source code
- Use `expo-secure-store` for tokens (hardware encrypted) [^8^]
- Google Cloud OAuth requires SHA-1 fingerprint of signing key
- For side-load: use debug keystore SHA-1
- For production: use release keystore SHA-1

---

## Next Steps

1. Choose your deployment method
2. Download the appropriate project
3. Follow SETUP_GUIDE.md for Google Cloud configuration
4. Build and install on your device
5. Test with your actual bank SMS
6. Share more SMS samples if parsing fails
