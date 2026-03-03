import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './DesignerPageNav.css';
import './DesignerChatConversationPage.css';

const CONVERSATIONS = {
  room_1: {
    title: '초코 (푸들 | 5KG)',
    summaryPrice: '60,000원',
    summaryTime: '2026년 02월 02일 15:00',
    summaryDetail: '가위컷, 양치/치석 관리, 발바닥 정리',
    designerText: `안녕하세요 😊 반려견 미용 전문 멍멍뷰티입니다.

소중한 아이 미용 견적 요청 주셔서 정말 감사드려요 🐶 보내주신 견적서 내용을 하나하나 꼼꼼히 확인했어요.
선택해주신 내용을 보면

✔️ 출장 미용
✔️ 가위컷 방식
✔️ 추가 옵션과 출장 환경까지

아이의 컨디션과 보호자님 상황을 잘 고려해 주신 게 느껴졌어요.
현재 아이의 정보와 요청 내용을 기준으로 보면,
미용 시간은 약 1시간에서 1시간 반으로, 예상 비용은 6만원 선에서 진행 가능할 것 같아요.

특히 남겨주신 선택 사항 / 주의 사항 덕분에
아이에게 무리 가지 않도록 미용 계획을 세울 수 있을 것 같아요.

이 부분 정말 감사합니다 🙏 안전하고 편안한 미용을 위해 꼭 필요한 정보들이에요.

견적 내용 확인해보시고,
진행 괜찮으시면 예약 확정 도와드릴게요 😊
궁금한 점이나 조정하고 싶은 부분도 언제든 편하게 말씀 주세요.

소중한 아이의 미용을 맡겨주셔서 감사합니다.
멍멍뷰티가 끝까지 책임지고 예쁘게 케어할게요 🐾💙`,
    userText: `안녕하세요 😊 자세하게 안내해주셔서 감사합니다!
견적 내용은 전반적으로 괜찮은 것 같아요.

혹시 추가 비용이 발생할 수 있는 상황이 있다면 미리 알 수 있을까요?
확인 후에 예약 확정드릴게요!

답변 주시면 감사하겠습니다 😊`,
  },
  room_2: {
    title: '초코 (푸들 | 3KG)',
    summaryPrice: '60,000원',
    summaryTime: '2026년 02월 02일 15:00',
    summaryDetail: '가위컷, 양치/치석 관리, 발바닥 정리',
    designerText: '안녕하세요! 예진 미용실입니다. 예시 대화 내용입니다.',
    userText: '넵 감사합니다, 다음에 또 이용해주세요 :)',
  },
};

export default function DesignerChatConversationPage() {
  const navigate = useNavigate();
  const { roomId } = useParams();
  const [matchDone, setMatchDone] = useState(false);

  const data = CONVERSATIONS[roomId || 'room_1'] || CONVERSATIONS.room_1;

  return (
    <div className="designer-page">
      <div className="designer-page-header">
        <button onClick={() => navigate(-1)}>←</button>
        <h1>{data.title}</h1>
        <button className="dc-menu-btn">⋮</button>
      </div>

      <div className="designer-content dc-content">
        <section className="dc-summary-card">
          <p className="dc-summary-line">견적 최종 금액: {data.summaryPrice}</p>
          <p className="dc-summary-line">최종 예약 시간: {data.summaryTime}</p>
          <p className="dc-summary-detail">{data.summaryDetail}</p>
          <button type="button" className="dc-summary-edit-btn">수정하기</button>
        </section>

        <section className="dc-bubbles">
          <div className="dc-bubble dc-bubble-designer">
            {data.designerText.split('\n').map((line, idx) => (
              <p key={idx}>{line}</p>
            ))}
          </div>
          <div className="dc-bubble dc-bubble-user">
            {data.userText.split('\n').map((line, idx) => (
              <p key={idx}>{line}</p>
            ))}
          </div>
        </section>

        <button
          type="button"
          className="dc-match-btn"
          onClick={() => setMatchDone(true)}
        >
          매칭 완료 처리하기
        </button>
      </div>

      <div className="designer-bottom-nav">
        <button
          className="designer-nav-btn"
          onClick={() => navigate('/designer-dashboard')}
          title="대시보드"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
          </svg>
        </button>
        <button
          className="designer-nav-btn"
          onClick={() => navigate('/designer-messages')}
          title="메시지"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </button>
        <button
          className="designer-nav-btn"
          onClick={() => navigate('/designer-profile')}
          title="프로필"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
          </svg>
        </button>
      </div>

      {matchDone && (
        <div className="dc-match-overlay">
          <div className="dc-match-circle">
            <div className="dc-match-check">✓</div>
          </div>
          <p className="dc-match-text">매칭이 완료되었습니다!</p>
        </div>
      )}
    </div>
  );
}
