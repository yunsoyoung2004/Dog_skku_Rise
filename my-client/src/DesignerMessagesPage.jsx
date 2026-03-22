import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { auth, db } from './firebase';
import './DesignerPageNav.css';
import './DesignerMessagesPage.css';
import DesignerNotificationButton from './components/DesignerNotificationButton';
import DesignerHeaderBrand from './components/DesignerHeaderBrand';

export default function DesignerMessagesPage() {
  const navigate = useNavigate();
  const [user] = useAuthState(auth);
  const [filter, setFilter] = useState('all');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/designer-login');
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, 'chatRooms'),
      where('designerId', '==', user.uid)
    );
    
    // 실시간 리스너로 채팅방 상태 변경 감지
    const unsubscribe = onSnapshot(q, (snap) => {
      const rooms = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setMessages(rooms);
      setLoading(false);
    }, (err) => {
      console.error('채팅방 로드 실패:', err);
      setMessages([]);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, navigate]);

  const filterMessages = () => {
    if (filter === 'all') return messages;
    if (filter === 'matching') {
      return messages.filter((msg) => msg.status === 'pending');
    }
    return messages.filter((msg) => msg.status === filter);
  };

  const formatTime = (ts) => {
    if (!ts) return '';
    if (typeof ts === 'string') return ts;
    try {
      if (typeof ts.toDate === 'function') {
        const d = ts.toDate();
        return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
      }
      if (ts.seconds != null) {
        const d = new Date(ts.seconds * 1000);
        return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
      }
    } catch (e) {
      return '';
    }
    return '';
  };

  return (
    <div className="designer-page">
      <div className="designer-page-header">
        <DesignerHeaderBrand />
        <h1>채팅</h1>
        <div className="designer-header-right">
          <DesignerNotificationButton />
        </div>
      </div>

      <div className="designer-content">
        <div className="dm-filter-row">
          <button
            type="button"
            className={`dm-filter-pill ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            전체
          </button>
          <button
            type="button"
            className={`dm-filter-pill ${filter === 'matching' ? 'active' : ''}`}
            onClick={() => setFilter('matching')}
          >
            매칭 중
          </button>
          <button
            type="button"
            className={`dm-filter-pill ${filter === 'completed' ? 'active' : ''}`}
            onClick={() => setFilter('completed')}
          >
            매칭 완료
          </button>
        </div>
        {loading ? (
          <div className="empty-messages">
            <div className="empty-messages-icon">⌛</div>
            <p className="empty-messages-text">채팅을 불러오는 중입니다...</p>
          </div>
        ) : filterMessages().length === 0 ? (
          <div className="empty-messages">
            <div className="empty-messages-icon" aria-hidden="true">
              <svg
                viewBox="0 0 24 24"
                width="40"
                height="40"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 5h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H9l-4 3v-3H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" />
                <path d="M8 10h8" />
                <path d="M8 13h5" />
              </svg>
            </div>
            <p className="empty-messages-text">채팅이 없습니다</p>
          </div>
        ) : (
          <div className="dm-list">
            {filterMessages().map((msg) => (
              <div
                key={msg.id}
                className="message-item"
                onClick={() => navigate(`/designer-chat/${msg.id}`)}
              >
                <div className="message-avatar">🐶</div>
                <div className="message-content">
                  <div className="message-top-row">
                    <p className="message-name">{msg.title || msg.roomName || '채팅방'}</p>
                    <span className="message-time">{formatTime(msg.lastMessageTime)}</span>
                  </div>
                  <p className="message-preview">{msg.lastMessage || '최근 메시지가 없습니다'}</p>
                </div>
              </div>
            ))}
          </div>
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
