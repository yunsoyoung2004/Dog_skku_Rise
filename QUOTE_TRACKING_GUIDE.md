# 견적 요청 생명주기 추적 로깅 가이드

## 개요
견적 요청에서 확정까지의 **전체 생명주기**가 브라우저 콘솔에 상세하게 기록됩니다.  
각 단계를 추적하면 데이터 흐름과 상태 변화를 명확히 이해할 수 있습니다.

---

## 📋 전체 흐름도

```
┌─────────────────────────────────────────────────────────────────┐
│                    사용자 (User)                                │
│                                                                 │
│  1️⃣  ChatConversationPage 또는 QuoteRequestPage                │
│      handleSubmitQuote() / handleSubmit()                       │
│      └─ 견적 요청 제출  🔷 → Firestore quoteRequests 저장       │
│         └─ 채팅 메시지 전송  🔷 → Firestore messages 저장       │
└─────────────────────────────────────────────────────────────────┘
                            ⬇️ [채팅 메시지 onSnapshot]
┌─────────────────────────────────────────────────────────────────┐
│            디자이너 (Designer)                                   │
│                                                                 │
│  2️⃣  DesignerChatConversationPage                             │
│      getMessage onSnapshot 후 quoteRequest 감지                │
│      └─ 견적 요청 수락  🔷 → Firestore quoteRequests.status    │
│         └─ 채팅 수락 메시지 전송  🔷 → Firestore messages     │
└─────────────────────────────────────────────────────────────────┘
                            ⬇️ [채팅 메시지 onSnapshot]
┌─────────────────────────────────────────────────────────────────┐
│                    사용자 (User로 돌아옴)                       │
│                                                                 │
│  3️⃣  ChatConversationPage                                     │
│      getMessage onSnapshot 후 견적 확정                        │
│      handleConfirmQuote()                                       │
│      └─ 견적 확정  🔷 → Firestore quotes.status = confirmed   │
│         └─ 예약 생성  🔷 → Firestore bookings 저장             │
│         └─ 매칭 완료 메시지  🔷 → Firestore messages 저장      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔍 단계별 상세 로깅

### 1️⃣ 사용자가 견적 요청 제출

#### 진입점 (Entry Point)
- **ChatConversationPage → handleSubmitQuote()**  (인라인 견적 요청)
- **QuoteRequestPage → handleSubmit()** (상세 견적 요청)

#### 콘솔 로그 순서

```
📝 [1] 제출 시작: { amount/roomId/designerId }
  ↓
🐕 [2] 강아지 정보: { dogId/name/breed/weight }
  ↓
📤 [3] createQuoteRequest 호출 중...
  ↓
🔧 [services.js] createQuoteRequest 호출: { userId/designerId/dogId }
  ↓
💾 [Firestore] addDoc 호출 - quoteRequests 컬렉션에 저장 시작
  ↓
✅ [Firestore] 저장 완료: { docId/path/documentData }
  ↓
✅ [4] createQuoteRequest 완료: { success/quoteRequestId/timestamp }
  ↓
💬 [5] 채팅방 메시지 전송 시작...
  ↓
📤 [6] sendMessage 호출: { roomId/messageType/quoteRequestId }
  ↓
🔧 [services.js] sendMessage 호출: { chatRoomId/senderId/messageType }
  ↓
💾 [Firestore] addDoc 호출 - 메시지 저장 시작
  ↓
✅ [Firestore] 메시지 저장 완료: { messageId }
  ↓
🔗 [Firestore] 채팅방 메타데이터 업데이트 시작...
  ↓
✅ [7] 채팅 메시지 Firestore 저장 완료
```

**Firestore 데이터 변화:**
- ✅ `quoteRequests/{quoteRequestId}` 새로 생성, `status: 'pending'`
- ✅ `chatRooms/{roomId}/messages/{messageId}` 새로 생성, `messageType: 'quoteRequest'`
- ✅ `chatRooms/{roomId}` 업데이트, `unreadCount + 1`, `lastMessage` 업데이트

---

### 2️⃣ 디자이너가 알림 받고 견적 요청 확인

#### 트리거
- **ChatConversationPage/DesignerChatConversationPage의 getMessage onSnapshot**
- 새로운 메시지 도착 감지 → `quoteRequestLoading` 시작

#### 콘솔 로그 순서

```
📝 [QuoteRequests] 로드 시작: { designerId/userId }
  ↓
