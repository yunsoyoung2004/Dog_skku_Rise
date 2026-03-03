# 🐕 멍빗어 (Meongbiter) - 개 미용 매칭 플랫폼

SKKU Rise 최종 프로젝트 MVP(Minimum Viable Product)

## 📋 프로젝트 개요

멍빗어는 반려견 주인들과 전문 미용사를 연결하는 플랫폼입니다. 사용자는 쉽게 주변의 미용사를 찾고, 예약하고, 결제할 수 있습니다.

### 👥 사용자
- 반려견 주인: 미용 서비스 예약
- 미용사: 서비스 제공 (향후 구현)

### 🎯 핵심 기능
1. **회원 관리**: 회원가입/로그인, 프로필 관리
2. **강아지 관리**: 강아지 정보 등록/수정/삭제
3. **디자이너 검색**: 위치, 가격, 평점으로 검색
4. **예약 시스템**: 캘린더 기반 예약
5. **결제**: 신용카드/모바일 페이 시뮬레이션
6. **커뮤니케이션**: 실시간 채팅, 후기 작성
7. **마이페이지**: 계정 관리, 미용 내역 조회

## 🏗️ 기술 스택

### 프론트엔드
- **Framework**: React 19.2.0
- **Router**: React Router DOM 7.13.0
- **Build Tool**: Vite 7.2.4
- **Styling**: CSS Modules
- **State Management**: React Hooks (useState, useEffect)

### 백엔드 & 데이터베이스
- **Authentication**: Firebase Authentication
- **Database**: Firestore (NoSQL)
- **Real-time**: Firebase Realtime Listeners
- **Hook**: react-firebase-hooks

### 기타
- **Linting**: ESLint
- **Formatting**: Prettier

## 📂 프로젝트 구조

```
my-client/
├── src/
│   ├── pages/
│   │   ├── LoginPage.jsx
│   │   ├── SignUpPage.jsx
│   │   ├── DashboardPage.jsx
│   │   ├── DesignerListPage.jsx
│   │   ├── DesignerDetailPage.jsx
│   │   ├── QuoteRequestPage.jsx
│   │   ├── QuoteDetailPage.jsx
│   │   ├── CalendarPage.jsx
│   │   ├── PaymentPage.jsx
│   │   ├── BookingConfirmationPage.jsx
│   │   ├── ChatPage.jsx
│   │   ├── ReviewPage.jsx
│   │   ├── MyPage.jsx
│   │   ├── MyPageAccountPage.jsx
│   │   ├── MyPageGroomingPage.jsx
│   │   ├── DogRegistrationPage.jsx
│   │   ├── DogEditPage.jsx
│   │   ├── DogInfoPage.jsx
│   │   ├── FavoritesPage.jsx
│   │   ├── NotificationPage.jsx
│   │   ├── HelpPage.jsx
│   │   ├── LocationSelectPage.jsx
│   │   └── SearchPage.jsx
│   ├── components/
│   │   └── LocationSelectModal.jsx
│   ├── App.jsx
│   ├── firebase.js
│   ├── services.js
│   ├── main.jsx
│   └── styles/
│       ├── App.css
│       ├── DashboardPage.css
│       ├── ... (모든 페이지 스타일)
│       └── fonts.css
├── index.html
├── package.json
├── vite.config.js
├── eslint.config.js
└── README.md
```

## 🔧 설치 및 실행

### 1. 설치
```bash
# 프로젝트 디렉토리 진입
cd my-client

# npm 패키지 설치
npm install

# 필요한 패키지
# - react-firebase-hooks (실시간 리스너용)
```

### 2. Firebase 설정
```bash
# firebase.js 파일에서 Firebase 설정 확인
# .env.local에서 환경 변수 설정
```

### 3. 개발 서버 실행
```bash
npm run dev
```

접속: http://localhost:5173

### 4. 프로덕션 빌드
```bash
npm run build
```

## 🚀 주요 페이지 및 기능

### 1. 인증 페이지
- **LoginPage**: 이메일/비밀번호 로그인
- **SignUpPage**: 회원가입

### 2. 홈 & 검색
- **DashboardPage**: 홈 화면, 주변 디자이너 목록
- **DesignerListPage**: 디자이너 검색 (정렬/필터)
- **DesignerDetailPage**: 디자이너 상세 정보

### 3. 예약 플로우
- **QuoteRequestPage**: 견적 요청 (5단계 폼)
- **QuoteDetailPage**: 받은 견적 조회
- **CalendarPage**: 날짜/시간 선택
- **PaymentPage**: 결제 수단 선택 및 결제
- **BookingConfirmationPage**: 예약 확인

