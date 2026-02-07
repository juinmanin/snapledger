# SnapLedger Server v2.0

AI-powered receipt scanning and autonomous bookkeeping backend server built with NestJS.

## Features

- 🔐 **Multi-provider OAuth Authentication** (Google, Apple, Kakao)
- 📸 **Intelligent Receipt Processing** 
  - Google Cloud Vision API + Tesseract.js fallback OCR
  - Google Gemini 2.5 Flash AI classification
- 💾 **Flexible Storage** (MinIO S3-compatible or Google Cloud Storage)
- 📊 **Financial Management**
  - Transaction tracking
  - Budget management
  - Category organization
- 📈 **Reports & Analytics**
  - Financial summaries
  - Cash flow analysis
  - Spending trends
- ☁️ **Google Integrations**
  - Export to Google Sheets
  - Backup to Google Drive
  - Auto-restore capabilities

## Tech Stack

- **Framework**: NestJS 10
- **Database**: PostgreSQL with Prisma ORM
- **AI Services**: 
  - Google Gemini 2.5 Flash (classification)
  - Google Cloud Vision (OCR)
  - Tesseract.js (OCR fallback)
- **Storage**: MinIO or Google Cloud Storage
- **Authentication**: Passport.js with JWT
- **API Documentation**: Swagger/OpenAPI

## Prerequisites

- Node.js >= 18.0.0
- PostgreSQL database
- MinIO instance OR Google Cloud Storage account
- Google AI API key (for Gemini)
- Google Cloud credentials (for Vision API)

## Installation

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate
```

## Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

### Required Environment Variables

- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `GOOGLE_AI_API_KEY`: Google Gemini API key
- `STORAGE_PROVIDER`: `minio` or `gcs`

### Storage Configuration

**For MinIO:**
```env
STORAGE_PROVIDER=minio
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=snapledger
```

**For Google Cloud Storage:**
```env
STORAGE_PROVIDER=gcs
GCS_BUCKET=snapledger-receipts
GCS_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=./credentials/gcp-key.json
```

### OAuth Configuration

Configure OAuth providers in `.env`:

```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

APPLE_CLIENT_ID=your-apple-client-id
APPLE_TEAM_ID=your-team-id
APPLE_KEY_ID=your-key-id
APPLE_PRIVATE_KEY=your-private-key

KAKAO_CLIENT_ID=your-kakao-client-id
KAKAO_CLIENT_SECRET=your-kakao-client-secret
```

## Development

```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Run production server
npm run start:prod

# Run Prisma Studio (database GUI)
npm run prisma:studio
```

## API Documentation

Once the server is running, visit:

```
http://localhost:3000/api/docs
```

Interactive Swagger UI documentation is available at this endpoint.

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login with credentials
- `GET /api/v1/auth/google` - Google OAuth
- `GET /api/v1/auth/apple` - Apple OAuth
- `GET /api/v1/auth/kakao` - Kakao OAuth

### Receipts
- `POST /api/v1/receipts/upload` - Upload and process receipt
- `GET /api/v1/receipts` - List all receipts
- `GET /api/v1/receipts/:id` - Get receipt details

### Transactions
- `POST /api/v1/transactions` - Create transaction
- `GET /api/v1/transactions` - List transactions
- `GET /api/v1/transactions/:id` - Get transaction
- `PUT /api/v1/transactions/:id` - Update transaction
- `DELETE /api/v1/transactions/:id` - Delete transaction
- `GET /api/v1/transactions/statistics` - Get statistics

### Budgets
- `POST /api/v1/budgets` - Create budget
- `GET /api/v1/budgets` - List budgets
- `GET /api/v1/budgets/progress` - Get budget progress
- `PUT /api/v1/budgets/:id` - Update budget
- `DELETE /api/v1/budgets/:id` - Delete budget

### Categories
- `POST /api/v1/categories` - Create category
- `POST /api/v1/categories/initialize` - Initialize default categories
- `GET /api/v1/categories` - List categories
- `PUT /api/v1/categories/:id` - Update category
- `DELETE /api/v1/categories/:id` - Delete category

### Reports
- `GET /api/v1/reports/summary` - Financial summary
- `GET /api/v1/reports/cash-flow` - Cash flow report
- `GET /api/v1/reports/spending-trends` - Spending trends
- `POST /api/v1/reports/export/google-sheets` - Export to Sheets
- `POST /api/v1/backup/google-drive` - Backup to Drive
- `GET /api/v1/backup/google-drive` - List backups
- `POST /api/v1/backup/google-drive/:fileId/restore` - Restore backup

## Architecture

```
src/
├── main.ts                    # Application entry point
├── app.module.ts              # Root module
├── common/                    # Shared resources
│   ├── config/               # Configuration
│   ├── guards/               # Auth guards
│   ├── decorators/           # Custom decorators
│   └── services/             # Storage services
├── auth/                      # Authentication module
├── receipts/                  # Receipt processing module
│   └── services/             # OCR, AI classifier
├── transactions/              # Transaction management
├── budgets/                   # Budget management
├── categories/                # Category management
├── reports/                   # Reports & analytics
├── integrations/              # External integrations
│   ├── google-sheets.service.ts
│   └── google-drive.service.ts
└── prisma/                    # Database service
```

## Receipt Processing Flow

1. **Upload**: User uploads receipt image
2. **Storage**: Image saved to MinIO/GCS
3. **OCR**: Text extracted via Google Vision (or Tesseract fallback)
4. **AI Classification**: Google Gemini 2.5 Flash analyzes OCR text
5. **Data Extraction**: Merchant, amount, date, category extracted
6. **Auto-Transaction**: If confidence > 70%, transaction auto-created
7. **Manual Review**: Lower confidence receipts flagged for review

## Google Gemini Integration

The AI classifier uses Google Gemini 2.5 Flash for:
- Transaction classification
- Merchant name extraction
- Amount and date parsing
- Category suggestion
- Confidence scoring

Model configuration:
```typescript
model: 'gemini-2.5-flash'
temperature: 0.1
responseMimeType: 'application/json'
```

## Testing

```bash
# Run unit tests
npm run test

# Run e2e tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Docker Support

Use the included `docker-compose.yml` in the root directory to run:
- PostgreSQL database
- MinIO storage
- Redis cache

```bash
docker-compose up -d
```

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.