🔧 [services.js] getDesignerQuoteRequests 호출: { designerId }
  ↓
📊 [QuoteRequests] 조회 완료: { totalCount/allRequests }
  ↓
🔍 [QuoteRequests] 필터링 완료: { filteredCount/targetUserId }
  ↓
✅ [QuoteRequests] 최신 요청 발견: { id/status/createdAt }
```

또는, 메시지가 들어올 때:

```
📡 [메시지 변화 감지]: { roomId/messageCount/docChanges }
  ↓
🎯 [견적 메시지 감지]: { type: quoteRequest/senderId }
  ↓
🔄 [견적 재로드 트리거]: { messageCount/roomId/userId/designerId }
  ↓
📝 [QuoteRequests] 로드 시작...
  (위와 동일)
```

**UI 변화:**
- `latestQuoteRequest` 상태 업데이트
- "[견적 요청 수락]" 버튼 활성화 (디자이너 화면)

---

### 3️⃣ 디자이너가 견적 요청 수락

#### 진입점
- **DesignerChatConversationPage → handleAcceptQuote()** ("[견적 요청 수락]" 버튼 클릭)

#### 콘솔 로그 순서

```
========== [디자이너 견적 요청 수락 프로세스] ==========

🔍 [1] 기본 정보 확인: { designerId/roomId/hasQuoteRequest/quoteRequestId }
  ↓
📝 [2] 견적 요청 수락 시작: { userId/quoteRequestId/requestStatus }
  ↓
💾 [3] sendDesignerQuote 호출 중...
  ↓
🔧 [services.js] sendDesignerQuote 호출: { designerId/requestId/amount }
  ↓
🎯 sendDesignerQuote 호출: { designerId/requestId/amount }
  ↓
📋 기존 견적 확인: 0개 (초기)
  ↓
➕ [INSERT] 새 견적 생성: { price }
  ↓
💾 [Firestore] addDoc 호출...
  ↓
✅ [INSERT] 생성 완료: { docId/path }
  ↓
🔗 [UPDATE] quoteRequest 상태 갱신: { requestId/newStatus: responded }
  ↓
✅ [UPDATE] quoteRequest 갱신 완료
  ↓
✅ [services.js] sendDesignerQuote 완료
  ↓
✅ [4] sendDesignerQuote 호출 완료
  ↓
💬 [5] 시스템 메시지 로컬 추가...
  ↓
📤 [6] 채팅 메시지 Firestore 저장 중...
  ↓
🔔 [7] 사용자에게 알림 발송 중...
  ↓
✅ [8] 알림 발송 완료

========== [✅ 견적 요청 수락 완료] ==========
```

**Firestore 데이터 변화:**
- ✅ `quotes/{quoteId}` 새로 생성, `status: 'sent'`, `requestId` 포함
- ✅ `quoteRequests/{requestId}` 업데이트, `status: 'responded'`
- ✅ `chatRooms/{roomId}/messages/` 새 메시지 추가, `messageType: 'quoteAccepted'` 또는 시스템 메시지
- ✅ 사용자에게 알림 생성

---

### 4️⃣ 사용자가 견적 확인 및 확정

#### 트리거
- **ChatConversationPage의 getMessage onSnapshot**
- 디자이너의 "수락" 메시지 감지 → `latestQuote` 재로드

#### 견적 재로드 로그

```
🔄 [견적 재로드 트리거]: { messageCount/roomId }
  ↓
📝 [QuoteRequests] 로드 시작...
  (동일)
  ↓
💾 [모든 견적 조회 완료]: { totalCount }
  ↓
🔍 [필터링 완료]: { filteredCount }
  ↓
