import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { getChatMessages, sendMessage, getUserQuotes, confirmLatestQuote } from './services';
import PageLayout from './PageLayout';
import './ChatConversationPage.css';

export default function ChatConversationPage() {
  const navigate = useNavigate();
  const { roomId } = useParams();
  const [user] = useAuthState(auth);
  const [messages, setMessages] = useState([]);
  const [room, setRoom] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
    const [latestQuote, setLatestQuote] = useState(null);
    const [quoteLoading, setQuoteLoading] = useState(true);
    const [confirming, setConfirming] = useState(false);
    const [quoteError, setQuoteError] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const loadLatestQuote = async (currentUser, designerId) => {
      if (!currentUser || !designerId) {
        setLatestQuote(null);
        setQuoteLoading(false);
        return;
      }

      try {
        setQuoteLoading(true);
        setQuoteError('');
        const allQuotes = await getUserQuotes(currentUser.uid);
        const filtered = allQuotes.filter((q) => q.designerId === designerId);
        setLatestQuote(filtered.length > 0 ? filtered[0] : null);
      } catch (e) {
        console.error('채팅용 견적 로드 실패:', e);
        setLatestQuote(null);
        setQuoteError('견적 정보를 불러오지 못했습니다.');
      } finally {
        setQuoteLoading(false);
      }
    };

    const loadConversation = async () => {
      if (!roomId) return;
      if (!user) {
        navigate('/login');
        return;
      }

      setLoading(true);
      setError('');
      try {
        const roomRef = doc(db, 'chatRooms', roomId);
        const snap = await getDoc(roomRef);

        if (!snap.exists()) {
          setRoom(null);
          setMessages([]);
          setError('채팅방을 찾을 수 없습니다.');
          return;
        }

        const roomData = { id: snap.id, ...snap.data() };
        setRoom(roomData);

        const msgs = await getChatMessages(roomId);
        setMessages(msgs);

        await loadLatestQuote(user, roomData.designerId);
      } catch (err) {
        console.error('채팅 로드 실패:', err);
        setRoom(null);
        setMessages([]);
        setError('채팅을 불러오지 못했습니다.');
        setLatestQuote(null);
        setQuoteLoading(false);
      } finally {
        setLoading(false);
      }
    };

    loadConversation();
  }, [roomId, user, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !roomId || !user) return;

    const text = newMessage.trim();
    setNewMessage('');

    const messageData = {
      senderId: user.uid,
      senderType: 'user',
      text,
    };

    // Optimistic UI 업데이트
    setMessages((prev) => [
      ...prev,
      {
        id: `local-${Date.now()}`,
        ...messageData,
      },
    ]);

    sendMessage(roomId, messageData).catch((err) => {
      console.error('메시지 전송 실패:', err);
    });
  };

  const handleConfirmQuote = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!room || !room.designerId) {
      alert('디자이너 정보를 찾을 수 없습니다.');
      return;
    }

    if (!latestQuote || (latestQuote.status && latestQuote.status === 'confirmed')) {
      alert('확정할 수 있는 견적이 없습니다.');
      return;
    }

    try {
      setConfirming(true);
      const res = await confirmLatestQuote(user.uid, room.designerId);
      if (!res.success) {
        alert('확정할 견적을 찾을 수 없습니다.');
        return;
      }

      setLatestQuote((prev) => (prev ? { ...prev, status: 'confirmed' } : prev));

      // 채팅방 상태를 매칭 완료로 표시
      try {
        const roomRef = doc(db, 'chatRooms', room.id);
        await updateDoc(roomRef, { status: 'completed' });
        setRoom((prev) => (prev ? { ...prev, status: 'completed' } : prev));
      } catch (e) {
        console.warn('채팅방 상태 업데이트 실패(무시 가능):', e);
      }

      // 시스템 메시지로 기록
      const systemMessage = {
        senderId: user.uid,
        senderType: 'user',
        text: '사용자가 견적을 확정했어요.',
      };
      setMessages((prev) => [
        ...prev,
        { id: `local-confirm-${Date.now()}`, ...systemMessage },
      ]);
      sendMessage(roomId, systemMessage).catch((err) => {
        console.error('확정 시스템 메시지 전송 실패:', err);
      });
    } catch (e) {
      console.error('견적 확정 실패:', e);
      alert('견적을 확정하는 중 오류가 발생했습니다. 다시 시도해 주세요.');
    } finally {
      setConfirming(false);
    }
  };

  const handleSendQuote = () => {
    if (!room || !room.designerId || !room.designerName) {
      alert('디자이너 정보를 찾을 수 없습니다.');
      return;
    }
    navigate('/quote-request', {
      state: {
        designerId: room.designerId,
        designerName: room.designerName,
        originalRequest: latestQuote || undefined,
      },
    });
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="chat-conversation" style={{ padding: '20px', textAlign: 'center' }}>
          채팅을 불러오는 중입니다...
        </div>
      </PageLayout>
    );
  }

  if (error || !room) {
    return (
      <PageLayout>
        <div className="chat-conversation" style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
          <p>🔒 {error || '채팅방 정보가 없습니다.'}</p>
          <button
            type="button"
            style={{ marginTop: '12px', padding: '8px 16px', borderRadius: '8px', border: '1px solid #ccc', background: '#fff' }}
            onClick={() => navigate('/chat')}
          >
            채팅 목록으로 돌아가기
          </button>
        </div>
      </PageLayout>
    );
  }

  const customHeader = (
    <div className="conversation-header">
      <button className="back-btn" onClick={() => navigate('/chat')}>←</button>
      <h1 className="designer-name">{room.designerName || room.title || room.roomName || '채팅'}</h1>
      <button className="menu-btn">⋮</button>
    </div>
  );

  return (
    <PageLayout customHeader={customHeader}>
      <div className="chat-conversation-wrapper">
        {/* Designer Info Card */}
        {(room.summaryPrice || room.summaryTime || room.summaryDetail) && (
          <div className="designer-info-card">
            {room.summaryPrice && (
              <div className="designer-rate">{room.summaryPrice}</div>
            )}
            {room.summaryTime && (
              <div className="designer-time">{room.summaryTime}</div>
            )}
            {room.summaryDetail && (
              <div className="designer-desc">{room.summaryDetail}</div>
            )}
          </div>
        )}

        {/* Quote summary & confirm button (사용자 입장 견적/예약 확정) */}
        {quoteLoading ? (
          <div className="quote-summary-card">
            <p className="quote-summary-text">견적 정보를 불러오는 중입니다...</p>
          </div>
        ) : (
          <div className="quote-summary-card">
            {latestQuote ? (
              <>
                <div className="quote-summary-main">
                  <span className="quote-summary-label">제안된 견적</span>
                  <span className="quote-summary-price">
                    {latestQuote.price ? `${latestQuote.price.toLocaleString()}원` : '금액 미정'}
                  </span>
                </div>
                {latestQuote.message && (
                  <p className="quote-summary-message">{latestQuote.message}</p>
                )}
              </>
            ) : (
              <p className="quote-summary-text">
                아직 디자이너가 확정 가능한 견적을 보내지 않았어요.
              </p>
            )}

            {quoteError && !latestQuote && (
              <p className="quote-summary-text">{quoteError}</p>
            )}

            <div className="quote-summary-footer">
              <span className="quote-summary-status">
                {latestQuote && latestQuote.status === 'confirmed'
                  ? '이미 확정된 견적입니다.'
                  : '채팅 상담 후 견적/예약이 마음에 들면 아래 버튼으로 확정해 주세요.'}
              </span>
              <div className="quote-footer-buttons">
                <button
                  type="button"
                  className="quote-send-btn"
                  onClick={handleSendQuote}
                >
                  견적서 보내기
                </button>
                {(!latestQuote || latestQuote.status !== 'confirmed') && (
                  <button
                    type="button"
                    className="quote-confirm-btn"
                    onClick={handleConfirmQuote}
                    disabled={confirming}
                  >
                    {confirming ? '확정 중...' : '예약/견적 확정하기'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Messages Area */}
        <div className="messages-area">
          {messages.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#999', padding: '16px 0' }}>
              아직 메시지가 없습니다. 첫 메시지를 보내보세요.
            </div>
          ) : (
            messages.map((msg) => {
              const sender = msg.sender || msg.senderType || 'user';
              const isDesigner = sender === 'designer';

              let timeLabel = '';
              if (msg.timestamp) {
                const d = msg.timestamp.toDate ? msg.timestamp.toDate() : new Date(msg.timestamp);
                timeLabel = d.toLocaleTimeString('ko-KR', {
                  hour: '2-digit',
                  minute: '2-digit',
                });
              }

              return (
                <div key={msg.id} className={`message ${isDesigner ? 'designer' : 'user'}`}>
                  {isDesigner && (
                    <div className="msg-avatar">{room.designerAvatar || '🐶'}</div>
                  )}
                  <div className="msg-bubble">
                    <p>{msg.text}</p>
                    {timeLabel && <span className="msg-time">{timeLabel}</span>}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="input-area">
          <input
            type="text"
            className="message-input"
            placeholder="메시지를 입력하세요..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <button className="send-btn" onClick={handleSendMessage}>→</button>
        </div>
      </div>
    </PageLayout>
  );
}
