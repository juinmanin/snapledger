# SnapLedger v3.0 테스트 가이드 (한국어)

이 문서는 SnapLedger v3.0의 새로운 기능들을 테스트하는 방법을 설명합니다.

## 📋 목차

1. [환경 설정](#환경-설정)
2. [조직 기능 테스트](#조직-기능-테스트)
3. [세금 정책 엔진 테스트](#세금-정책-엔진-테스트)
4. [일일 분석 기능 테스트](#일일-분석-기능-테스트)
5. [대량 업로드 테스트](#대량-업로드-테스트)

## 환경 설정

### 필수 요구사항

- Node.js 18+ 및 npm 9+
- Docker & Docker Compose
- PostgreSQL 17 (Docker로 실행)
- Google Cloud 계정 (Vision API, Gemini AI)

### 초기 설정

```bash
# 저장소 클론
git clone https://github.com/juinmanin/snapledger.git
cd snapledger

# 환경 변수 설정
cp .env.example .env
# .env 파일을 편집하여 Google Cloud 자격 증명 입력

# 인프라 시작
docker-compose up -d

# 백엔드 설정
cd apps/server
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev

# 새 터미널에서 모바일 앱 시작
cd apps/mobile
npm install
npm start
```

## 조직 기능 테스트

### 1. 조직 생성

**API 요청:**
```bash
POST http://localhost:3000/api/v1/organizations
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "name": "김씨 가족",
  "type": "HOUSEHOLD",
  "country": "KR",
  "currency": "KRW"
}
```

**예상 결과:**
- 상태 코드: 201
- 응답에 조직 ID와 생성자가 ADMIN 역할로 포함됨

### 2. 멤버 초대

**API 요청:**
```bash
POST http://localhost:3000/api/v1/organizations/{orgId}/members
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "email": "member@example.com",
  "role": "MEMBER",
  "spendingLimit": 1000000
}
```

**예상 결과:**
- 상태 코드: 201
- 이메일로 등록된 사용자가 조직에 추가됨

### 3. 통합 원장 조회

**API 요청:**
```bash
GET http://localhost:3000/api/v1/organizations/{orgId}/ledger?startDate=2026-01-01&endDate=2026-12-31
Authorization: Bearer <your-jwt-token>
```

**예상 결과:**
- 조직의 모든 멤버 거래 내역 조회
- 각 거래에 대한 세금 공제 정보 포함
- 필터링 및 페이지네이션 지원

### 4. 거래 승인/반려 (관리자/회계사)

**승인 요청:**
```bash
PUT http://localhost:3000/api/v1/organizations/{orgId}/ledger/{entryId}/approve
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json

{
  "note": "영수증 확인 완료"
}
```

**반려 요청:**
```bash
PUT http://localhost:3000/api/v1/organizations/{orgId}/ledger/{entryId}/reject
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json

{
  "note": "영수증 불명확, 재제출 요청"
}
```

### 5. 세금 보고서 생성

**API 요청:**
```bash
POST http://localhost:3000/api/v1/organizations/{orgId}/tax-report
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json

{
  "period": "2026-Q1",
  "type": "QUARTERLY"
}
```

**예상 결과:**
- 해당 기간의 소득/지출/공제액 집계
- 예상 세금 및 절세액 계산

## 세금 정책 엔진 테스트

### 1. 지원 국가 목록 조회

**API 요청:**
```bash
GET http://localhost:3000/api/v1/tax/countries
Authorization: Bearer <your-jwt-token>
```

**예상 결과:**
- 한국(KR), 말레이시아(MY), 미국(US), 중국(CN) 정보 포함
- 각 국가의 VAT 정보 및 세금 연도 시작월

### 2. 한국 세금 규칙 조회

**API 요청:**
```bash
GET http://localhost:3000/api/v1/tax/countries/KR/rules
Authorization: Bearer <your-jwt-token>
```

**예상 결과:**
- 의료비 공제 (15%)
- 교육비 공제
- 대중교통 소득공제 (40%)
- 신용카드 소득공제
- 기부금 공제
- 보험료 공제
- 주거비 공제

### 3. 거래 세금 분류

**API 요청:**
```bash
POST http://localhost:3000/api/v1/tax/classify
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "countryId": "KR",
  "merchantName": "서울대학교병원",
  "amount": 50000,
  "category": "MEDICAL",
  "description": "진료비 납부"
}
```

**예상 결과:**
```json
{
  "deductible": true,
  "taxCategory": "MEDICAL",
  "deductionRate": 0.15,
  "matchedRule": {
    "ruleName": "의료비 세액공제",
    "description": "본인, 배우자, 부양가족의 의료비"
  },
  "confidence": 0.95
}
```

### 4. 세금 신고 시즌 조회

**API 요청:**
```bash
GET http://localhost:3000/api/v1/tax/countries/KR/seasons
Authorization: Bearer <your-jwt-token>
```

**예상 결과:**
- 종합소득세 신고 기간 (5월)
- 부가가치세 신고 기간 (1월, 7월)
- 연말정산 기간 정보

## 일일 분석 기능 테스트

### 1. 분석 설정 조회 및 수정

**조회:**
```bash
GET http://localhost:3000/api/v1/analysis/settings
Authorization: Bearer <your-jwt-token>
```

**수정:**
```bash
PUT http://localhost:3000/api/v1/analysis/settings
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "enabled": true,
  "analysisTime": "21:00",
  "messageStyle": "FRIENDLY",
  "checkMeals": true,
  "checkTransport": true,
  "checkDuplicates": true,
  "checkPatterns": true,
  "skipWeekends": false,
  "skipHolidays": true,
  "occupation": "직장인",
  "commuteMethod": "지하철",
  "workType": "OFFICE"
}
```

### 2. 오늘 분석 결과 조회

**API 요청:**
```bash
GET http://localhost:3000/api/v1/analysis/daily
Authorization: Bearer <your-jwt-token>
```

**예상 결과:**
```json
{
  "id": "...",
  "date": "2026-02-07",
  "totalTransactions": 5,
  "totalAmount": 45000,
  "alerts": [
    {
      "type": "MISSING_MEAL",
      "severity": "MEDIUM",
      "message": "오늘 점심 식사 영수증이 없네요. 혹시 대접 받으셨나요? 😄",
      "category": "점심"
    },
    {
      "type": "MISSING_TRANSPORT",
      "severity": "LOW",
      "message": "퇴근 시 교통비가 기록되지 않았어요. 누가 집까지 태워줬나요? 🚗",
      "category": "교통"
    }
  ],
  "taxTips": [
    {
      "category": "대중교통",
      "message": "오늘 대중교통비 5,000원은 40% 소득공제 대상입니다.",
      "savings": 2000
    }
  ],
  "summary": "오늘은 평소보다 지출이 10% 적었습니다. 점심과 저녁을 모두 집에서 드셨나요?"
}
```

### 3. 분석 피드백 제출

**API 요청:**
```bash
POST http://localhost:3000/api/v1/analysis/daily/{analysisId}/feedback
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "alertId": "missing_meal_lunch",
  "action": "MARK_TREATED",
  "note": "회사 식당에서 식사했습니다"
}
```

**예상 결과:**
- 피드백이 저장되어 향후 패턴 학습에 활용됨
- 다음번 분석 시 유사한 상황에서 알림 안 함

### 4. 사용자 패턴 조회

**API 요청:**
```bash
GET http://localhost:3000/api/v1/analysis/patterns
Authorization: Bearer <your-jwt-token>
```

**예상 결과:**
```json
[
  {
    "dayType": "WEEKDAY",
    "avgTransactions": 8.5,
    "avgSpending": 35000,
    "hourlyPattern": [
      {
        "hour": 8,
        "category": "교통",
        "avgAmount": 2500,
        "frequency": 0.95
      },
      {
        "hour": 12,
        "category": "식사",
        "avgAmount": 9000,
        "frequency": 0.85
      }
    ]
  },
  {
    "dayType": "WEEKEND",
    "avgTransactions": 4.2,
    "avgSpending": 55000
  }
]
```

### 5. 수동 분석 실행

**API 요청:**
```bash
POST http://localhost:3000/api/v1/analysis/run
Authorization: Bearer <your-jwt-token>
```

**예상 결과:**
- 즉시 분석 실행
- 분석 결과 반환

## 대량 업로드 테스트

### 1. 배치 업로드 생성

**API 요청 (multipart/form-data):**
```bash
POST http://localhost:3000/api/v1/batch/upload
Authorization: Bearer <your-jwt-token>
Content-Type: multipart/form-data

name: "2025년 하반기 영수증"
files: [file1.jpg, file2.jpg, ... file50.jpg]
```

**예상 결과:**
- 배치 생성 완료
- 각 파일에 대한 BatchUploadItem 생성
- 상태: UPLOADING → PROCESSING

### 2. 배치 목록 조회

**API 요청:**
```bash
GET http://localhost:3000/api/v1/batch
Authorization: Bearer <your-jwt-token>
```

**예상 결과:**
```json
[
  {
    "id": "...",
    "name": "2025년 하반기 영수증",
    "totalCount": 50,
    "processedCount": 45,
    "successCount": 42,
    "failedCount": 3,
    "status": "PROCESSING",
    "startedAt": "2026-02-07T10:00:00Z"
  }
]
```

### 3. 배치 상세 및 항목 조회

**API 요청:**
```bash
GET http://localhost:3000/api/v1/batch/{batchId}
Authorization: Bearer <your-jwt-token>
```

**예상 결과:**
- 배치 정보와 함께 모든 항목 포함
- 각 항목의 AI 추출 결과 및 신뢰도

**항목 목록 조회:**
```bash
GET http://localhost:3000/api/v1/batch/{batchId}/items
Authorization: Bearer <your-jwt-token>
```

### 4. 항목 수정

**API 요청:**
```bash
PUT http://localhost:3000/api/v1/batch/{batchId}/items/{itemId}
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "merchantName": "스타벅스 강남점",
  "amount": 4500,
  "date": "2025-12-15",
  "category": "카페/디저트"
}
```

**예상 결과:**
- 항목 정보 업데이트
- userEdited 플래그 설정

### 5. 항목 개별 승인

**API 요청:**
```bash
POST http://localhost:3000/api/v1/batch/{batchId}/items/{itemId}/approve
Authorization: Bearer <your-jwt-token>
```

**예상 결과:**
- Receipt + Transaction 생성
- 항목 상태: SUCCESS
- userApproved: true

### 6. 전체 일괄 승인

**API 요청:**
```bash
POST http://localhost:3000/api/v1/batch/{batchId}/approve-all
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "minConfidence": 0.8
}
```

**예상 결과:**
- 신뢰도 80% 이상인 항목만 자동 승인
- 낮은 신뢰도 항목은 검토 대기 상태 유지
- 각 승인된 항목에 대해 Receipt + Transaction 생성

### 7. 실패 항목 재시도

**API 요청:**
```bash
POST http://localhost:3000/api/v1/batch/{batchId}/retry-failed
Authorization: Bearer <your-jwt-token>
```

**예상 결과:**
- 실패 상태 항목들 재처리
- 최대 2회 재시도

### 8. 배치 취소

**API 요청:**
```bash
DELETE http://localhost:3000/api/v1/batch/{batchId}
Authorization: Bearer <your-jwt-token>
```

**예상 결과:**
- 배치 상태: CANCELLED
- 미승인 항목들은 삭제됨

## 통합 시나리오 테스트

### 시나리오 1: 가정 회계 관리

1. "김씨 가족" 조직 생성 (HOUSEHOLD)
2. 부모 2명 + 자녀 2명 초대
3. 각 멤버가 일상 지출 기록
4. 월말에 통합 원장 조회 및 승인
5. 분기별 세금 보고서 생성
6. 공제 가능 항목 확인 (교육비, 의료비 등)

### 시나리오 2: 소규모 사업자

1. "ABC 컴퍼니" 조직 생성 (BUSINESS)
2. 회계 담당자 초대 (ACCOUNTANT 역할)
3. 직원들이 비용 처리 요청
4. 회계 담당자가 증빙 확인 후 승인/반려
5. 부가가치세 신고 기간에 VAT 보고서 생성
6. Google Sheets로 내보내기

### 시나리오 3: 과거 기록 일괄 입력

1. 6개월치 영수증 (약 100장) 스캔
2. 배치 업로드 생성
3. AI가 자동으로 처리 (OCR + 분류 + 세금 공제 판별)
4. 신뢰도 높은 항목 (85점 이상) 자동 승인
5. 나머지 항목 수동 검토 후 승인
6. 최종적으로 100건의 거래 기록 생성

## 문제 해결

### 일반적인 오류

**에러: "Organization not found"**
- 원인: 조직 ID가 잘못되었거나 접근 권한이 없음
- 해결: 본인이 속한 조직 ID를 확인

**에러: "Insufficient permissions"**
- 원인: 역할 권한 부족
- 해결: ADMIN 또는 ACCOUNTANT 역할 필요

**에러: "User not found with this email"**
- 원인: 초대할 사용자가 시스템에 등록되지 않음
- 해결: 먼저 사용자 가입 필요

### 로그 확인

```bash
# 백엔드 로그
cd apps/server
npm run dev

# Docker 로그
docker-compose logs -f postgres
docker-compose logs -f redis
docker-compose logs -f minio
```

## 추가 리소스

- [API 문서](http://localhost:3000/api/docs) - Swagger UI
- [Prisma Studio](http://localhost:5555) - 데이터베이스 브라우저
- [MinIO Console](http://localhost:9001) - 스토리지 관리

## 피드백 및 버그 리포트

문제가 발생하거나 개선 아이디어가 있으시면 GitHub Issues에 등록해 주세요:
https://github.com/juinmanin/snapledger/issues
