import { useNavigate } from 'react-router-dom';
import './ChatVariant1Page.css';

const logoImg = "/dog-logo.png";

export default function ChatVariant1Page() {
  const navigate = useNavigate();

  const conversations = [
    {
      id: 1,
      designer: 'Designer 1',
      lastMessage: '네, 예약 확인했습니다!',
      time: '2시간 전',
      unread: 2
    },
    {
      id: 2,
      designer: 'Designer 2',
      lastMessage: '강아지가 정말 귀엽네요!',
      time: '어제',
      unread: 0
    },
    {
      id: 3,
      designer: 'Designer 3',
      lastMessage: '미용 후기 감사합니다.',
      time: '2일 전',
      unread: 0
    }
  ];

  return (
    <div className="chat-variant-1-page" data-node-id="489:1165">
      {/* Header */}
      <div className="chat-var-header">
        <div className="chat-var-logo">
          <img src={logoImg} alt="멍빗어" />
        </div>
        <h1>멍빗어</h1>
      </div>

      {/* Greeting */}
      <div className="chat-var-greeting">
        <h2>메시지</h2>
      </div>

      {/* Conversations List */}
      <div className="conversations-list">
        {conversations.map((conv) => (
          <div
            key={conv.id}
            className="conversation-item"
            onClick={() => navigate('/chat')}
          >
            <div className="conversation-avatar">💬</div>
            <div className="conversation-content">
              <h4>{conv.designer}</h4>
              <p className="last-message">{conv.lastMessage}</p>
            </div>
            <div className="conversation-meta">
              <span className="time">{conv.time}</span>
              {conv.unread > 0 && (
                <span className="unread-badge">{conv.unread}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Navigation */}
      <div className="chat-var-nav">
          <button onClick={() => navigate('/dashboard')}>🏠</button>
          <button onClick={() => navigate('/search')}>💼</button>
          <button onClick={() => navigate('/chat')}>💬</button>
          <button onClick={() => navigate('/mypage')}>
           <span className="nav-user-icon">👤</span>
          </button>
      </div>
    </div>
  );
}