✅ [최신 견적 발견]: { quoteId/status/timestamp }
```

#### 사용자가 "확정" 버튼 클릭

```
========== [사용자 견적 확정 프로세스] ==========

🔍 [1] 사용자 정보 확인: { userId/roomId/designerId/quoteId/quoteStatus }
  ↓
⏳ [2] confirmLatestQuote 실행 중...
  ↓
🔧 [services.js] confirmLatestQuote 호출: { userId/designerId }
  ↓
🔍 [Firestore] quotes 컬렉션 조회 중...
  ↓
📊 [Firestore] 조회 결과: 1개
  ↓
✅ [Firestore] 최신 견적 발견: { quoteId/currentStatus/price/timestamp }
  ↓
🔄 [Firestore] quotes status 업데이트: confirmed
  ↓
✅ [Firestore] quotes 상태 업데이트 완료
  ↓
🔗 [Firestore] quoteRequest 상태 갱신: { requestId }
  ↓
✅ [Firestore] quoteRequest 상태 업데이트 완료
  ↓
✅ [services.js] confirmLatestQuote 완료
  ↓
✅ [3] confirmLatestQuote 응답: { success/quoteId }
  ↓
📊 [4] 확정된 견적 정보: { quoteId/price/designerId/dogName }
  ↓
📊 [5] 로컬 상태 업데이트: latestQuote.status = confirmed
  ↓
📅 [6] 예약 생성 시작...
  ↓
... (예약 생성 과정)
  ↓
✅ [7] 예약 생성 완료: { bookingId }
  ↓
🔗 [8] 채팅방에 bookingId 저장 중...
  ↓
✅ [9] bookingId 저장 완료
  ↓
🎯 [10] 채팅방 상태 업데이트: completed
  ↓
✅ [11] 채팅방 상태 업데이트 완료
  ↓
💬 [12] 시스템 메시지 전송: matchingComplete
  ↓
🔔 [13] 디자이너에게 예약 확정 알림 발송...
  ↓
✅ [14] 알림 발송 완료

