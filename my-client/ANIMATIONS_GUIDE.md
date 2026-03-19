# 🎨 애플리케이션 애니메이션 가이드

## 📋 목차
1. [개요](#개요)
2. [기본 설정](#기본-설정)
3. [사용 가능한 애니메이션](#사용-가능한-애니메이션)
4. [컴포넌트별 애니메이션](#컴포넌트별-애니메이션)
5. [커스텀 애니메이션](#커스텀-애니메이션)
6. [성능 최적화](#성능-최적화)

---

## 개요

이 애플리케이션은 포괄적인 애니메이션 시스템을 사용합니다. 모든 CSS 파일은 `styles/Animations.css`을 임포트하여 일관된 애니메이션과 트랜지션을 제공합니다.

### 주요 특징
- ✨ 매끄럽고 세련된 페이지 전환
- 🎯 대화형 요소의 반응형 애니메이션
- 💫 카드와 리스트 항목의 진입 애니메이션
- 🔄 로딩 및 상태 변화 애니메이션
- 🎪 호버 효과 및 활성화 피드백

---

## 기본 설정

### 1. CSS 파일 임포트
모든 CSS 파일에서 다음을 추가하세요:

```css
@import './styles/Animations.css';
@import './styles/Components.css';
```

### 2. 시간 함수 (Easing)
애플리케이션 전체에서 일관된 시간 함수를 사용합니다:

```css
/* 기본 시간 함수 */
cubic-bezier(0.4, 0, 0.2, 1)  /* ease-in-out - 더 자연스러운 모션 */
cubic-bezier(0.34, 1.56, 0.64, 1)  /* elastic - 탄력적인 모션 */
```

---

## 사용 가능한 애니메이션

### 📄 페이지 전환 애니메이션

#### `pageSlideInRight` - 오른쪽에서 슬라이드 진입
```css
animation: pageSlideInRight 0.5s cubic-bezier(0.4, 0, 0.2, 1);
```
- 지속시간: 0.5초
- 효과: 오른쪽에서 30px 이동, 페이드 인
- 사용처: 페이지 로드

#### `pageSlideInLeft` - 왼쪽에서 슬라이드 진입
```css
animation: pageSlideInLeft 0.5s cubic-bezier(0.4, 0, 0.2, 1);
```

#### `pageSlideUp` - 아래에서 슬라이드 업
```css
animation: pageSlideUp 0.5s cubic-bezier(0.4, 0, 0.2, 1);
```

#### `pageFadeIn` - 페이드 인
```css
animation: pageFadeIn 0.4s ease;
```

---

### 🔘 버튼 애니메이션

#### `buttonPulse` - 맥박 효과
```css
animation: buttonPulse 2s infinite;
```
- 효과: 점점 커지는 그림자로 주의 끌기
- 사용처: CTA 버튼

#### `buttonHoverGlow` - 호버 글로우
```css
transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
```
- 호버시 자동 적용
- 그림자 및 변형

#### `buttonScale` - 스케일 효과
```css
animation: buttonScale 0.3s ease;
```

#### `buttonClick` - 클릭 효과
```css
animation: buttonClick 0.2s ease;
```

---

### 🎴 카드 애니메이션

#### `cardSlideIn` - 카드 슬라이드 진입
```css
animation: cardSlideIn 0.6s cubic-bezier(0.4, 0, 0.2, 1);
```
- 지속시간: 0.6초
- 효과: 아래에서 20px 이동, 페이드 인

#### `cardHoverLift` - 호버 들어올리기
```css
animation: cardHoverLift 0.4s ease;
```
- 호버시 -8px 위로 이동
- 강화된 그림자

#### `cardBorderGlow` - 테두리 글로우
```css
animation: cardBorderGlow 2s ease-in-out infinite;
```

---

### 📝 입력 필드 애니메이션

#### `inputFocus` - 입력 필드 포커스
```css
animation: inputFocus 0.3s ease;
```
- 포커스시 자동 적용
- 테두리 색상 변화 및 그림자

#### `inputFloatLabel` - 라벨 부동
```css
animation: inputFloatLabel 0.3s ease;
```

#### `formError` - 폼 오류 흔들기
```css
animation: formError 0.5s ease;
```
- 입력 오류 피드백

#### `formSuccess` - 폼 성공 애니메이션
```css
animation: formSuccess 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
```

---

### ⏳ 로딩 및 스피너

#### `spin` - 회전
```css
animation: spin 1s linear infinite;
```
- 지속 시간: 1초

#### `pulse` - 펄스
```css
animation: pulse 2s ease infinite;
```
- 투명도 변화

#### `shimmer` - 반짝임
```css
animation: shimmer 2s infinite;
```
- 로딩 상태 표시

#### `bounce` - 바운스
```css
animation: bounce 1s infinite;
```

---

### 🪟 모달 및 팝업

#### `modalBounceIn` - 모달 바운스 진입
```css
animation: modalBounceIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
```
- 스케일 0.8에서 시작
- 탄력적인 진입

#### `modalZoom` - 모달 줌
```css
animation: modalZoom 0.4s ease;
```

#### `modalSlideUp` - 모달 위로 슬라이드
```css
animation: modalSlideUp 0.5s cubic-bezier(0.4, 0, 0.2, 1);
```

---

### 🔤 텍스트 애니메이션

#### `textSlideUp` - 텍스트 위로 슬라이드
```css
animation: textSlideUp 0.6s cubic-bezier(0.4, 0, 0.2, 1);
```

#### `textFadeIn` - 텍스트 페이드 인
```css
animation: textFadeIn 0.6s ease;
```

---

### 🎯 아이콘 애니메이션

#### `iconRotate` - 아이콘 회전
```css
animation: iconRotate 2s linear infinite;
```

#### `iconBounce` - 아이콘 바운스
```css
animation: iconBounce 1.5s ease-in-out infinite;
```

#### `iconPulse` - 아이콘 펄스
```css
animation: iconPulse 2s ease-in-out infinite;
```

#### `iconGlow` - 아이콘 글로우
```css
animation: iconGlow 2s ease-in-out infinite;
```

---

## 컴포넌트별 애니메이션

### AlertModal (알림 모달)

```css
/* 오버레이 페이드 인 */
.alert-modal-overlay {
  animation: fadeIn 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 컨텐츠 바운스 진입 */
.alert-modal-content {
  animation: modalBounceIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* 제목과 텍스트 슬라이드 업 */
.alert-modal-title {
  animation: textSlideUp 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.alert-modal-text {
  animation: textSlideUp 0.7s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 버튼 호버 효과 */
.alert-modal-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
}

/* 버튼 클릭 효과 */
.alert-modal-primary:active {
  animation: buttonClick 0.2s ease;
}
```

### 입력 필드

```css
/* 포커스 애니메이션 */
.input:focus {
  animation: inputFocus 0.3s ease;
  border-bottom-color: #ff7f50;
  box-shadow: 0 0 0 3px rgba(255, 127, 80, 0.1);
}

/* 오류 상태 */
.input--error {
  animation: formError 0.5s ease;
}
```

### 버튼

```css
/* 호버 효과 */
.button:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4);
}

/* 클릭 효과 */
.button:active {
  animation: buttonClick 0.2s ease;
}
```

---

## 커스텀 애니메이션

새로운 애니메이션을 추가하려면:

### 1. `Animations.css`에 정의

```css
@keyframes myCustomAnimation {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### 2. 유틸리티 클래스 추가

```css
.animate-my-custom {
  animation: myCustomAnimation 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}
```

### 3. HTML에서 사용

```html
<div class="animate-my-custom">
  커스텀 애니메이션이 적용된 요소
</div>
```

---

## 성능 최적화

### 1. GPU 가속 사용

```css
/* GPU 가속을 활성화하는 속성 */
will-change: transform, opacity;
transform: translateZ(0);
```

### 2. 불필요한 애니메이션 제한

```css
/* 간단한 호버는 transition 사용 */
transition: color 0.3s ease;

/* 복잡한 진입은 animation 사용 */
animation: cardSlideIn 0.6s ease;
```

### 3. 물리적 움직임 감소 설정 존중

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation: none !important;
    transition: none !important;
  }
}
```

---

## 실전 예제

### 카드 리스트 애니메이션

```css
.designer-card {
  animation: cardSlideIn 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.designer-card:nth-child(2) {
  animation-delay: 0.1s;
}

.designer-card:nth-child(3) {
  animation-delay: 0.2s;
}

.designer-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
}
```

### 폼 제출 피드백

```css
/* 오류 상태 */
.form-error {
  animation: formError 0.5s ease;
  border-color: #e74c3c;
}

/* 성공 상태 */
.form-success {
  animation: formSuccess 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

### 로딩 상태

```css
.loading-spinner {
  animation: spin 1s linear infinite;
}

.loading-skeleton {
  animation: shimmer 2s infinite;
}
```

---

## 타이밍 가이드

| 요소 | 지속시간 | 사용 |
|------|---------|------|
| 페이지 전환 | 0.5s | `pageSlideInRight` |
| 카드 진입 | 0.6s | `cardSlideIn` |
| 호버 효과 | 0.35s | `transition` |
| 클릭 피드백 | 0.2s | `buttonClick` |
| 모달 진입 | 0.5s | `modalBounceIn` |
| 로딩 | 1s~2s | `spin`, `shimmer` |

---

## 브라우저 호환성

- Chrome/Edge: 100%
- Firefox: 100%
- Safari: 100%
- iOS Safari: 100%

---

## 다음 단계

1. 더 많은 페이지에 애니메이션 적용
2. 마이크로인터랙션 추가 (체크박스, 토글 등)
3. 스크롤 애니메이션 구현
4. 페이지 전환 애니메이션 커스터마이징

---

**마지막 업데이트**: 2026년 3월 19일
