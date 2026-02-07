# SnapLedger Mobile App

React Native mobile application for SnapLedger - Smart receipt management and expense tracking.

## Features

- 📸 Receipt scanning with OCR
- 🤖 AI-powered transaction categorization
- 💰 Income and expense tracking
- 📊 Visual reports and analytics
- 🎯 Budget management
- 🌓 Dark/Light mode support
- 🔐 Secure authentication with JWT

## Tech Stack

- **Framework**: React Native (Expo)
- **UI Library**: React Native Paper (Material Design 3)
- **Navigation**: React Navigation
- **State Management**: Zustand
- **Data Fetching**: React Query
- **API Client**: Axios
- **Charts**: React Native Chart Kit
- **Camera**: Expo Camera
- **Image Picker**: Expo Image Picker
- **Secure Storage**: Expo SecureStore

## Prerequisites

- Node.js 18+
- Expo CLI
- iOS Simulator (for iOS development) or Android Studio (for Android development)

## Installation

1. Install dependencies:
```bash
cd apps/mobile
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Update API URL in `.env`:
```
API_URL=http://your-backend-url/api
```

## Development

### Start the development server:
```bash
npm start
```

### Run on specific platform:
```bash
npm run ios      # iOS
npm run android  # Android
npm run web      # Web
```

## Project Structure

```
apps/mobile/
├── src/
│   ├── api/              # API client and endpoints
│   ├── components/       # Reusable components
│   │   ├── common/       # Common UI components
│   │   └── chart/        # Chart components
│   ├── hooks/            # Custom React hooks
│   ├── navigation/       # Navigation setup
│   ├── screens/          # Screen components
│   │   ├── auth/         # Authentication screens
│   │   ├── dashboard/    # Dashboard screen
│   │   ├── scan/         # Receipt scanning screens
│   │   ├── transactions/ # Transaction screens
│   │   ├── reports/      # Report screens
│   │   ├── budget/       # Budget management
│   │   └── settings/     # Settings screen
│   ├── stores/           # Zustand stores
│   ├── theme/            # Theme configuration
│   └── utils/            # Utility functions
├── App.tsx               # App entry point
├── app.json             # Expo configuration
├── package.json         # Dependencies
└── tsconfig.json        # TypeScript config
```

## Key Features

### Receipt Scanning
- Camera capture with preview
- Gallery image selection
- OCR text extraction
- AI-powered categorization
- Editable transaction details

### Transaction Management
- Manual entry
- Infinite scroll pagination
- Search and filters
- Date grouping
- Category icons

### Reports & Analytics
- Income/expense trends
- Category breakdown
- Pie charts
- Line charts
- Period selection

### Budget Management
- Category budgets
- Progress tracking
- Usage alerts
- Visual indicators

## Environment Variables

- `API_URL`: Backend API base URL

## Building for Production

### iOS
```bash
expo build:ios
```

### Android
```bash
expo build:android
```

## License

MIT
