import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { sendDesignerQuote, sendMessage, createOrGetChatRoom, createNotification } from './services';
import AlertModal from './components/AlertModal';
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
  const [chatRoomId, setChatRoomId] = useState(initialRoomId);
  const [isEdit, setIsEdit] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [alert, setAlert] = useState(null);

  // quoteRequest 상태 확인 및 기존 견적 로드
  useEffect(() => {
    const loadQuoteRequestStatus = async () => {
      if (!user || !quoteId) {
        setIsCheckingStatus(false);
        return;
      }
      try {
        setIsCheckingStatus(true);

        // quoteRequest 상태 확인
        const requestRef = doc(db, 'quoteRequests', quoteId);
        const requestSnap = await getDoc(requestRef);
        if (requestSnap.exists()) {
          const requestData = requestSnap.data();
          if (requestData.status === 'confirmed') {
            console.log('[DesignerSendQuotePage] 더 이상 수정 불가 - 계약나가 이미 확정함:', quoteId);
            setIsConfirmed(true);
            setIsCheckingStatus(false);
            return;
          }
        }

        // 기존 견적 데이터 로드 (수정 모드 기존 정보 채우기)
        const quotesRef = collection(db, 'quotes');
        const q = query(
          quotesRef,
          where('designerId', '==', user.uid),
          where('requestId', '==', quoteId),
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          const data = snap.docs[0].data();
          if (data.price != null) {
            setAmount(String(data.price));
          }
          if (data.message) {
            setMessage(data.message);
          }
          setIsEdit(true);
        }
      } catch (e) {
        console.warn('견적 로드 실패(무시 가능):', e);
      } finally {
        setIsCheckingStatus(false);
      }
    };

    loadQuoteRequestStatus();
  }, [user, quoteId]);

  // 견적 전송 성공 후 자동으로 채팅으로 이동
  useEffect(() => {
    if (sent) {
      const timer = setTimeout(() => {
        if (chatRoomId) {
          navigate(`/designer-chat/${chatRoomId}`);
        } else {
          navigate('/designer-messages');
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [sent, chatRoomId, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 이미 고객이 확정한 견적은 수정 불가
    if (isConfirmed) {
      setAlert({
        title: '수정 불가',
        text: '더 이상 수정할 수 없는 견적입니다.\n고객이 이미 확정했습니다.',
      });
      return;
    }

    if (!user) {
      navigate('/designer-login');
      return;
    }

    try {
      setSubmitting(true);

      // 1) 채팅방 ID 확보 (없으면 생성 또는 기존 방 재사용)
      let targetRoomId = chatRoomId || initialRoomId;
      if (!targetRoomId && quote.userId) {
        try {
          console.log('🔍 기존 채팅방 조회/생성:', { userId: quote.userId, designerId: user.uid });
          const room = await createOrGetChatRoom(quote.userId, user.uid, {});
          targetRoomId = room?.id || '';
          setChatRoomId(targetRoomId);
          console.log('✅ 채팅방 확보 완료:', { targetRoomId });
        } catch (err) {
          console.warn('⚠️ 채팅방 조회/생성 실패(무시 가능):', err);
        }
      }

      // 채팅방 ID를 최종적으로 state에 반영 (초기값이 이미 있는 경우 포함)
      if (targetRoomId && targetRoomId !== chatRoomId) {
        setChatRoomId(targetRoomId);
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
      setAlert({
        title: '전송 실패',
        text: '견적을 전송하는 중 오류가 발생했습니다.\n잠시 후 다시 시도해 주세요.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="designer-page">
      <AlertModal
        isOpen={!!alert}
        title={alert?.title || '알림'}
        text={alert?.text || ''}
        primaryButtonText="확인"
        onPrimaryClick={() => setAlert(null)}
        variant="default"
      />

      <div className="designer-page-header">
        <button onClick={() => navigate(-1)}>←</button>
        <h1>{isEdit ? '견적 수정하기' : '견적서 보내기'}</h1>
      </div>

      <div className="designer-content send-quote-content">
        {sent ? (
          <div className="send-quote-success-screen">
            <div className="success-icon">✓</div>
            <div className="success-title">견적서가 전송되었습니다</div>
            <div className="success-desc">고객에게 알림이 전송됩니다.</div>
            <div className="success-timer">잠시 후 채팅으로 이동합니다...</div>
          </div>
        ) : isCheckingStatus ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
            로드 중...
          </div>
        ) : isConfirmed ? (
          <div style={{
            padding: '20px',
            backgroundColor: '#fff3cd',
            border: '1px solid #ffc107',
            borderRadius: '8px',
            color: '#856404',
            textAlign: 'center',
            margin: '20px 0'
          }}>
            <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>🔒 더 이상 수정 불가</div>
            <div>고객이 이 견적을 이미 확정했습니다.</div>
            <div style={{ fontSize: '12px', marginTop: '8px', color: '#666' }}>수정이 필요하신 경우 고객님과 충분히 소통한 후 새로운 견적을 보내주세요.</div>
          </div>
        ) : isEdit && !isEditing ? (
          <>
            <section className="send-quote-summary" style={{ backgroundColor: '#f0f8f5', padding: '16px', borderRadius: '8px', border: '1px solid #b3e5d0', marginBottom: '20px' }}>
              <h3 style={{ marginTop: 0, marginBottom: '12px', color: '#047857' }}>📋 이미 보낸 견적</h3>
              <div style={{ display: 'grid', gap: '8px', marginBottom: '16px' }}>
                <p style={{ margin: 0 }}>
                  <span style={{ fontWeight: '600', color: '#333' }}>제안 금액:</span>
                  <span style={{ marginLeft: '8px', fontSize: '18px', color: '#047857', fontWeight: '700' }}>{amount}원</span>
                </p>
                <p style={{ margin: 0 }}>
                  <span style={{ fontWeight: '600', color: '#333' }}>추가 메모:</span>
                </p>
                <div style={{ backgroundColor: '#fff', padding: '12px', borderRadius: '6px', border: '1px solid #d1f2eb', minHeight: '60px', color: '#555', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {message || '(메모 없음)'}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                style={{
                  backgroundColor: '#059669',
                  color: '#fff',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '14px'
                }}
              >
                ✏️ 견적 수정하기
              </button>
            </section>
          </>
        ) : (
          <>
            <section 
              className="send-quote-summary"
              style={isEdit && !isEditing ? {
                backgroundColor: '#f0f8f5',
                borderLeft: '4px solid #059669'
              } : {}}
            >
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
                    disabled={isConfirmed}
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
                  disabled={isConfirmed}
                  rows={4}
                />
              </label>

              <button
                type="submit"
                className="send-quote-submit"
                disabled={submitting || isConfirmed}
              >
                {isConfirmed
                  ? '더 이상 수정 불가'
                  : submitting
                  ? '전송 중...'
                  : isEdit
                  ? '견적 수정하기'
                  : '견적서 보내기'}
              </button>
            </form>
          </>
        )}
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
