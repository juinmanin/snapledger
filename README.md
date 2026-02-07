# SnapLedger v1.0

**영수증 자동 인식 회계 도우미 앱** - Intelligent Receipt OCR & AI-Powered Accounting Assistant

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-22.x-green.svg)
![TypeScript](https://img.shields.io/badge/typescript-5.7-blue.svg)

SnapLedger는 스마트폰 카메라로 영수증을 촬영하면 OCR과 AI가 자동으로 내용을 분석하여 개인 가계부와 기업 매출/매입 장부로 자동 기장하는 회계 도우미 애플리케이션입니다.

## 🌟 주요 기능

### 📸 영수증 스캔 & OCR
- **카메라/갤러리**: 영수증 사진 촬영 또는 갤러리에서 선택
- **이미지 전처리**: Sharp를 이용한 자동 회전, 그레이스케일, 대비 강화, 노이즈 제거
- **OCR 처리**: Google Cloud Vision API (primary) + Tesseract.js (fallback)
- **한국어 특화**: 사업자번호(000-00-00000), 가맹점명, 금액, 날짜/시간 자동 인식

### 🤖 AI 자동 분류
- **사용자 학습**: 과거 분류 패턴 분석 (Levenshtein 유사도)
- **규칙 기반**: 커피숍, 식당, 교통 등 일반적인 가맹점 자동 인식
- **GPT-4o-mini**: 복잡한 케이스는 AI가 분석하여 카테고리 제안
- **신뢰도 표시**: 각 분류에 대한 신뢰도(0-1) 제공

### 📊 리포트 & 분석
- **수입/지출 요약**: 기간별 수입/지출 합계 및 순액
- **카테고리 분석**: 카테고리별 지출 내역 및 비율
- **일별 추세**: 수입/지출 일별 변화 추이 차트
- **세금 요약**: 매출/매입 세금계산서, 부가세 납부액, 공제 가능 경비

### 💰 예산 관리
- **예산 설정**: 카테고리별 월/분기/연간 예산 설정
- **실시간 추적**: 예산 대비 사용률 프로그레스 바
- **자동 알림**: 예산 80% 초과 시 알림 (매일 21시 자동 체크)

### 🏢 개인/사업자 모드
- **모드 전환**: 개인 가계부 ↔ 사업자 장부 간편 전환
- **사업체 관리**: 여러 사업체 등록 및 관리
- **세금계산서**: 매출/매입 세금계산서 관리

## 🏗️ 기술 스택

### Backend
- **Framework**: NestJS 11 + TypeScript 5.7
- **Database**: PostgreSQL 17 + Prisma 6
- **Authentication**: JWT + Passport
- **OCR**: Google Cloud Vision API + Tesseract.js
- **AI**: OpenAI GPT-4o-mini
- **Storage**: MinIO (S3-compatible)
- **Queue**: BullMQ + Redis 7
- **Validation**: class-validator + class-transformer
- **Documentation**: Swagger/OpenAPI

### Mobile
- **Framework**: React Native 0.76 + Expo 52
- **UI**: React Native Paper (Material Design 3)
- **Navigation**: React Navigation (Stack + Bottom Tabs)
- **State**: Zustand + React Query
- **API**: Axios with JWT interceptor
- **Charts**: React Native Chart Kit
- **Storage**: Expo SecureStore

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **Node**: 22.x LTS

## 📦 프로젝트 구조

```
snapledger/
├── apps/
│   ├── server/                 # NestJS Backend
│   │   ├── src/
│   │   │   ├── auth/          # JWT 인증
│   │   │   ├── users/         # 사용자 관리
│   │   │   ├── receipts/      # 영수증 처리 (핵심)
│   │   │   ├── transactions/  # 거래 내역
│   │   │   ├── categories/    # 카테고리
│   │   │   ├── budgets/       # 예산
│   │   │   ├── reports/       # 리포트
│   │   │   ├── tax-invoices/  # 세금계산서
│   │   │   ├── notifications/ # 알림
│   │   │   ├── common/        # 공통 유틸리티
│   │   │   └── prisma/        # Prisma 모듈
│   │   ├── prisma/
│   │   │   ├── schema.prisma  # 12개 테이블 스키마
│   │   │   └── seed.ts        # 기본 카테고리 시드
│   │   ├── test/              # 단위 테스트
│   │   └── Dockerfile
│   │
│   └── mobile/                # React Native Mobile
│       ├── src/
│       │   ├── api/          # API 클라이언트
│       │   ├── components/   # 공통/차트 컴포넌트
│       │   ├── hooks/        # React Query 훅
│       │   ├── navigation/   # 네비게이션
│       │   ├── screens/      # 12개 화면
│       │   ├── stores/       # Zustand 스토어
│       │   ├── theme/        # 테마 설정
│       │   └── utils/        # 유틸리티
│       ├── App.tsx
│       └── app.json
│
├── docker-compose.yml         # PostgreSQL + Redis + MinIO
├── .env.example              # 환경 변수 템플릿
└── package.json              # Monorepo 루트
```

## 🚀 빠른 시작

### 사전 요구사항

- Node.js 22.x 이상
- npm 10.x 이상
- Docker & Docker Compose (선택사항)

### 1. 저장소 클론

```bash
git clone https://github.com/juinmanin/snapledger.git
cd snapledger
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 환경 변수 설정

```bash
cp .env.example apps/server/.env
cp .env.example apps/mobile/.env
```

`.env` 파일을 열어 필수 값을 설정하세요:
- `DATABASE_URL`: PostgreSQL 연결 문자열
- `JWT_SECRET`, `JWT_REFRESH_SECRET`: JWT 비밀키
- `GOOGLE_CLOUD_VISION_API_KEY`: Google Vision API 키
- `OPENAI_API_KEY`: OpenAI API 키
- `MINIO_*`: MinIO 설정

### 4. 인프라 실행 (Docker)

```bash
npm run docker:up
```

PostgreSQL, Redis, MinIO가 Docker 컨테이너로 실행됩니다.

### 5. 데이터베이스 설정

```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

### 6. 백엔드 실행

```bash
npm run server:dev
```

서버가 http://localhost:3000 에서 실행됩니다.
- API 문서: http://localhost:3000/api/docs

### 7. 모바일 앱 실행

```bash
npm run mobile:dev
```

Expo 개발 서버가 실행되면 QR 코드를 스캔하거나 시뮬레이터에서 실행하세요.

## 📱 모바일 앱 화면

### 인증
- **로그인**: 이메일/비밀번호 로그인
- **회원가입**: 개인/사업자 선택 가능

### 메인
- **대시보드**: 이번 달 수입/지출 요약, 카테고리 파이 차트, 최근 거래, 예산 진행률
- **스캔**: 카메라 촬영 → OCR 처리 → AI 분류 → 거래 확인
- **거래**: 날짜별 그룹, 필터, 검색, 수동 입력
- **리포트**: 기간 선택, 수입/지출 차트, 카테고리 분석
- **설정**: 프로필, 모드 전환, 사업체 설정, 로그아웃

## 🧪 테스트

### 백엔드 테스트

```bash
cd apps/server
npm run test              # 단위 테스트
npm run test:cov          # 커버리지
npm run test:e2e          # E2E 테스트
```

### 테스트 커버리지
- ✅ Receipt Processor Service
- ✅ AI Classifier Service
- ✅ Reports Service

## 🔒 보안

- ✅ **JWT 인증**: Access token + Refresh token
- ✅ **Helmet**: HTTP 보안 헤더
- ✅ **Rate Limiting**: 60 req/min
- ✅ **Input Validation**: class-validator
- ✅ **CORS**: 설정 가능한 origin
- ✅ **Secure Storage**: 모바일 SecureStore
- ✅ **CodeQL**: 보안 스캔 통과 (0 alerts)

## 📊 데이터베이스 스키마

12개 테이블:
1. **users** - 사용자 계정
2. **businesses** - 사업체 정보
3. **accounts** - 계좌 관리
4. **categories** - 카테고리 (시스템 기본 + 사용자 커스텀)
5. **receipts** - 영수증 데이터
6. **receipt_items** - 영수증 품목
7. **recurring_transactions** - 정기 거래
8. **transactions** - 거래 내역
9. **budgets** - 예산
10. **tax_invoices** - 세금계산서
11. **category_corrections** - 사용자 분류 학습 데이터
12. **notifications** - 알림

## 🎯 핵심 알고리즘

### 영수증 처리 7단계 파이프라인

1. **이미지 전처리**: Sharp를 이용한 품질 향상
2. **S3 업로드**: 원본(WebP 90%) + 썸네일(300x400 70%)
3. **OCR**: Google Vision → Tesseract 폴백
4. **구조화 파싱**: 정규식 기반 한국어 영수증 파싱
5. **AI 분류**: 사용자 패턴 → 규칙 → GPT-4o-mini
6. **데이터 저장**: 영수증 + 품목 DB 저장
7. **Draft 거래 생성**: isConfirmed: false로 생성

### AI 분류 우선순위

1. **사용자 학습** (confidence > 0.9): 과거 동일 가맹점 분류 기록
2. **규칙 기반** (confidence > 0.9): 커피숍, 식당, 교통 등 패턴 매칭
3. **GPT-4o-mini** (temperature 0.1): 복잡한 케이스 AI 분류
4. **폴백** (confidence < 0.5): 기본 카테고리 할당

## 📝 API 문서

백엔드 서버 실행 후 Swagger 문서 확인:
```
http://localhost:3000/api/docs
```

### 주요 엔드포인트

- `POST /api/v1/auth/register` - 회원가입
- `POST /api/v1/auth/login` - 로그인
- `POST /api/v1/receipts/scan` - 영수증 스캔
- `GET /api/v1/receipts` - 영수증 목록
- `POST /api/v1/transactions` - 거래 생성
- `GET /api/v1/reports/income-expense` - 수입/지출 리포트
- `GET /api/v1/reports/tax-summary` - 세금 요약

## 🛠️ 개발

### 디렉터리 구조 규칙

- `entities/`: Prisma 엔티티 타입
- `dto/`: Data Transfer Objects
- `services/`: 비즈니스 로직
- `controllers/`: HTTP 엔드포인트
- `repositories/`: 데이터 액세스 레이어

### 코드 스타일

- **TypeScript**: 모든 코드 TypeScript로 작성
- **Decimal**: 모든 금액은 Decimal(15,2) 사용
- **Snake Case → Camel Case**: Prisma @map으로 변환
- **응답 형식**: `{statusCode, data, message}`
- **에러 처리**: Try/catch + 적절한 HTTP 상태 코드

## 🤝 기여

이슈와 Pull Request를 환영합니다!

## 📄 라이선스

MIT License

## 👨‍💻 개발자

SnapLedger Team

---

**Made with ❤️ using NestJS, React Native, and AI**