========== [✅ 견적 확정 완료] ==========
```

**Firestore 데이터 변화:**
- ✅ `quotes/{quoteId}` 업데이트, `status: 'confirmed'`, `confirmedAt` 추가
- ✅ `quoteRequests/{requestId}` 업데이트, `status: 'confirmed'`
- ✅ `bookings/{bookingId}` 새로 생성
- ✅ `chatRooms/{roomId}` 업데이트, `status: 'completed'`, `bookingId` 추가
- ✅ 디자이너에게 알림 생성

---

## 🛠️ 로깅 상수 네이밍 규칙

| 기호 | 의미 | 포함 정보 | 예시 |
|------|------|---------|------|
| 📝 | 프로세스 시작 | 시작점, 입력 | `📝 [1] 제출 시작` |
| 🔧 | 함수 호출 | 함수명, 파라미터 | `🔧 [services.js] createQuoteRequest 호출` |
| 💾 | Firestore 저장 | 컬렉션, 문서 | `💾 [Firestore] addDoc 호출` |
| ✅ | 성공 완료 | 결과 데이터 | `✅ [3] createQuoteRequest 완료` |
| 📤 | 송신/전송 | 대상, 타입 | `📤 [6] sendMessage 호출` |
| 📊 | 데이터 조회/조사 | 쿼리 결과 | `📊 [조회 완료]: 5개` |
| 🔍 | 필터링/검색 | 필터 조건, 결과 | `🔍 [필터링 완료]: 1개` |
| 🔄 | 상태 변경 | 이전→이후 | `🔄 [status] pending → responded` |
| 🔗 | 관계 데이터 업데이트 | 참조 관계 | `🔗 [UPDATE] quoteRequest 갱신` |
| 🔔 | 알림 발송 | 수신자, 타입 | `🔔 [7] 사용자에게 알림` |
| 🎯 | 타겟 지정/선택 | 대상 | `🎯 [10] 채팅방 상태 업데이트` |
| ⏳ | 진행 중 | 작업 설명 | `⏳ [2] confirmLatestQuote 실행 중` |
| 🐕 | 관련 데이터 | 개 정보 | `🐕 [2] 강아지 정보` |
| 💬 | 채팅/메시지 | 메시지 정보 | `💬 [5] 시스템 메시지` |
| ❌ | 오류/에러 | 오류 설명 | `❌ [ERROR] 사용자 미인증` |
| ⚠️ | 경고/스킵 | 건너뛴 이유 | `⚠️  [8] 채팅 메시지 스킵` |

---

## 🐛 문제 진단 예시

### 예시 1: "견적을 보냈는데 디자이너가 못 본다"

__콘솔 확인:__
```
✅ [3] createQuoteRequest 완료: { success: true, quoteRequestId: "ABC123" }
✅ [7] 채팅 메시지 Firestore 저장 완료
```

__디자이너 콘솔:__
```
⚠️  [QuoteRequests] 이 사용자의 견적 요청 없음
```

**진단:** 로드 로직의 userId 필터링 조건 확인 필요

---

### 예시 2: "디자이너가 수락했는데 사용자가 못 본다"

__콘솔 확인:__
```
========== [디자이너 견적 요청 수락 프로세스] ==========
✅ [4] sendDesignerQuote 호출 완료
✅ [8] 알림 발송 완료
```

__사용자 콘솔:__
```
📡 [메시지 변화 감지]: { roomId, totalCount: 2 }
... 하지만
⚠️  [QuoteRequests] 이 사용자의 견적 요청 없음
```

**진단:** quoteRequest reload 로직이 작동했지만 결과가 없음 → Firestore 데이터 상태 확인

---

### 예시 3: "견적 확정 버튼을 눌렀는데 뭔가 느리다"

__콘솔에서 순서 확인:__
- `[6] 예약 생성 시작...` 로그 대기 시간 측정
- `[7] 예약 생성 완료` 까지의 시간이 길면 → createBooking 성능 확인

---

## 📱 Chrome DevTools 콘솔 필터링 팁

### 모든 견적 로그만 보기
```javascript
// 콘솔에 입력
filterText = "견적|Quote|quote"
```

### 흐름 순서대로 보기
1. 단계별 [숫자] 로깅 사용
2. 타이ム스탐프와 함께 확인
3. Firestore 변화 관찰

### 특정 함수의 로그만 보기
```
[services.js], [ChatConversationPage], [DesignerChatConversationPage]
```

---

## 🎯 주요 체크포인트

### ✅ 정상 흐름의 특징
- 각 단계에서 ✅ 성공 로그 появляется
- ⏳ 진행 중 로그에서 ✅ 완료 로그로의 전환
- 예상된 Firestore 문서 생성

### ⚠️ 주의사항
- 🚫 `isSystemMessage: true` 메시지는 알림 미생성
- ðŸ"„ `quoteMessage` 스킵 이유 로그 확인 (roomId/success/quoteId)
- 📍 `designerId` 일치 여부 항상 확인

---

## 📚 관련 파일

| 파일 | 주요 로깅 함수 |
|-----|-------------|
| ChatConversationPage.jsx | handleSubmitQuote, handleConfirmQuote |
| DesignerChatConversationPage.jsx | handleAcceptQuote, loadQuoteRequests |
| QuoteRequestPage.jsx | handleSubmit |
| services.js | createQuoteRequest, sendDesignerQuote, confirmLatestQuote, sendMessage |

---

## 🔄 빠른 리마인더

```
사용자 제출 → Firestore quoteRequests 저장
         → 채팅 메시지 저장
              ↓
         디자이너가 메시지 감지
              ↓
         견적 요청 수락 → Firestore quotes 저장
                    → quoteRequest 상태 변경
                    → 채팅 메시지 저장
              ↓
         사용자가 메시지 감지
              ↓
         견적 확정 → Firestore quotes 상태 변경
                → 예약 생성
                → 채팅 메시지 저장
```

모든 단계가 콘솔에 기록되므로, 이 흐름 대로 로그를 찾으면 문제를 빠르게 진단할 수 있습니다!