### 4. 강아지 관리
- **DogRegistrationPage**: 강아지 정보 등록
- **DogEditPage**: 강아지 정보 수정
- **DogInfoPage**: 강아지 미용 내역 조회

### 5. 커뮤니케이션
- **ChatPage**: 실시간 채팅
- **ReviewPage**: 미용 후기 작성
- **NotificationPage**: 알림 조회

### 6. 마이페이지
- **MyPage**: 마이페이지 메인 (프로필, 메뉴)
- **MyPageAccountPage**: 계정 정보 수정
- **MyPageGroomingPage**: 미용 내역 조회
- **FavoritesPage**: 찜한 디자이너 조회

### 7. 기타
- **SearchPage**: 검색 기능
- **HelpPage**: FAQ 및 고객 지원
- **LocationSelectPage**: 위치 선택

## 📊 Firebase 데이터 구조

### Collections
```
users/
├── {userId}
│   ├── name: string
│   ├── email: string
│   ├── phone: string
│   ├── address: string
│   ├── createdAt: timestamp
│   └── dogs/ (subcollection)
│       └── {dogId}
│           ├── name: string
│           ├── breed: string
│           ├── age: number
│           ├── weight: number
│           └── image: string

designers/
├── {designerId}
│   ├── name: string
│   ├── rating: number
│   ├── reviews: number
│   ├── priceMin: number
│   ├── priceMax: number
│   ├── specialty: string
│   └── location: string

bookings/
├── {bookingId}
│   ├── userId: string
│   ├── designerId: string
│   ├── dogId: string
│   ├── bookingDate: timestamp
│   ├── timeSlot: string
│   ├── status: string
│   ├── price: number
│   └── createdAt: timestamp

reviews/
├── {reviewId}
│   ├── userId: string
│   ├── designerId: string
│   ├── rating: number
│   ├── text: string
│   ├── services: array
│   └── timestamp: timestamp

chatRooms/
├── {roomId}
│   └── messages/ (subcollection)
│       └── {messageId}
│           ├── sender: string
│           ├── text: string
│           ├── timestamp: timestamp
│           └── userId: string
```

## 🔒 보안 설정

### Firebase 보안 규칙 (Firestore)
```javascript
// 자신의 데이터만 접근 가능
match /users/{userId} {
  allow read, write: if request.auth.uid == userId;
}

// 공개 데이터는 모두 읽기 허용
match /designers/{designerId} {
  allow read: if true;
}
```

## 📈 성능 최적화

### ✅ 구현된 최적화
- Code Splitting (React Router)
- Lazy Loading
- CSS Modules (번들 크기 최소화)
- 실시간 리스너 자동 정리 (메모리 누수 방지)

### 🔄 향후 최적화
- Image Lazy Loading
- Web Workers
- Service Workers (PWA)
- CDN 활용

## 🐛 알려진 이슈

### 현재 제한사항
1. **이미지 업로드**: Firebase Storage 미설정 (코드 작성 완료)
2. **실제 결제**: 결제 게이트웨이 미통합 (시뮬레이션 상태)
3. **디자이너 대시보드**: 미용사 관리 화면 미구현
4. **문자 알림**: SMS 통지 미구현

### 해결 방법
- Firebase Storage 설정 후 `uploadDogImage()` 활성화
- Stripe 또는 PG 연동
- 추후 동료 개발자가 구현 예정

## 🚦 개발 체크리스트

### ✅ 완료됨
- [x] 33개 Figma 디자인 분석
- [x] 27개 React 페이지 구현
- [x] Firebase 프로젝트 초기화
- [x] Firebase 데이터 모델 설계
- [x] 인증 기능 구현
- [x] CRUD 서비스 작성
- [x] 18개 페이지 Firebase 연결
- [x] 실시간 채팅 구현
- [x] 이미지 업로드 코드 작성

### ⏳ 진행 중
- [ ] 배포 전 테스트
- [ ] CI/CD 파이프라인 설정

### 📌 향후 계획
- [ ] 결제 게이트웨이 통합
- [ ] Firebase Storage 설정
- [ ] 푸시 알림 구현
- [ ] 모바일 앱 개발 (React Native)
- [ ] 백엔드 API 개발

## 📞 문의

- Email: support@meongbiter.com
- Phone: 1588-1234
- GitHub: [프로젝트 레포지토리]

## 📄 라이센스

프로젝트는 SKKU Rise 교육 목적으로 제작되었습니다.

---

**마지막 업데이트**: 2024년 12월
**버전**: 0.1.0 (MVP)
