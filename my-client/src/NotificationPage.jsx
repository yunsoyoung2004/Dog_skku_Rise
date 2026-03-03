import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, query, where, onSnapshot, orderBy, updateDoc, doc } from 'firebase/firestore';
import { auth, db } from './firebase';
import './NotificationPage.css';

const logoImg = "https://www.figma.com/api/mcp/asset/d3aedc85-e031-473e-aa91-014601f437ff";

export default function NotificationPage() {
  const navigate = useNavigate();
  const [user] = useAuthState(auth);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = loadNotifications();
    return () => {
      if (unsubscribe) unsubscribe();
    };
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

  const loadNotifications = async () => {
    if (!user) {
      navigate('/login');
      return () => {};
    }

    setLoading(true);
    try {
      // Firestore에서 실시간 알림 가져오기
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', user.uid),
        orderBy('timestamp', 'desc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const notifData = snapshot.docs.map((doc) => ({
          docId: doc.id,
          ...doc.data(),
          time: formatTime(doc.data().timestamp)
        }));
        setNotifications(notifData);
        setLoading(false);
      }, (error) => {
        console.error('알림 로드 오류:', error);
        // 임시 데이터로 폴백
        setNotifications([
          {
            id: 1,
            type: 'message',
            title: '새 메시지가 도착했습니다',
            message: '디자이너 홍길동이 메시지를 보냈습니다.',
            time: '5분 전',
            read: false
          }
        ]);
        setLoading(false);
      });

      return unsubscribe;
    } catch (err) {
      console.error('알림 설정 오류:', err);
      setLoading(false);
      return () => {};
    }
  };

  const markAsRead = async (notifId) => {
    try {
      const notifRef = doc(db, 'notifications', notifId);
      await updateDoc(notifRef, { read: true });
    } catch (err) {
      console.error('알림 읽음 처리 실패:', err);
    }
  };

  const handleClearNotification = (docId) => {
    setNotifications(notifications.filter(notif => notif.docId !== docId));
  };

  const getIcon = (type) => {
    switch (type) {
      case 'message': return '💬';
      case 'appointment': return '📅';
      case 'review': return '⭐';
      case 'system': return '🔔';
      default: return '📢';
    }
  };

  return (
    <div className="notification-page" data-node-id="notification-page">
      {/* Header */}
      <div className="notification-header">
        <div className="notification-logo">
          <img src={logoImg} alt="멍빗어" />
        </div>
        <h1>알림</h1>
      </div>

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
                key={notif.docId}
                className={`notification-item ${notif.read ? 'read' : 'unread'}`}
                onClick={() => {
                  if (!notif.read) {
                    markAsRead(notif.docId);
                  }
                }}
              >
                <div className="notification-icon">{getIcon(notif.type)}</div>
                <div className="notification-content">
                  <h3>{notif.title}</h3>
                  <p>{notif.message}</p>
                  <span className="notification-time">{notif.time}</span>
                </div>
                <button
                  className="close-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClearNotification(notif.docId);
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

      {/* Bottom Navigation */}
      <div className="notification-nav">
        <button onClick={() => navigate('/dashboard')}>🏠</button>
        <button onClick={() => navigate('/search')}>💼</button>
        <button onClick={() => navigate('/chat')}>💬</button>
        <button onClick={() => navigate('/mypage')}>👤</button>
      </div>
    </div>
  );
}
