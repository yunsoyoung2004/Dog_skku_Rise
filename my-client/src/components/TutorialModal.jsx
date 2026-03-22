import './TutorialModal.css';

const tutorialContent = {
  user: {
    title: '멍빗어 사용자 튜토리얼',
    subtitle: '처음 오셨나요? 2분이면 기본 동선을 익힐 수 있어요.',
    steps: [
      {
        title: '디자이너 탐색',
        desc: '검색 · 필터로 디자이너를 찾고 프로필/포트폴리오를 확인하세요.'
      },
      {
        title: '견적 요청',
        desc: '마음에 드는 디자이너에게 견적을 보내면 알림 종과 채팅에서 답변을 받아볼 수 있어요.'
      },
      {
        title: '예약 확정',
        desc: '확정된 예약은 "미용 내역"에서 일정·상태를 확인하고, 변경이 필요하면 채팅으로 바로 이야기하세요.'
      },
      {
        title: '채팅 & 사진',
        desc: '채팅에서 스타일 참고 사진을 공유하거나, 시술 후 사진을 업로드해 히스토리를 남길 수 있어요.'
      },
      {
        title: '마이페이지 & 알림',
        desc: '강아지 정보/즐겨찾기/예약을 관리하고, 종 아이콘 알림으로 새 업데이트를 놓치지 마세요.'
      }
    ],
    primaryButtonText: '좋아요, 시작할게요'
  },
  designer: {
    title: '멍빗어 디자이너 튜토리얼',
    subtitle: '첫 설정부터 예약/견적 응답까지 빠르게 훑어봐요.',
    steps: [
      {
        title: '프로필 완성',
        desc: '위치, 소개, 전문 분야를 채우면 검색/추천 노출이 잘 되고 신뢰도가 올라가요.'
      },
      {
        title: '견적 확인/응답',
        desc: '알림 종과 "견적서 확인"에서 신규 요청을 확인하고 빠르게 견적을 회신하세요.'
      },
      {
        title: '예약·스케줄 관리',
        desc: '대시보드 캘린더로 예약 일정을 한눈에 보고, 필요하면 상태를 업데이트하세요.'
      },
      {
        title: '채팅 & 사진',
        desc: '채팅으로 상담하고, 시술 전·후 사진을 업로드해 고객에게 바로 보여줄 수 있어요.'
      },
      {
        title: '후기/공지 관리',
        desc: '후기를 모니터링하고, 공지/이벤트가 있으면 메시지나 알림으로 전달하세요.'
      }
    ],
    primaryButtonText: '바로 시작하기'
  }
};

export default function TutorialModal({ isOpen, onClose, variant = 'user' }) {
  if (!isOpen) return null;

  const content = tutorialContent[variant] || tutorialContent.user;

  return (
    <div className="tutorial-modal-backdrop" onClick={onClose}>
      <div className="tutorial-modal" onClick={(e) => e.stopPropagation()}>
        <header className="tutorial-modal-header">
          <div>
            <p className="tutorial-eyebrow">튜토리얼</p>
            <h2 className="tutorial-title">{content.title}</h2>
            <p className="tutorial-subtitle">{content.subtitle}</p>
          </div>
          <button type="button" className="tutorial-close" onClick={onClose} aria-label="튜토리얼 닫기">
            ×
          </button>
        </header>

        <div className="tutorial-steps">
          {content.steps.map((step, idx) => (
            <div key={step.title} className="tutorial-step">
              <div className="tutorial-step-num">{idx + 1}</div>
              <div className="tutorial-step-body">
                <p className="tutorial-step-title">{step.title}</p>
                <p className="tutorial-step-desc">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="tutorial-actions">
          <button type="button" className="tutorial-secondary" onClick={onClose}>나중에 볼게요</button>
          <button type="button" className="tutorial-primary" onClick={onClose}>{content.primaryButtonText}</button>
        </div>
      </div>
    </div>
  );
}
