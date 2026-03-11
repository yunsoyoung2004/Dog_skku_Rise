import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, query, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { auth, db } from './firebase';
import { markNotificationAsRead, deleteNotification } from './services';
import PageLayout from './PageLayout';
import './NotificationPage.css';

export default function NotificationPage() {
  const navigate = useNavigate();
  const [user] = useAuthState(auth);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Firestore에서 실시간 알림 가져오기
      const q = query(
        collection(db, `users/${user.uid}/notifications`),
        orderBy('createdAt', 'desc'),
        limit(50)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const notifData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          time: formatTime(doc.data().createdAt)
        }));
        setNotifications(notifData);
        setLoading(false);
      }, (error) => {
        console.error('알림 로드 오류:', error);
        setNotifications([]);
        setLoading(false);
      });

      return unsubscribe;
    } catch (err) {
      console.error('알림 설정 오류:', err);
      setLoading(false);
    }
  }, [user]);

  const formatTime = (timestamp) => {
    if (!timestamp) return '방금';
    const now = new Date();
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '방금';
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;
    return date.toLocaleDateString('ko-KR');
  };

  const handleMarkAsRead = async (notifId) => {
    try {
      await markNotificationAsRead(user.uid, notifId);
    } catch (err) {
      console.error('알림 읽음 처리 실패:', err);
    }
  };

  const handleDeleteNotification = async (notifId) => {
    try {
      await deleteNotification(user.uid, notifId);
      setNotifications(notifications.filter(notif => notif.id !== notifId));
    } catch (err) {
      console.error('알림 삭제 실패:', err);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'message': return '💬';
      case 'booking': return '📅';
      case 'review': return '⭐';
      case 'quote': return '💌';
      case 'system': return '🔔';
      case 'event': return '🎉';
      default: return '📢';
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'message':
        return '메시지';
      case 'booking':
        return '예약';
      case 'review':
        return '리뷰';
      case 'quote':
        return '견적';
      case 'system':
        return '시스템';
      case 'event':
        return '이벤트';
      default:
        return '알림';
    }
  };

  return (
    <PageLayout title="알림">
      <div className="notification-page" data-node-id="notification-page">
        {/* Notifications Container */}
        <div className="notification-container">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
            로딩 중...
          </div>
        ) : notifications.length === 0 ? (
          <div className="empty-notification">
            <p>알림이 없습니다</p>
          </div>
        ) : (
          <div className="notification-list">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`notification-item ${notif.isRead ? 'read' : 'unread'} notification-type-${notif.type || 'default'}`}
                onClick={() => {
                  if (!notif.isRead) {
                    handleMarkAsRead(notif.id);
                  }
                  // 알림 타입에 따라 페이지 이동
                  if (notif.type === 'review' && notif.designerId && notif.bookingId) {
                    navigate('/write-review', {
                      state: {
                        designerId: notif.designerId,
                        designerName: notif.designerName || '',
                        bookingId: notif.bookingId,
                      },
                    });
                  } else if (notif.type === 'quote' || notif.type === 'booking') {
                    // 견적/예약 관련 알림 클릭 시, 견적 알림 전용 페이지로 이동
                    navigate('/quote-alerts');
                  } else if (notif.chatRoomId) {
                    // 그 외 채팅방이 연결된 알림은 해당 채팅방으로 이동
                    navigate(`/chat/${notif.chatRoomId}`);
                  }
                }}
              >
                <div className="notification-icon">{getIcon(notif.type)}</div>
                <div className="notification-content">
                  <div className="notification-header-row">
                    <h3>{notif.title}</h3>
                    <span className="notification-type-badge">
                      {getTypeLabel(notif.type)}
                    </span>
                  </div>
                  <p>{notif.message}</p>
                  <span className="notification-time">{notif.time}</span>
                </div>
                <button
                  className="close-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteNotification(notif.id);
                  }}
                  aria-label="Close notification"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      </div>
    </PageLayout>
  );
}
