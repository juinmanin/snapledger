# SnapLedger Backend Server

Complete NestJS backend for SnapLedger - Receipt OCR Accounting Application

## Features

- 🔐 **Authentication**: JWT-based auth with register/login/refresh
- 👤 **User Management**: Profile management, personal/business mode switching
- 📸 **Receipt Scanning**: OCR processing with Google Vision + Tesseract fallback
- 🤖 **AI Classification**: GPT-4o-mini for intelligent category classification
- 📊 **Transactions**: Full CRUD with filtering, pagination, soft delete
- 📁 **Categories**: 23 default Korean categories + custom user categories
- 💰 **Budgets**: Budget tracking with usage calculations and alerts
- 📈 **Reports**: Income/expense reports and tax summaries
- 🔔 **Notifications**: Budget alerts with cron job (daily at 9 PM)
- 🧾 **Tax Invoices**: Business tax invoice management
- 📚 **Learning System**: User pattern learning for better classification

## Tech Stack

- **Framework**: NestJS 11
- **Database**: PostgreSQL with Prisma ORM
- **Storage**: MinIO/S3 for receipt images
- **OCR**: Google Cloud Vision (primary), Tesseract.js (fallback)
- **AI**: OpenAI GPT-4o-mini
- **Image Processing**: Sharp
- **Queue**: BullMQ with Redis
- **Validation**: class-validator, class-transformer
- **API Docs**: Swagger/OpenAPI

## Setup

### Prerequisites

- Node.js 22+
- PostgreSQL
- Redis
- MinIO (or S3)

### Installation

```bash
# Install dependencies
npm install --legacy-peer-deps

# Copy environment file
cp .env.example .env

# Update .env with your configuration
# DATABASE_URL, JWT_SECRET, MINIO_*, REDIS_*, etc.

# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate:dev

# Seed default categories
npm run prisma:seed
```

### Development

```bash
# Start in development mode
npm run dev

# Start with debug
npm run start:debug
```

### Production

```bash
# Build
npm run build

# Run migrations
npm run prisma:migrate:deploy

# Start
npm run start:prod
```

### Docker

```bash
# Build image
docker build -t snapledger-server .

# Run container
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e JWT_SECRET="..." \
  snapledger-server
```

## API Documentation

When running in development mode, API docs are available at:
- **Swagger UI**: http://localhost:3000/api/docs

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Refresh access token

### Users
- `GET /api/v1/users/profile` - Get profile
- `PUT /api/v1/users/profile` - Update profile
- `PUT /api/v1/users/switch-mode` - Switch personal ↔ business mode

### Receipts (CORE)
- `POST /api/v1/receipts/scan` - Scan receipt (multipart/form-data)
- `GET /api/v1/receipts` - List receipts with filters
- `GET /api/v1/receipts/:id` - Get receipt details
- `PUT /api/v1/receipts/:id/confirm` - Confirm and update receipt
- `DELETE /api/v1/receipts/:id` - Delete receipt

### Transactions
- `POST /api/v1/transactions` - Create transaction
- `GET /api/v1/transactions` - List transactions
- `GET /api/v1/transactions/summary` - Get summary
- `GET /api/v1/transactions/:id` - Get transaction
- `PUT /api/v1/transactions/:id` - Update transaction
- `DELETE /api/v1/transactions/:id` - Soft delete transaction

### Categories
- `POST /api/v1/categories` - Create custom category
- `GET /api/v1/categories` - List categories
- `GET /api/v1/categories/:id` - Get category
- `PUT /api/v1/categories/:id` - Update category
- `DELETE /api/v1/categories/:id` - Delete category

### Budgets
- `POST /api/v1/budgets` - Create budget
- `GET /api/v1/budgets` - List budgets with usage
- `GET /api/v1/budgets/:id` - Get budget
- `PUT /api/v1/budgets/:id` - Update budget
- `DELETE /api/v1/budgets/:id` - Delete budget

### Reports
- `GET /api/v1/reports/income-expense` - Income/expense report
- `GET /api/v1/reports/tax-summary` - Tax summary report

### Notifications
- `GET /api/v1/notifications` - List notifications
- `GET /api/v1/notifications/:id` - Get notification
- `PUT /api/v1/notifications/:id/read` - Mark as read
- `PUT /api/v1/notifications/read-all` - Mark all as read
- `DELETE /api/v1/notifications/:id` - Delete notification

### Tax Invoices
- `POST /api/v1/businesses/:businessId/tax-invoices` - Create tax invoice
- `GET /api/v1/businesses/:businessId/tax-invoices` - List tax invoices
- `GET /api/v1/businesses/:businessId/tax-invoices/:id` - Get tax invoice
- `PUT /api/v1/businesses/:businessId/tax-invoices/:id` - Update tax invoice
- `DELETE /api/v1/businesses/:businessId/tax-invoices/:id` - Delete tax invoice

## Receipt Processing Pipeline

The receipt scanning process follows a 7-stage pipeline:

1. **Image Preprocessing**: Auto-rotate, grayscale, normalize, sharpen
2. **Storage Upload**: Convert to WebP, create thumbnail, upload to MinIO
3. **OCR**: Extract text using Google Vision (or Tesseract fallback)
4. **Structure Parsing**: Parse Korean receipt format (가맹점, 사업자번호, etc.)
5. **AI Classification**: 
   - Check user learning patterns (Levenshtein similarity)
   - Rule-based classification (confidence > 0.9)
   - GPT-4o-mini classification (fallback)
6. **Save Receipt & Items**: Store parsed data and line items
7. **Draft Transaction**: Create unconfirmed transaction (isConfirmed: false)

## Default Categories

23 Korean categories pre-seeded:

**Personal Expenses:**
- 식비, 교통비, 주거비, 통신비, 의류/미용
- 의료/건강, 교육, 문화/여가, 생활용품, 경조사

**Business Expenses (Tax Deductible):**
- 원재료비, 인건비, 임차료, 접대비, 소모품비
- 광고선전비, 운반비, 수수료

**Income:**
- 급여, 용돈, 매출, 이자수입, 기타수입

## Environment Variables

See `.env.example` for all available options.

Key variables:
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret for JWT signing
- `MINIO_*`: MinIO/S3 configuration
- `REDIS_*`: Redis configuration
- `GOOGLE_CLOUD_CREDENTIALS`: Google Cloud Vision API credentials (optional)
- `OPENAI_API_KEY`: OpenAI API key (optional)

## Scheduled Jobs

- **Budget Alert Check**: Runs daily at 21:00 (9 PM)
  - Checks budget thresholds
  - Sends warnings at 80%+ usage
  - Sends exceeded alerts at 100%+ usage

## Security

- Helmet for security headers
- CORS configuration
- JWT authentication
- Rate limiting (60 req/min via Throttler)
- Input validation with class-validator
- SQL injection protection via Prisma

## Response Format

All API responses follow this format:

```json
{
  "statusCode": 200,
  "message": "Success",
  "data": { ... }
}
```

Errors:
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/v1/users/profile",
  "method": "PUT"
}
```

## License

MIT
