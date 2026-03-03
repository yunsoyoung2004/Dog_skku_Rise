import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './firebase';
import PageLayout from './PageLayout';
import './ChatPage.css';

// 임시 채팅방 데이터
const TEMP_CHAT_ROOMS = [
  {
    id: 'room_1',
    designerName: '멍멍뷰티',
    designerAvatar: '🐕',
    lastMessage: '안녕하세요, 멍멍뷰티입니다!',
    lastMessageTime: '3분 전',
    status: 'pending',
    unreadCount: 0
  },
  {
    id: 'room_2',
    designerName: '애견 미용실',
    designerAvatar: '💇',
    lastMessage: '넵 감사합니다, 다음에 또 이용해주세요 :)',
    lastMessageTime: '2일 전',
    status: 'completed',
    unreadCount: 0
  }
];

export default function ChatPage() {
  const navigate = useNavigate();
  const [user] = useAuthState(auth);
  const [selectedFilter, setSelectedFilter] = useState('all');

  const filterRooms = () => {
    if (selectedFilter === 'all') return TEMP_CHAT_ROOMS;
    return TEMP_CHAT_ROOMS.filter(room => room.status === selectedFilter);
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
        {filterRooms().length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
            채팅방이 없습니다.
          </div>
        ) : (
          filterRooms().map((room) => (
            <div 
              key={room.id}
              className="chat-room-item"
              onClick={() => handleRoomClick(room.id)}
            >
              <div className="room-avatar">{room.designerAvatar}</div>
              <div className="room-info">
                <div className="room-header">
                  <h3 className="room-name">{room.designerName}</h3>
                  <span className="room-time">{room.lastMessageTime}</span>
                </div>
                <p className="room-message">{room.lastMessage}</p>
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
