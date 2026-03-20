import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { auth, db } from './firebase';
import PageLayout from './PageLayout';
import './ChatPage.css';

export default function ChatPage() {
  const navigate = useNavigate();
  const [user] = useAuthState(auth);
  const [rooms, setRooms] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, 'chatRooms'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setRooms(list);
        setLoading(false);
      },
      (err) => {
        console.error('채팅방 로드 실패:', err);
        setRooms([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, navigate]);

  const filterRooms = () => {
    if (selectedFilter === 'all') return rooms;
    return rooms.filter((room) => room.status === selectedFilter);
  };

  const handleRoomClick = (roomId) => {
    navigate(`/chat/${roomId}`);
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
    <PageLayout title="채팅" homePath="/dashboard">
      {/* Filter Tabs */}
      <div className="chat-filter-tabs">
        <button
          type="button"
          className={`filter-btn ${selectedFilter === 'all' ? 'active' : ''}`}
          onClick={() => setSelectedFilter('all')}
        >
          전체
        </button>
        <button
          type="button"
          className={`filter-btn ${selectedFilter === 'pending' ? 'active' : ''}`}
          onClick={() => setSelectedFilter('pending')}
        >
          매칭 중
        </button>
        <button
          type="button"
          className={`filter-btn ${selectedFilter === 'completed' ? 'active' : ''}`}
          onClick={() => setSelectedFilter('completed')}
        >
          매칭 완료
        </button>
      </div>

      {/* Chat Rooms List */}
      <div className="chat-rooms-list">
        {loading ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
            채팅을 불러오는 중입니다...
          </div>
        ) : filterRooms().length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
            <div style={{ fontSize: '40px', marginBottom: '8px' }}>🔒</div>
            <p>채팅방이 없습니다.</p>
          </div>
        ) : (
          filterRooms().map((room) => (
            <div
              key={room.id}
              className="chat-room-item"
              onClick={() => handleRoomClick(room.id)}
            >
              <div className="room-avatar">
                {room.designerAvatar ? (
                  <img
                    src={room.designerAvatar}
                    alt={room.designerName || '디자이너'}
                    className="room-avatar-img"
                  />
                ) : (
                  '🐶'
                )}
              </div>
              <div className="room-info">
                <div className="room-header">
                  <h3 className="room-name">
                    {room.designerName || room.title || room.roomName || '채팅방'}
                  </h3>
                  <span className="room-time">{formatTime(room.lastMessageTime)}</span>
                </div>
                <p className="room-message">{room.lastMessage || '최근 메시지가 없습니다'}</p>
              </div>
              {room.unreadCount > 0 && (
                <div className="unread-badge">{room.unreadCount}</div>
              )}
            </div>
          ))
        )}
      </div>
    </PageLayout>
  );
}
