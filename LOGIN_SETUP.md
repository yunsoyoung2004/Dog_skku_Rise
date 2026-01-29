# 멍빗어 로그인 구현 가이드

## 프로젝트 구조

```
Dog_skku_Rise/
├── my-client/
│   ├── src/
│   │   ├── components/          # 재사용 가능한 UI 컴포넌트
│   │   │   ├── Button.jsx       # 버튼 컴포넌트
│   │   │   └── Input.jsx        # 입력창 컴포넌트
│   │   ├── styles/              # 공통 스타일
│   │   │   ├── Button.css
│   │   │   └── Input.css
│   │   └── LoginPage.jsx        # 로그인 페이지
│   └── package.json
└── my-server/
    ├── index.js                 # 백엔드 서버 및 API
    └── package.json
```

## 주요 기능

### ✅ 완성된 기능

1. **프론트엔드 로그인 페이지**
   - Figma 디자인 기반 구현
   - 반응형 디자인
   - 깔끔한 규격과 패딩

2. **재사용 가능한 컴포넌트**
   - `Button.jsx` - 버튼 컴포넌트 (primary, secondary 변형)
   - `Input.jsx` - 입력 필드 컴포넌트 (에러 표시 기능)

3. **백엔드 로그인 API**
   - POST `/api/login` - 로그인
   - POST `/api/logout` - 로그아웃
   - GET `/api/user` - 사용자 정보 조회

## 설치 및 실행

### 백엔드 실행

```bash
cd my-server
npm install
npm start
# 또는
node index.js

# 서버 실행: http://localhost:3000
```

### 테스트 계정
- **ID**: test@example.com / **PW**: password123
- **ID**: demo / **PW**: demo123

### 프론트엔드 실행

```bash
cd my-client
npm install
npm run dev

# 개발 서버: http://localhost:5173
```

## API 사양

### 로그인 (POST /api/login)

**요청:**
```json
{
  "userId": "test@example.com",
  "password": "password123"
}
```

**성공 응답 (200):**
```json
{
  "success": true,
  "message": "로그인되었습니다.",
  "token": "base64_encoded_token",
  "user": {
    "userId": "test@example.com",
    "name": "Test User"
  }
}
```

**실패 응답 (401):**
```json
{
  "success": false,
  "message": "비밀번호가 틀렸습니다."
}
```

### 사용자 정보 조회 (GET /api/user)

**요청 헤더:**
```
Authorization: Bearer <token>
```

**응답:**
```json
{
  "success": true,
  "user": {
    "userId": "test@example.com",
    "name": "Test User"
  }
}
```

## 컴포넌트 사용법

### Button 컴포넌트

```jsx
import Button from './components/Button';

<Button 
  onClick={() => console.log('clicked')}
  variant="primary"
  disabled={false}
>
  로그인
</Button>
```

**Props:**
- `children` (React.ReactNode) - 버튼 텍스트/내용
- `onClick` (function) - 클릭 핸들러
- `type` (string) - 버튼 타입 (button, submit, reset) - 기본값: button
- `disabled` (boolean) - 비활성화 여부 - 기본값: false
- `variant` (string) - 버튼 스타일 (primary, secondary) - 기본값: primary

### Input 컴포넌트

```jsx
import Input from './components/Input';

<Input
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  placeholder="이메일을 입력하세요"
  label="이메일"
  error={emailError}
/>
```

**Props:**
- `type` (string) - 입력 타입 (text, password, email 등) - 기본값: text
- `value` (string) - 입력값
- `onChange` (function) - 변경 핸들러
- `placeholder` (string) - 플레이스홀더 - 기본값: ''
- `label` (string) - 라벨 텍스트
- `error` (string) - 에러 메시지
- `disabled` (boolean) - 비활성화 여부 - 기본값: false

## 디자인 스펙

### 색상 팔레트
- 배경색: `#595959`
- 폼 배경: `#f5f5f5`
- 버튼: `#2c2c2c` (Hover: `#1a1a1a`)
- 텍스트: `#222` (밝은 배경), `#fbf9f6` (어두운 배경)

### 타이포그래피
- 폰트 패밀리: 'Paperlogy'
- 제목: 30px, 400 weight
- 본문: 14px, 300 weight
- 라벨: 12px, 300 weight

### 간격
- 폼 패딩: 50px (위/아래), 30px (좌/우)
- 폼 그룹 간격: 24px
- 보더 라디우스: 17px (폼), 5px (버튼)

## 보안 주의사항

⚠️ **현재 구현은 테스트/데모용입니다. 프로덕션 환경에서는 다음이 필요합니다:**

1. **JWT 토큰 인증** - 현재는 Base64 인코딩만 사용
2. **비밀번호 해싱** - bcrypt 또는 유사 라이브러리 사용
3. **데이터베이스** - 현재는 메모리 배열 사용
4. **HTTPS** - 보안 연결 필수
5. **CORS 정책** - 특정 도메인으로 제한

## 다음 구현 사항

- [ ] 회원가입 페이지 및 API
- [ ] 비밀번호 찾기 기능
- [ ] 아이디 찾기 기능
- [ ] 토큰 갱신 (Refresh Token)
- [ ] 사용자 정보 수정
- [ ] 회원 탈퇴
- [ ] 소셜 로그인 (Google, Kakao 등)

## 트러블슈팅

### 포트 3000 이미 사용 중
```bash
# 다른 포트에서 실행
# my-server/index.js에서 PORT 변경
const PORT = 3001; // 변경 후 재실행
```

### CORS 오류
- 백엔드 서버가 실행 중인지 확인
- 프론트엔드의 API 호출 주소 확인 (http://localhost:3000)

### 로그인 실패
- 테스트 계정 정보 확인
- 백엔드 콘솔의 에러 메시지 확인
- 네트워크 탭에서 API 응답 확인

## 라이선스

내부 프로젝트 - 배포 금지
