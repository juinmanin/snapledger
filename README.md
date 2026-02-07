# SnapLedger v3.0 🧾📱

**AI-powered receipt scanning and autonomous bookkeeping for personal, family, and business use**

SnapLedger is a comprehensive financial management application that combines cutting-edge AI technology with user-friendly mobile interfaces. Scan receipts with your phone, and let AI automatically categorize and record transactions—available in 4 languages! **NEW in v3.0:** Organization-based consolidated ledger, multi-country tax policies, AI daily analysis, and batch upload for historical receipts.

## ✨ Key Features

### 🆕 v3.0 New Features

#### 🏢 Organization Management
- **Multi-User Ledger**: Family or business-wide consolidated bookkeeping
- **Role-Based Access**: ADMIN, ACCOUNTANT, MEMBER roles with permissions
- **Approval Workflows**: Review and approve team expenses
- **Member Spending Limits**: Set budgets per member
- **Duplicate Detection**: Automatically find potential duplicate transactions
- **Tax Reports**: Generate quarterly/yearly tax reports with deduction summaries

#### 🌍 Country-Specific Tax Policies
- **4 Countries Supported**: Korea (KR), Malaysia (MY), USA (US), China (CN)
- **Automatic Classification**: AI matches receipts to tax deduction rules
- **Tax Seasons**: Reminders for filing deadlines
- **Deduction Calculator**: Estimate tax savings in real-time
- **Extensible Rules**: Easy to add new countries and rules

#### 🤖 AI Daily Analysis & Missing Receipt Detection
- **Smart Alerts**: Detects missing meals, transport, regular expenses
- **Pattern Learning**: Learns your spending habits over 30 days
- **Personalized Messages**: Friendly or direct tone options
- **Tax Tips**: Daily suggestions for maximizing deductions
- **User Feedback**: Improves accuracy based on your input

#### 📤 Batch Upload for Historical Receipts
- **Bulk Processing**: Upload up to 50 receipts at once
- **Async Processing**: Queue-based processing with progress tracking
- **AI Review Interface**: Review, edit, and approve extracted data
- **Confidence Scoring**: Auto-approve high-confidence items (>80%)
- **Retry Logic**: Automatically retry failed OCR/classification
- **One-Click Approval**: Approve all verified items instantly

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

**Linux/Mac:**
```bash
git clone https://github.com/juinmanin/snapledger.git
cd snapledger
./quick-start.sh
```

**Windows:**
```bash
git clone https://github.com/juinmanin/snapledger.git
cd snapledger
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

# Backend
cd apps/server
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev

# Mobile (in new terminal)
cd apps/mobile
npm install
npm start
```

Backend: http://localhost:3000 | Docs: http://localhost:3000/api/docs

## 📱 Features

### v3.0 Screens & Endpoints
- **17 Mobile Screens**: Added OrganizationScreen, ConsolidatedLedgerScreen, TaxDashboardScreen, DailyAnalysisScreen, AnalysisSettingsScreen, BatchUploadScreen, CountrySettingsScreen
- **70+ API Endpoints**: Organizations (15), Tax (4), Analysis (7), Batch (9), plus existing endpoints
- **Cron Jobs**: Daily analysis scheduler at user-preferred time
- **Async Processing**: Queue-based batch processing with retry logic

### Existing Features
- **11 Mobile Screens**: Auth, Dashboard, Scan, Transactions, Budget, Reports, Settings
- **35+ API Endpoints**: Full REST API with Swagger docs
- **42 Backend Services**: NestJS with TypeScript
- **4 Complete Translations**: Natural translations for each language

## 🔧 Tech Stack

**Backend**: NestJS 10, PostgreSQL 17, Prisma ORM, Redis 7, Google Gemini, Google Vision API, @nestjs/schedule

**Mobile**: React Native, Expo 50, React Navigation, i18next, Axios

**Infrastructure**: Docker Compose, MinIO, Google Cloud Storage

## 📊 Stats

- Backend: 65+ TS files, ~9,500 LOC
- Mobile: 40+ TSX files, ~4,200 LOC  
- Translations: 4 languages, 1,200+ keys total
- Database: 22 models with complex relations
- Build time: ~3 minutes

## 🧪 Testing

See [TESTING_KO.md](TESTING_KO.md) for comprehensive testing guide in Korean (한국어).

Quick API test examples:
```bash
# Create organization
POST http://localhost:3000/api/v1/organizations
{"name": "Kim Family", "type": "HOUSEHOLD", "country": "KR"}

# Classify transaction for tax
POST http://localhost:3000/api/v1/tax/classify
{"countryId": "KR", "merchantName": "서울대병원", "amount": 50000, "category": "MEDICAL"}

# Get daily analysis
GET http://localhost:3000/api/v1/analysis/daily

# Batch upload receipts
POST http://localhost:3000/api/v1/batch/upload
(multipart/form-data with up to 50 files)
```

## 🌍 Supported Tax Jurisdictions

- **🇰🇷 Korea (KR)**: Medical (15%), Education, Public Transport (40%), Credit Card, Donations, Insurance, Housing
- **🇲🇾 Malaysia (MY)**: Medical Relief (RM10,000), Education (RM7,000), Lifestyle (RM2,500), Life Insurance (RM7,000), Child Care (RM3,000), Parents Medical (RM8,000)
- **🇺🇸 USA (US)**: Medical Expense (AGI 7.5%), Charitable Contributions, Mortgage Interest, Student Loan ($2,500)
- **🇨🇳 China (CN)**: Child Education (¥2,000/月), Continuing Education (¥400/月), Medical (max ¥80,000), Housing Loan (¥1,000/月), Housing Rent, Elderly Support (¥3,000/月)

## 📄 License

MIT License - see [LICENSE](LICENSE)

---

**Made with ❤️ by the SnapLedger Team**
