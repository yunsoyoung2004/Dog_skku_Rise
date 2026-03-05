import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { getChatMessages, sendMessage } from './services';
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
  const messagesEndRef = useRef(null);

  useEffect(() => {
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
      } catch (err) {
        console.error('채팅 로드 실패:', err);
        setRoom(null);
        setMessages([]);
        setError('채팅을 불러오지 못했습니다.');
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
        {room.summaryPrice || room.summaryTime || room.summaryDetail ? (
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
        ) : null}

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
