import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './firebase';
import PageLayout from './PageLayout';
import './ChatConversationPage.css';

// 임시 디자이너 정보 데이터
const TEMP_DESIGNERS = {
  room_1: {
    name: '멍멍뷰티',
    avatar: '🐕',
    rate: '60,000원',
    minTime: '2026년 02월 15:00',
    description: '기본 한시간 고급 브런 콜'
  },
  room_2: {
    name: '예진 미용실',
    avatar: '💇',
    rate: '45,000원',
    minTime: '2026년 02월 10:00',
    description: '미용사 예진'
  }
};

// 임시 메시지 데이터
const TEMP_MESSAGES = {
  room_1: [
    { id: 1, sender: 'designer', text: '안녕하세요! 멍멍뷰티입니다.', time: '10:30' },
    { id: 2, sender: 'user', text: '안녕하세요! 상담 가능한가요?', time: '10:35' },
    { id: 3, sender: 'designer', text: '네, 가능합니다. 어떤 미용을 원하세요?', time: '10:40' },
    { id: 4, sender: 'user', text: '강아지를 정리해주고 싶어요.', time: '10:42' },
    { id: 5, sender: 'designer', text: '저희는 애견 미용 전문점입니다. 언제 가능하신가요?', time: '10:45' }
  ],
  room_2: [
    { id: 1, sender: 'designer', text: '안녕하세요! 예진 미용실입니다.', time: '14:20' },
    { id: 2, sender: 'user', text: '반갑습니다!', time: '14:25' }
  ]
};

export default function ChatConversationPage() {
  const navigate = useNavigate();
  const { roomId } = useParams();
  const [user] = useAuthState(auth);
  const [messages, setMessages] = useState([]);
  const [designer, setDesigner] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (roomId && TEMP_DESIGNERS[roomId]) {
      setDesigner(TEMP_DESIGNERS[roomId]);
      setMessages(TEMP_MESSAGES[roomId] || []);
    }
  }, [roomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const newMsg = {
      id: messages.length + 1,
      sender: 'user',
      text: newMessage,
      time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages([...messages, newMsg]);
    setNewMessage('');
  };

  if (!designer) {
    return <div className="chat-conversation" style={{ padding: '20px', textAlign: 'center' }}>로딩 중...</div>;
  }

  const customHeader = (
    <div className="conversation-header">
      <button className="back-btn" onClick={() => navigate('/chat')}>←</button>
      <h1 className="designer-name">{designer.name}</h1>
      <button className="menu-btn">⋮</button>
    </div>
  );

  return (
    <PageLayout customHeader={customHeader}>
      <div className="chat-conversation-wrapper">
        {/* Designer Info Card */}
        <div className="designer-info-card">
          <div className="designer-rate">{designer.rate}</div>
          <div className="designer-time">{designer.minTime}</div>
          <div className="designer-desc">{designer.description}</div>
        </div>

        {/* Messages Area */}
        <div className="messages-area">
          {messages.map((msg) => (
            <div key={msg.id} className={`message ${msg.sender}`}>
              {msg.sender === 'designer' && (
                <div className="msg-avatar">{designer.avatar}</div>
              )}
              <div className="msg-bubble">
                <p>{msg.text}</p>
                <span className="msg-time">{msg.time}</span>
              </div>
            </div>
          ))}
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
