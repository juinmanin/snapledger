# SnapLedger 테스트 가이드

이 가이드는 SnapLedger 애플리케이션을 실행하고 테스트하는 방법을 설명합니다.

## 목차
- [사전 요구사항](#사전-요구사항)
- [초기 설정](#초기-설정)
- [애플리케이션 실행](#애플리케이션-실행)
- [테스트 실행](#테스트-실행)
- [개별 컴포넌트 테스트](#개별-컴포넌트-테스트)
- [문제 해결](#문제-해결)

## 사전 요구사항

시작하기 전에 다음 항목들이 설치되어 있는지 확인하세요:

- **Node.js**: 버전 18.0.0 이상
- **npm**: 버전 9.0.0 이상
- **Docker**: 최신 버전
- **Docker Compose**: 최신 버전

설치 확인:
```bash
node --version  # 18 이상이어야 함
npm --version   # 9 이상이어야 함
docker --version
docker-compose --version
```

**빠른 환경 확인**: 설정 후 환경을 확인할 수 있습니다:
```bash
./check-env.sh  # 자동화된 환경 검증 실행
```

## 초기 설정

### 1. 저장소 클론
```bash
git clone https://github.com/juinmanin/snapledger.git
cd snapledger
```

### 2. 환경 변수 설정
```bash
# 예제 환경 파일 복사
cp .env.example .env

# .env 파일을 편집하여 인증 정보 추가
# 최소한 다음 항목들을 설정해야 합니다:
# - DATABASE_URL (로컬용 기본값 사용 가능)
# - JWT_SECRET (무작위 문자열로 변경)
# - GOOGLE_AI_API_KEY (Gemini AI 기능용)
# - GOOGLE_APPLICATION_CREDENTIALS (Vision API 및 Cloud Storage용)
```

### 3. 인프라 서비스 시작
Docker Compose를 사용하여 PostgreSQL, Redis, MinIO를 시작합니다:
```bash
docker-compose up -d
```

서비스 실행 확인:
```bash
docker-compose ps
```

모든 서비스가 "healthy" 또는 "running" 상태여야 합니다.

### 4. 의존성 설치
모노레포의 모든 의존성을 설치합니다:
```bash
npm install
```

이 명령은 서버와 모바일 앱의 의존성을 모두 설치합니다.

## 애플리케이션 실행

### 백엔드 서버

#### 개발 모드
```bash
# 방법 1: 루트 디렉토리에서
npm run dev:server

# 방법 2: 서버 디렉토리에서
cd apps/server
npm install  # 아직 실행하지 않았다면
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

서버가 다음 주소에서 시작됩니다:
- API: http://localhost:3000
- API 문서 (Swagger): http://localhost:3000/api/docs

#### 프로덕션 빌드
```bash
cd apps/server
npm run build
npm run start:prod
```

### 모바일 애플리케이션

#### Expo 개발 서버 시작
```bash
# 방법 1: 루트 디렉토리에서
npm run dev:mobile

# 방법 2: 모바일 디렉토리에서
cd apps/mobile
npm install  # 아직 실행하지 않았다면
npm start
```

시작 후 다음을 수행할 수 있습니다:
- `a` 키를 눌러 Android 에뮬레이터에서 열기
- `i` 키를 눌러 iOS 시뮬레이터에서 열기
- 실제 기기의 Expo Go 앱으로 QR 코드 스캔
- `w` 키를 눌러 웹 브라우저에서 열기

## 테스트 실행

### 모든 테스트 실행
루트 디렉토리에서:
```bash
npm test
```

이 명령은 모든 워크스페이스(서버와 모바일)의 테스트를 실행합니다.

### 백엔드 테스트

#### 모든 백엔드 테스트 실행
```bash
cd apps/server
npm test
```

#### Watch 모드로 테스트 실행
```bash
cd apps/server
npm run test:watch
```

#### 커버리지와 함께 테스트 실행
```bash
cd apps/server
npm run test:cov
```

커버리지 보고서는 `apps/server/coverage/`에 생성됩니다.

#### 특정 테스트 파일 실행
```bash
cd apps/server
npm test -- <테스트-파일-이름>

# 예시:
npm test -- auth.service.spec.ts
```

### 린팅

#### 모든 코드 린트
```bash
npm run lint
```

#### 서버 코드만 린트
```bash
cd apps/server
npm run lint
```

#### 코드 포맷팅
```bash
cd apps/server
npm run format
```

## 개별 컴포넌트 테스트

### 1. 데이터베이스 연결 테스트
```bash
cd apps/server
npm run prisma:studio
```

Prisma Studio가 http://localhost:5555 에서 열리며, 여기서 데이터베이스 레코드를 보고 편집할 수 있습니다.

### 2. API 엔드포인트 테스트

#### Swagger UI 사용
1. 백엔드 서버 시작
2. http://localhost:3000/api/docs 열기
3. 대화형 API 문서를 사용하여 엔드포인트 테스트

#### curl 사용
```bash
# 헬스 체크
curl http://localhost:3000/api/v1/health

# 사용자 등록
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'
```

### 3. MinIO 스토리지 테스트
MinIO 콘솔 접속:
- URL: http://localhost:9001
- 사용자명: `minioadmin`
- 비밀번호: `minioadmin123`

### 4. 데이터베이스 테스트
PostgreSQL 연결:
```bash
docker exec -it snapledger-postgres psql -U snapledger -d snapledger
```

일반적인 쿼리:
```sql
-- 모든 테이블 목록
\dt

-- 사용자 수 확인
SELECT COUNT(*) FROM "User";

-- 최근 거래 내역 보기
SELECT * FROM "Transaction" ORDER BY "createdAt" DESC LIMIT 10;

-- 종료
\q
```

### 5. Redis 테스트
Redis 연결:
```bash
docker exec -it snapledger-redis redis-cli

# 테스트 명령
PING
KEYS *
exit
```

## 특정 기능 테스트

### AI 영수증 처리
1. `.env` 파일에 `GOOGLE_AI_API_KEY`와 `GOOGLE_APPLICATION_CREDENTIALS`가 설정되어 있는지 확인
2. 백엔드 서버 시작
3. 모바일 앱 또는 API를 사용하여 영수증 이미지 업로드
4. AI 생성 카테고리 분류 응답 확인

### Google OAuth
1. `.env`에서 OAuth 인증 정보 설정:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_CALLBACK_URL`
2. 서버 시작
3. http://localhost:3000/api/v1/auth/google 로 이동
4. OAuth 플로우 완료

### 다국어 지원
1. 모바일 앱 시작
2. 설정으로 이동
3. 언어 변경 (한국어, 영어, 말레이어, 중국어)
4. 모든 UI 요소가 번역되었는지 확인

## 문제 해결

### 포트가 이미 사용 중인 경우
포트 오류가 발생하면:
```bash
# 포트를 사용 중인 프로세스 확인
lsof -i :3000  # 백엔드용
lsof -i :8081  # 모바일용

# 프로세스 종료 또는 .env에서 포트 변경
```

### 데이터베이스 연결 문제
```bash
# PostgreSQL 재시작
docker-compose restart postgres

# 로그 확인
docker-compose logs postgres

# 데이터베이스 리셋 (경고: 모든 데이터 삭제됨)
cd apps/server
npm run prisma:migrate reset
```

### Docker 문제
```bash
# 모든 컨테이너 중지
docker-compose down

# 볼륨 제거 (경고: 모든 데이터 삭제됨)
docker-compose down -v

# 모두 재시작
docker-compose up -d
```

### 클린 설치
의존성 문제가 발생하면:
```bash
# 모든 node_modules와 lock 파일 제거
rm -rf node_modules apps/*/node_modules package-lock.json

# 재설치
npm install
```

### Prisma 문제
```bash
cd apps/server

# Prisma 클라이언트 재생성
npm run prisma:generate

# 마이그레이션 적용
npm run prisma:migrate

# 데이터베이스 리셋 (경고: 모든 데이터 삭제됨)
npm run prisma:migrate reset
```

## 환경별 테스트

### 개발 환경
- 스토리지에 MinIO 사용 (로컬)
- 로컬 PostgreSQL 데이터베이스 사용
- 백엔드와 모바일 모두 핫 리로드 활성화

### 프로덕션 유사 테스트
```bash
# 백엔드를 프로덕션 모드로 빌드 및 실행
cd apps/server
npm run build
NODE_ENV=production npm run start:prod

# Google Cloud Storage 테스트를 위해 .env에서 STORAGE_PROVIDER=gcs 설정
```

## 지속적 통합

이 프로젝트는 CI/CD를 위해 npm 스크립트를 사용합니다:
```bash
# 모든 체크 실행
npm run lint
npm test
npm run build:server
```

## 추가 리소스

- [NestJS 테스팅 문서](https://docs.nestjs.com/fundamentals/testing)
- [Expo 테스팅 가이드](https://docs.expo.dev/develop/unit-testing/)
- [Prisma Studio](https://www.prisma.io/studio)
- [Swagger/OpenAPI 문서](http://localhost:3000/api/docs)

## 빠른 참조

### 일반적인 명령어
```bash
# 모든 것 시작
docker-compose up -d && npm run dev:server

# 테스트 실행
npm test

# 코드 린트
npm run lint

# 데이터베이스 보기
cd apps/server && npm run prisma:studio

# 로그 보기
docker-compose logs -f

# 모든 것 중지
docker-compose down
```

### 기본 URL
- 백엔드 API: http://localhost:3000
- API 문서: http://localhost:3000/api/docs
- Prisma Studio: http://localhost:5555
- MinIO 콘솔: http://localhost:9001
- 모바일 앱: http://localhost:8081 (또는 Expo DevTools)

### 기본 인증 정보
- **PostgreSQL**: snapledger / password
- **MinIO**: minioadmin / minioadmin123
- **Redis**: 인증 없음 (로컬 개발)
