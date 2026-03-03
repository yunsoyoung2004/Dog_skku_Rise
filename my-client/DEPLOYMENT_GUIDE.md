# Dog Grooming Marketplace MVP - 배포 가이드

## 📦 배포 전 체크리스트

### 1. 환경 변수 확인
- [ ] `.env.local` 파일에 Firebase 설정 확인
- [ ] API 엔드포인트 설정 확인
- [ ] 기능 플래그 설정 확인

### 2. Firebase 설정
- [ ] Firestore 보안 규칙 설정
  ```
  // users 컬렉션: 자신의 데이터만 접근 가능
  match /users/{userId} {
    allow read, write: if request.auth.uid == userId;
  }
  
  // dogs 컬렉션: users의 서브컬렉션
  match /users/{userId}/dogs/{dogId} {
    allow read, write: if request.auth.uid == userId;
  }
  ```
- [ ] Firebase 인증 설정
  - [ ] 이메일/비밀번호 인증 활성화
  - [ ] 구글 로그인 (선택사항)
- [ ] Firebase Storage 설정
  - [ ] 이미지 저장 경로 설정
  - [ ] 파일 크기 제한 설정

### 3. 성능 최적화
- [ ] 번들 크기 분석
  ```bash
  npm run build -- --mode analyze
  ```
- [ ] Lighthouse 성능 점수 확인 (목표: 90+)
- [ ] 이미지 최적화 확인

### 4. 보안
- [ ] XSS 방지 확인
- [ ] CSRF 토큰 확인
- [ ] 민감한 데이터 암호화 확인
- [ ] API 레이트 제한 설정

### 5. 테스트
- [ ] 단위 테스트 실행
  ```bash
  npm run test
  ```
- [ ] E2E 테스트 실행
  ```bash
  npm run test:e2e
  ```
- [ ] 크로스 브라우저 테스트
  - [ ] Chrome
  - [ ] Safari
  - [ ] Firefox
  - [ ] Edge
  - [ ] 모바일 Safari/Chrome

### 6. 배포
- [ ] 빌드 생성
  ```bash
  npm run build
  ```
- [ ] 빌드 결과물 확인
  - [ ] dist/ 디렉토리 생성 확인
  - [ ] 파일 크기 확인
- [ ] 배포 플랫폼 선택
  - [ ] Vercel (권장)
  - [ ] Netlify
  - [ ] GitHub Pages
  - [ ] AWS S3 + CloudFront

### 7. 배포 후
- [ ] DNS 설정 확인
- [ ] HTTPS 설정 확인
- [ ] 모니터링 설정
  - [ ] 에러 로깅 (Sentry)
  - [ ] 성능 모니터링 (Google Analytics)
- [ ] 기능 테스트
  - [ ] 사용자 회원가입
  - [ ] 로그인/로그아웃
  - [ ] 강아지 등록
  - [ ] 디자이너 검색
  - [ ] 예약 및 결제

## 📌 주요 구현 상태

### ✅ 완료된 기능
- [x] 회원가입/로그인
- [x] 강아지 관리 (CRUD)
- [x] 디자이너 검색 및 즐겨찾기
- [x] 미용 예약 시스템
- [x] 결제 시뮬레이션
- [x] 실시간 채팅
- [x] 후기 작성
- [x] 마이페이지 (계정 관리, 미용 내역)

### ⏳ 준비 중 기능
- [ ] Firebase Storage 이미지 업로드
- [ ] 결제 게이트웨이 통합 (Stripe/KG이니시스)
- [ ] 푸시 알림
- [ ] 디자이너 대시보드

### 🔄 향후 계획
- [ ] 모바일 앱 (React Native)
- [ ] 백엔드 API 개발 (Node.js/Express)
- [ ] 비용 최적화
- [ ] 성능 개선

## 🚀 배포 명령어

```bash
# 개발 서버 실행
npm run dev

# 빌드 생성
npm run build

# 빌드 미리보기
npm run preview

# 린팅
npm run lint

# 포맷팅
npm run format
```

## 📞 지원 연락처
- Email: support@meongbiter.com
- Phone: 1588-1234
- Status Page: https://status.meongbiter.com
