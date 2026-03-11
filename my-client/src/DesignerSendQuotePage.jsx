import { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './firebase';
import { sendDesignerQuote, sendMessage, createOrGetChatRoom, createNotification } from './services';
import './DesignerPageNav.css';
import './DesignerSendQuotePage.css';

export default function DesignerSendQuotePage() {
  const navigate = useNavigate();
  const { quoteId } = useParams();
  const location = useLocation();
  const quote = location.state?.quote || {};
  // location.state에서 roomId를 받거나, quote 객체에서 찾기 (없으면 나중에 생성)
  const initialRoomId = location.state?.roomId || quote?.roomId || quote?.chatRoomId || '';

  const [user] = useAuthState(auth);

  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      navigate('/designer-login');
      return;
    }

    try {
      setSubmitting(true);

      // 1) 채팅방 ID 확보 (없으면 생성 또는 기존 방 재사용)
      let targetRoomId = initialRoomId;
      if (!targetRoomId && quote.userId) {
        try {
          console.log('🔍 기존 채팅방 조회/생성:', { userId: quote.userId, designerId: user.uid });
          const room = await createOrGetChatRoom(quote.userId, user.uid, {});
          targetRoomId = room?.id || '';
          console.log('✅ 채팅방 확보 완료:', { targetRoomId });
        } catch (err) {
          console.warn('⚠️ 채팅방 조회/생성 실패(무시 가능):', err);
        }
      }

      console.log('💾 견적 저장 시작:', { user: user.uid, quoteId, roomId: targetRoomId, amount });

      // 2) 견적 문서 저장/수정
      const quoteResult = await sendDesignerQuote(user.uid, quoteId, quote, {
        amount,
        message,
      });
      
      console.log('💾 견적 저장 완료');

      // 3) 채팅방에 시스템 메시지 추가
      if (targetRoomId) {
        const systemMessage = {
          senderId: user.uid,
          senderType: 'designer',
          text: '디자이너가 견적을 보냈습니다.',
          isSystemMessage: true,
          messageType: 'quoteReceived',
        };

        try {
          console.log('💬 채팅 메시지 전송:', { roomId: targetRoomId, message: systemMessage.text });
          await sendMessage(targetRoomId, systemMessage);
          console.log('✅ 채팅 메시지 전송 완료');
        } catch (e) {
          console.warn('견적 메시지 기록 실패(무시 가능):', e);
        }
      } else {
        console.warn('⚠️  roomId 없음 - 채팅 메시지는 생략됩니다:', { quoteId, quote });
      }

      // 사용자에게 견적 알림 생성
      if (quote.userId) {
        try {
          await createNotification(quote.userId, {
            title: '디자이너가 견적을 보냈어요',
            message: `${user.displayName || '디자이너'}가 견적을 보냈습니다.`,
            type: 'quote',
            chatRoomId: targetRoomId || quote.roomId || quote.chatRoomId || '',
            quoteId: quoteResult?.quoteId || quoteId,
          });
        } catch (e) {
          console.warn('견적 알림 생성 실패(무시 가능):', e);
        }
      }

      setSent(true);
    } catch (error) {
      console.error('견적 전송/수정 실패:', error);
      alert('견적을 전송하는 중 오류가 발생했습니다. 다시 시도해 주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="designer-page">
      <div className="designer-page-header">
        <button onClick={() => navigate(-1)}>←</button>
        <h1>견적서 보내기</h1>
      </div>

      <div className="designer-content send-quote-content">
        {sent && (
          <div className="send-quote-toast">
            제안서가 전송되었습니다.
          </div>
        )}

        <section className="send-quote-summary">
          <h2>요청 정보 요약</h2>
          <p><span className="label">반려견:</span> {quote.dogName || quote.title || '반려견'}</p>
          <p><span className="label">견종 / 체중:</span> {(quote.breed || '-') + (quote.weight ? ` / ${quote.weight}kg` : '')}</p>
          <p><span className="label">미용 진행 장소:</span> {quote.knowledge || '-'}</p>
          <p><span className="label">미용 방식:</span> {quote.groomingStyle || '-'}</p>
          <p><span className="label">희망 일정:</span> {quote.preferredDate || '-'} {quote.preferredTime || ''}</p>
          <p><span className="label">추가 미용:</span> {(quote.additionalGrooming || []).join(', ') || '-'}</p>
          <p><span className="label">추가 옵션:</span> {(quote.additionalOptions || []).join(', ') || '-'}</p>
          <p><span className="label">강아지 태그:</span> {(quote.dogTags || []).join(', ') || '-'}</p>
          <p><span className="label">요청 메모:</span> {quote.notes || '요청 메모가 없습니다.'}</p>
        </section>

        <form className="send-quote-form" onSubmit={handleSubmit}>
          <label className="field">
            <span className="field-label">제안 금액</span>
            <div className="field-inline">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="예: 70,000"
                required
              />
              <span className="unit">원</span>
            </div>
          </label>

          <label className="field">
            <span className="field-label">추가 메모</span>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="반려견 상태나 미용 방식에 대한 안내를 작성해 주세요."
              rows={4}
            />
          </label>

          <button
            type="submit"
            className="send-quote-submit"
            disabled={sent || submitting}
          >
            {sent ? '전송 완료' : submitting ? '전송 중...' : '견적서 보내기'}
          </button>
        </form>
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
    </div>
  );
}
