# 🚀 멍빗어 프로젝트 배포 체크리스트

## 📋 배포 전 확인 사항

### 1️⃣ **환경 설정**
- [ ] `.env.local` 파일 생성 (`.env.example` 참고)
- [ ] Firebase API 키 설정 확인
- [ ] Firebase 프로젝트 생성 완료
- [ ] Firestore, Authentication, Storage 활성화 확인
- [ ] Firebase 콘솔에서 authorized domain 추가

### 2️⃣ **Firebase 보안 규칙 설정**
- [ ] Firestore 보안 규칙 적용 (`firestore.rules` 참고)
  ```bash
  firebase deploy --only firestore:rules
  ```
- [ ] Storage 보안 규칙 적용 (`storage.rules` 참고)
  ```bash
  firebase deploy --only storage
  ```
- [ ] Authentication 설정 확인
  - [ ] Email/Password 인증 활성화
  - [ ] 비밀번호 정책 설정 확인

### 3️⃣ **코드 최적화**
- [ ] 프로덕션 빌드 생성
  ```bash
  npm run build
  ```
- [ ] 빌드 결과물 크기 확인 (dist 폴더)
- [ ] 미사용 패키지 제거
  ```bash
  npm list --depth=0
  ```
- [ ] console.log 디버그 로그 제거

### 4️⃣ **성능 점검**
- [ ] 번들 크기 분석
  ```bash
  npm run build
  # dist 폴더 크기 확인
  ```
- [ ] 이미지 최적화 확인
- [ ] 동적 import로 코드 스플리팅 구현
- [ ] 불필요한 re-render 제거

### 5️⃣ **보안 점검**
- [ ] Firebase Firestore 보안 규칙 테스트 완료
- [ ] Firebase Storage 보안 규칙 테스트 완료
- [ ] 민감한 정보는 환경변수로 관리
- [ ] CORS 설정 확인
- [ ] API 키 접근 제한 설정

### 6️⃣ **테스트**
- [ ] 기능 테스트
  - [ ] 회원가입 & 로그인
  - [ ] 강아지 등록
  - [ ] 디자이너 검색
  - [ ] 예약 및 결제
  - [ ] 실시간 채팅
  - [ ] 후기 작성
- [ ] 브라우저 호환성 테스트
  - [ ] Chrome
  - [ ] Safari
  - [ ] Firefox
  - [ ] Mobile Safari (iOS)
  - [ ] Chrome Mobile (Android)
- [ ] 반응형 디자인 테스트 (393px 기준)
- [ ] 네트워크 느림 상태 테스트

### 7️⃣ **배포 방식 선택**

#### 옵션 A: Vercel (권장) ⭐
```bash
# 1. Vercel CLI 설치
npm i -g vercel

# 2. 프로젝트 배포
vercel

# 3. 환경 변수 설정
# Vercel Dashboard > Settings > Environment Variables
# .env.local의 모든 환경변수 추가
```

#### 옵션 B: Netlify
```bash
# 1. Netlify CLI 설치
npm i -g netlify-cli

# 2. 배포
netlify deploy --prod

# 3. 환경 변수 설정
# Netlify Dashboard > Site Settings > Environment Variables
```

#### 옵션 C: GitHub Pages
```bash
# 1. vite.config.js 수정
# base: '/Dog_skku_Rise/'

# 2. 빌드
npm run build

# 3. gh-pages 배포
npm run deploy
```

#### 옵션 D: AWS S3 + CloudFront
```bash
# 1. AWS 설정
aws configure

# 2. S3에 배포
aws s3 sync dist/ s3://your-bucket-name/

# 3. CloudFront 캐시 무효화
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"
```

### 8️⃣ **배포 후 확인**
- [ ] 배포된 사이트 접속 확인
- [ ] 개발자 도구 콘솔에 에러 없음
- [ ] Firebase 연동 정상 작동
- [ ] 실시간 기능 (채팅, 알림) 동작 확인
- [ ] 이미지 업로드 기능 확인
- [ ] 반응형 디자인 적용 확인

### 9️⃣ **모니터링 & 로깅 설정**
- [ ] Google Analytics 설정
- [ ] Sentry 오류 추적 (선택사항)
  ```javascript
  // main.jsx에 추가
  import * as Sentry from "@sentry/react";
  
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.VITE_ENVIRONMENT,
  });
  ```
- [ ] Firebase Performance Monitoring 활성화
- [ ] Firebase Crashlytics 설정

### 🔟 **도메인 & HTTPS**
- [ ] 도메인 등록
- [ ] DNS 설정 (배포 서버 지정)
- [ ] HTTPS 자동 설정 확인
- [ ] SSL 인증서 갱신 자동화 설정

---

## 📋 배포 명령어 요약

```bash
# 개발 모드 실행
npm run dev

# 프로덕션 빌드
npm run build

# 빌드 결과 미리보기
npm run preview

# Linting (오류 검사)
npm run lint

# 배포 (선택한 플랫폼에 따라)
# Vercel
vercel

# Netlify
netlify deploy --prod

# Firebase Hosting
firebase deploy
```

---

## 🔧 Firebase 초기 설정 (처음 배포 시)

```bash
# 1. Firebase CLI 설치
npm install -g firebase-tools

# 2. Firebase 로그인
firebase login

# 3. 프로젝트 초기화 (선택사항)
firebase init

# 4. 배포
firebase deploy
```

---

## 📞 배포 후 지원

배포 후 문제가 발생하면:

1. **Firebase Console 확인**
   - Firestore 규칙 오류
   - Authentication 설정
   - Storage 규칙 오류

2. **브라우저 개발자 도구**
   - Console 탭에서 오류 메시지 확인
   - Network 탭에서 API 요청 확인

3. **환경 변수 확인**
   - `.env.local` 파일 재확인
   - 배포 플랫폼의 환경 변수 설정 확인

---

**배포 일자**: 2024년 2월
**프로젝트**: 멍빗어 (Meongbiter)
**버전**: 0.1.0 (MVP)
