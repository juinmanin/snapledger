# SnapLedger v2.0

A comprehensive expense tracking and tax assistant platform with AI-powered receipt scanning, supporting both personal and business accounting needs.

## 🎯 Overview

SnapLedger helps users automatically categorize expenses, track budgets, and generate financial reports by simply taking a photo of their receipts. The platform uses advanced AI (Google Vision AI) for OCR text extraction and Google Gemini for intelligent expense classification.

## 📱 Mobile App

Complete React Native/Expo mobile application with full internationalization support.

### Features
- 📸 **AI Receipt Scanning**: Camera/gallery integration with OCR and AI classification
- 🌍 **Multi-Language**: Korean (default), English, Malay, Chinese Simplified
- 💰 **Multi-Currency**: KRW, USD, MYR, CNY with locale-aware formatting
- 📊 **Budget Tracking**: Set budgets, get alerts at 80% and 100%
- 📈 **Reports & Analytics**: Visualize spending patterns, category breakdowns
- ☁️ **Google Drive Backup**: One-tap backup and restore
- 📑 **Google Sheets Export**: Export reports to spreadsheets
- 🔐 **Multi-Auth**: Email/Password, Google, Apple, Kakao
- 👤 **Dual Mode**: Switch between Personal and Business accounting

### Quick Start

```bash
cd apps/mobile
npm install
npm start
```

See [Mobile App Documentation](apps/mobile/README.md) for detailed setup and features.

## 🏗️ Project Structure

```
snapledger/
├── apps/
│   └── mobile/          # React Native/Expo mobile app
│       ├── src/
│       │   ├── screens/     # 11 complete screens
│       │   ├── components/  # Reusable UI components
│       │   ├── i18n/        # 4 complete translation files
│       │   ├── navigation/  # React Navigation setup
│       │   ├── services/    # API client
│       │   ├── contexts/    # State management
│       │   ├── utils/       # Locale-aware formatters
│       │   └── types/       # TypeScript definitions
│       └── App.tsx
├── docker-compose.yml   # Infrastructure setup (planned)
└── README.md
```

## 🌐 Internationalization

Full i18n support with 200+ translation keys across 4 languages:
- **Korean (ko)** - Default language
- **English (en)** - Full translations
- **Malay (ms)** - Full translations  
- **Chinese Simplified (zh)** - Full translations

All translations are natural and idiomatic, with locale-aware:
- Currency formatting (symbol placement, grouping)
- Date formatting (full dates, short dates, relative)
- Number formatting (proper separators)

## 🔑 Key Features

### Receipt Scanning
1. Take photo or select from gallery
2. AI extracts merchant, amount, date, items
3. Auto-categorizes with confidence score
4. Edit and confirm before saving

### Budget Management
- Set budgets per category
- Real-time progress tracking
- Visual alerts at 80% and 100%
- Color-coded status indicators

### Reports & Analytics
- Income vs Expense charts
- Category breakdown with percentages
- Custom date range selection
- Export to Google Sheets

### Cloud Integration
- **Google Drive**: Backup/restore app data
- **Google Sheets**: Export formatted reports
- **Google Vision AI**: OCR text extraction
- **Google Gemini**: AI expense classification

## 🛠️ Technology Stack

### Mobile App
- **Framework**: React Native with Expo SDK 50
- **Language**: TypeScript
- **Navigation**: React Navigation v6
- **i18n**: i18next + react-i18next
- **State**: React Context API
- **HTTP**: Axios
- **Storage**: AsyncStorage

### Backend (Planned)
- **Framework**: Node.js + Express / NestJS
- **Database**: PostgreSQL / MongoDB
- **AI/ML**: Google Vision AI, Google Gemini
- **Cloud**: Google Cloud Platform
- **Auth**: OAuth 2.0 (Google, Apple, Kakao)

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- iOS Simulator (Mac) or Android Emulator

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/snapledger.git
cd snapledger

# Install mobile app dependencies
cd apps/mobile
npm install

# Start development server
npm start
```

### Environment Setup

Create `.env` file in `apps/mobile/`:
```env
API_BASE_URL=http://localhost:3000
```

## 📊 Mobile App Statistics

- **Screens**: 11 (Auth, Dashboard, Scan, Transactions, Budget, Reports, Settings)
- **Components**: 3 reusable components
- **Translation Keys**: 200+ across 4 languages
- **API Endpoints**: 20+ with full integration
- **Lines of Code**: 15,000+

## 🎨 Design System

- **Primary Color**: #2196F3 (Blue)
- **Income**: #4CAF50 (Green)
- **Expense**: #F44336 (Red)
- **Warning**: #FF9800 (Orange)
- **Neutral**: #757575 (Gray)

## 📖 Documentation

- [Mobile App README](apps/mobile/README.md) - Setup and features
- [Mobile App Implementation](apps/mobile/IMPLEMENTATION.md) - Complete implementation details
- [Translation Files](apps/mobile/src/i18n/locales/) - All language files

## 🔒 Security

- Token-based authentication
- Secure storage with AsyncStorage
- Automatic 401 handling and logout
- Form validation and input sanitization
- OAuth 2.0 for social login

## 🧪 Testing

```bash
cd apps/mobile
npm test
```

## 📦 Building

### iOS
```bash
expo build:ios
```

### Android
```bash
expo build:android
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

Proprietary - SnapLedger v2.0

## 📧 Support

For issues or questions:
- Email: support@snapledger.com
- Issues: GitHub Issues

## 🗺️ Roadmap

- [x] Mobile app with full i18n support
- [ ] Backend API with Google AI integration
- [ ] Web dashboard
- [ ] Receipt image enhancement
- [ ] Recurring transaction detection
- [ ] Tax report generation
- [ ] Multi-account support
- [ ] Team/family sharing

---

**SnapLedger v2.0** - Your AI-powered financial companion 🚀
