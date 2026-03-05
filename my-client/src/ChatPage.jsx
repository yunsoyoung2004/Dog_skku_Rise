import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, getDocs, query, where } from 'firebase/firestore';
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

    const loadRooms = async () => {
      try {
        setLoading(true);
        const q = query(
          collection(db, 'chatRooms'),
          where('userId', '==', user.uid)
        );
        const snap = await getDocs(q);
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setRooms(list);
      } catch (err) {
        console.error('채팅방 로드 실패:', err);
        setRooms([]);
      } finally {
        setLoading(false);
      }
    };

    loadRooms();
  }, [user, navigate]);

  const filterRooms = () => {
    if (selectedFilter === 'all') return rooms;
    return rooms.filter((room) => room.status === selectedFilter);
  };

  const handleRoomClick = (roomId) => {
    navigate(`/chat/${roomId}`);
  };

  return (
    <PageLayout title="채팅">
      {/* Filter Tabs */}
      <div className="chat-filter-tabs">
        <button 
          className={`filter-btn ${selectedFilter === 'all' ? 'active' : ''}`}
          onClick={() => setSelectedFilter('all')}
        >
          전체
        </button>
        <button 
          className={`filter-btn ${selectedFilter === 'pending' ? 'active' : ''}`}
          onClick={() => setSelectedFilter('pending')}
        >
          매칭 중
        </button>
        <button 
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
              <div className="room-avatar">{room.designerAvatar || '🐶'}</div>
              <div className="room-info">
                <div className="room-header">
                  <h3 className="room-name">{room.designerName || room.title || room.roomName || '채팅방'}</h3>
                  <span className="room-time">{room.lastMessageTime || ''}</span>
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
