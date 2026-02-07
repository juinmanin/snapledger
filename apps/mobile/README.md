# SnapLedger Mobile App v2.0

A React Native/Expo mobile application for personal and business expense tracking with AI-powered receipt scanning and multi-language support.

## Features

- 📸 **Receipt Scanning**: Take photos or select from gallery with AI-powered OCR
- 💰 **Multi-Currency Support**: KRW, USD, MYR, CNY
- 🌍 **i18n Support**: Korean (default), English, Malay, Chinese Simplified
- 📊 **Budget Tracking**: Set and monitor budgets with alerts
- 📈 **Reports & Analytics**: Visualize spending patterns
- ☁️ **Google Drive Backup**: Automatic backup and restore
- 📑 **Google Sheets Export**: Export reports directly to Google Sheets
- 🔐 **Multi-Auth**: Email/Password, Google, Apple, Kakao
- 👤 **Personal/Business Modes**: Switch between personal and business accounting

## Tech Stack

- **Framework**: React Native with Expo SDK 50
- **Navigation**: React Navigation v6
- **Internationalization**: i18next + react-i18next
- **State Management**: Context API
- **API Client**: Axios
- **Storage**: AsyncStorage
- **Camera**: expo-camera, expo-image-picker

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- iOS Simulator (Mac) or Android Emulator

### Installation

```bash
cd apps/mobile
npm install
```

### Running the App

```bash
# Start Expo development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android

# Run on web
npm run web
```

## Project Structure

```
apps/mobile/
├── App.tsx                 # Main app entry point
├── src/
│   ├── navigation/         # React Navigation setup
│   ├── i18n/              # i18next configuration & translations
│   │   └── locales/       # ko.json, en.json, ms.json, zh.json
│   ├── screens/           # All screen components
│   │   ├── auth/          # Login & Register
│   │   ├── DashboardScreen.tsx
│   │   ├── ScanReceiptScreen.tsx
│   │   ├── TransactionListScreen.tsx
│   │   ├── TransactionDetailScreen.tsx
│   │   ├── BudgetScreen.tsx
│   │   ├── ReportScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── components/        # Reusable components
│   ├── services/          # API client
│   ├── contexts/          # React Context providers
│   ├── utils/             # Helper functions
│   └── types/             # TypeScript type definitions
```

## Language Support

All UI text uses the `t()` function from react-i18next. Translation keys are organized by feature:

- `common.*` - Common UI elements
- `auth.*` - Authentication screens
- `dashboard.*` - Dashboard content
- `scan.*` - Receipt scanning
- `transactions.*` - Transaction management
- `budget.*` - Budget tracking
- `reports.*` - Reports & analytics
- `settings.*` - Settings screen
- `categories.*` - Expense categories
- `languages.*` - Language names
- `currencies.*` - Currency labels

### Switching Languages

Users can change language in Settings screen. The app automatically detects device language on first launch.

```typescript
// Programmatically change language
import { useTranslation } from 'react-i18next';

const { i18n } = useTranslation();
await i18n.changeLanguage('ko'); // or 'en', 'ms', 'zh'
```

## Environment Variables

Create a `.env` file in the mobile app directory:

```env
API_BASE_URL=http://localhost:3000
```

## API Integration

The app connects to the SnapLedger backend API. All API calls are in `src/services/api.ts`:

- **Auth**: `/api/v1/auth/*`
- **Transactions**: `/api/v1/transactions/*`
- **Receipts**: `/api/v1/receipts/*`
- **Budgets**: `/api/v1/budgets/*`
- **Reports**: `/api/v1/reports/*`
- **Backup**: `/api/v1/backup/google-drive/*`

## Features in Detail

### Receipt Scanning
1. Take photo or choose from gallery
2. Upload to backend for OCR processing
3. AI extracts: merchant, amount, date, category
4. User can edit extracted data before saving
5. Confidence score displayed

### Budget Tracking
- Create budgets per category
- Real-time progress tracking
- Alert at 80% and 100% thresholds
- Visual progress bars with color coding

### Google Drive Integration
- One-tap backup to Google Drive
- View backup history
- Restore from any previous backup
- Last backup timestamp displayed

### Google Sheets Export
- Export reports for custom date ranges
- Creates formatted spreadsheet
- Includes category breakdown and totals

## Building for Production

### iOS

```bash
expo build:ios
```

### Android

```bash
expo build:android
```

## Testing

```bash
# Add tests later
npm test
```

## License

Proprietary - SnapLedger v2.0

## Support

For issues or questions, contact: support@snapledger.com
