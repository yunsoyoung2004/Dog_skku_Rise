import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { getChatMessages, sendMessage, getDesignerQuoteRequests } from './services';
import './DesignerPageNav.css';
import './DesignerChatConversationPage.css';

export default function DesignerChatConversationPage() {
  const navigate = useNavigate();
  const { roomId } = useParams();
  const [user] = useAuthState(auth);
  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [latestQuoteRequest, setLatestQuoteRequest] = useState(null);
  const [quoteRequestLoading, setQuoteRequestLoading] = useState(true);
  const [quoteError, setQuoteError] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const loadQuoteRequests = async (currentUser, userId) => {
      if (!currentUser || !userId) {
        setLatestQuoteRequest(null);
        setQuoteRequestLoading(false);
        return;
      }

      try {
        setQuoteRequestLoading(true);
        setQuoteError('');
        const allRequests = await getDesignerQuoteRequests(currentUser.uid);
        const filtered = allRequests.filter((q) => q.userId === userId);
        setLatestQuoteRequest(filtered.length > 0 ? filtered[0] : null);
      } catch (e) {
        console.error('채팅용 견적 요청 로드 실패:', e);
        setLatestQuoteRequest(null);
        setQuoteError('견적 요청 정보를 불러오지 못했습니다.');
      } finally {
        setQuoteRequestLoading(false);
      }
    };

    const loadConversation = async () => {
      if (!roomId) return;
      if (!user) {
        navigate('/designer-login');
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
        // 디자이너 본인 방인지 확인 (보안용)
        if (roomData.designerId && roomData.designerId !== user.uid) {
          setRoom(null);
          setMessages([]);
          setError('해당 채팅방에 접근할 수 없습니다.');
          return;
        }

        setRoom(roomData);
        const msgs = await getChatMessages(roomId);
        setMessages(msgs);

        await loadQuoteRequests(user, roomData.userId);
      } catch (e) {
        console.error('채팅 로드 실패:', e);
        setRoom(null);
        setMessages([]);
        setError('채팅을 불러오지 못했습니다.');
        setLatestQuoteRequest(null);
        setQuoteRequestLoading(false);
      } finally {
        setLoading(false);
      }
    };

    loadConversation();
  }, [roomId, user, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!newMessage.trim() || !roomId || !user) return;

    const text = newMessage.trim();
    setNewMessage('');

    const messageData = {
      senderId: user.uid,
      senderType: 'designer',
      text,
    };

    setMessages((prev) => [
      ...prev,
      {
        id: `local-${Date.now()}`,
        ...messageData,
      },
    ]);

    sendMessage(roomId, messageData).catch((e) => {
      console.error('메시지 전송 실패:', e);
    });
  };

  const handleSendQuote = () => {
    if (!room || !room.userId || !latestQuoteRequest) {
      alert('견적 요청 정보를 찾을 수 없습니다.');
      return;
    }
    navigate('/designer-send-quote', {
      state: {
        userId: room.userId,
        userName: room.userName || '고객',
        quoteRequest: latestQuoteRequest,
      },
    });
  };

  if (loading) {
    return (
      <div className="designer-page">
        <div className="designer-page-header">
          <button onClick={() => navigate(-1)}>←</button>
          <h1>채팅</h1>
        </div>
        <div className="designer-content dc-content" style={{ padding: '20px', textAlign: 'center' }}>
          채팅을 불러오는 중입니다...
        </div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="designer-page">
        <div className="designer-page-header">
          <button onClick={() => navigate(-1)}>←</button>
          <h1>채팅</h1>
        </div>
        <div className="designer-content dc-content" style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
          <p>🔒 {error || '채팅방 정보가 없습니다.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="designer-page">
      <div className="designer-page-header">
        <button onClick={() => navigate(-1)}>←</button>
        <h1>{room.userName || room.roomName || room.title || '채팅'}</h1>
        <button className="dc-menu-btn">⋮</button>
      </div>

      <div className="designer-content dc-content">
        {/* Quote Request Card (디자이너 입장) */}
        {quoteRequestLoading ? (
          <div className="quote-request-card">
            <p className="quote-request-text">견적 요청 정보를 불러오는 중입니다...</p>
          </div>
        ) : (
          <div className="quote-request-card">
            {latestQuoteRequest ? (
              <>
                <div className="quote-request-main">
                  <span className="quote-request-label">견적 요청</span>
                  <span className="quote-request-dog">
                    {latestQuoteRequest.dogName || '견종 미지정'}
                  </span>
                </div>
                {latestQuoteRequest.notes && (
                  <p className="quote-request-message">{latestQuoteRequest.notes}</p>
                )}
                {latestQuoteRequest.groomingStyle && (
                  <div className="quote-request-tags">
                    <span className="tag">{latestQuoteRequest.groomingStyle}</span>
                  </div>
                )}
              </>
            ) : (
              <p className="quote-request-text">
                사용자가 견적 요청을 하지 않았습니다.
              </p>
            )}

            {quoteError && !latestQuoteRequest && (
              <p className="quote-request-text">{quoteError}</p>
            )}

            <div className="quote-request-footer">
              {latestQuoteRequest && (
                <button
                  type="button"
                  className="quote-send-btn"
                  onClick={handleSendQuote}
                >
                  견적 보내기
                </button>
              )}
            </div>
          </div>
        )}

          <div className="dc-bubbles">
          {messages.length === 0 ? (
            <div className="dc-empty">아직 메시지가 없습니다. 첫 메시지를 보내보세요.</div>
          ) : (
            messages.map((msg) => {
              const sender = msg.senderType || msg.sender || 'user';
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
                <div
                  key={msg.id}
                  className={`dc-bubble ${isDesigner ? 'dc-bubble-me' : 'dc-bubble-other'}`}
                >
                  <p>{msg.text}</p>
                  {timeLabel && <span className="dc-time">{timeLabel}</span>}
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="dc-input-row">
          <input
            type="text"
            className="dc-input"
            placeholder="메시지를 입력하세요..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          />
          <button className="dc-send-btn" onClick={handleSend}>→</button>
        </div>
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
            <path d="M20 21v-2a 4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
