# SnapLedger v2.0 🧾📱

**AI-powered receipt scanning and autonomous bookkeeping for personal and business use**

SnapLedger is a comprehensive financial management application that combines cutting-edge AI technology with user-friendly mobile interfaces. Scan receipts with your phone, and let AI automatically categorize and record transactions—available in 4 languages!

## ✨ Key Features

### 🤖 AI-Powered Processing
- **Google Gemini 2.5 Flash**: Advanced AI for transaction classification
- **Google Cloud Vision OCR**: High-accuracy text extraction from receipts
- **Tesseract.js Fallback**: Offline OCR capability
- **Auto-categorization**: Intelligent suggestions with confidence scores

### 🌐 Multi-Language Support (i18n)
- **4 Languages**: Korean (한국어), English, Malay (Bahasa Melayu), Chinese (中文)
- **Locale-aware Formatting**: Currency and date display adapts to language
- **Complete Translations**: 200+ translation keys per language
- **Easy Switching**: Change language anytime in Settings

### 🔐 OAuth Social Login
- **Google OAuth**: Full integration with Drive and Sheets
- **Apple Sign In**: Seamless iOS authentication
- **Kakao Login**: Korean market support

### ☁️ Google Cloud Integration
- **Google Sheets Export**: Export with 3 detailed sheets
- **Google Drive Backup**: One-tap backup and restore
- **Cloud Storage**: MinIO (local) or GCS (production)

### 📊 Financial Management
- **Budget Tracking**: Set limits with progress alerts
- **Transaction Management**: Full CRUD with filters
- **Reports & Analytics**: Income/expense analysis
- **Dual Mode**: Personal (가계부) or Business (장부)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm 9+
- Docker & Docker Compose
- Google Cloud account (for Vision API, Gemini)

### Automated Setup (Recommended)
```bash
# Clone the repository
git clone https://github.com/juinmanin/snapledger.git
cd snapledger

# Run the quick-start script
# Linux/Mac:
./quick-start.sh

# Windows:
quick-start.bat
```

### Manual Setup
```bash
# Clone and configure
git clone https://github.com/juinmanin/snapledger.git
cd snapledger
cp .env.example .env
# Edit .env with your credentials

# Start infrastructure
docker-compose up -d

# Install dependencies
npm install

# Backend setup and run
cd apps/server
npm run prisma:generate
npm run prisma:migrate
npm run dev

# Mobile (in new terminal)
cd apps/mobile
npm start
```

Backend: http://localhost:3000 | Docs: http://localhost:3000/api/docs

## 🧪 Testing

For detailed instructions on running and testing the application, see:
- **[TESTING.md](TESTING.md)** - Complete testing guide in English
- **[TESTING_KO.md](TESTING_KO.md)** - 한국어 테스트 가이드

Quick test commands:
```bash
npm test              # Run all tests
npm run lint          # Lint all code
npm run dev:server    # Start backend in dev mode
npm run dev:mobile    # Start mobile app
```

## 📱 Features

- **11 Mobile Screens**: Auth, Dashboard, Scan, Transactions, Budget, Reports, Settings
- **35+ API Endpoints**: Full REST API with Swagger docs
- **42 Backend Services**: NestJS with TypeScript
- **4 Complete Translations**: Natural translations for each language

## 🔧 Tech Stack

**Backend**: NestJS 10, PostgreSQL 17, Prisma ORM, Redis 7, Google Gemini, Google Vision API

**Mobile**: React Native, Expo 50, React Navigation, i18next, Axios

**Infrastructure**: Docker Compose, MinIO, Google Cloud Storage

## 📊 Stats

- Backend: 42 TS files, ~4,500 LOC
- Mobile: 33 TSX files, ~3,100 LOC  
- Translations: 4 languages, 800+ keys total
- Build time: ~2 minutes

## 📄 License

MIT License - see [LICENSE](LICENSE)

---

**Made with ❤️ by the SnapLedger Team**
