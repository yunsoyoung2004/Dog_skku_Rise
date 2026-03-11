import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './firebase';
import { getUserQuotes } from './services';
import PageLayout from './PageLayout';
import './NotificationPage.css';

export default function QuoteAlertPage() {
  const navigate = useNavigate();
  const [user] = useAuthState(auth);
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const list = await getUserQuotes(user.uid);
        setQuotes(list || []);
      } catch (e) {
        console.error('견적 알림 로드 실패:', e);
        setError('견적 알림을 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const formatStatus = (q) => {
    if (q.status === 'confirmed') return '확정됨';
    if (q.status === 'sent' || q.status === 'responded') return '응답 완료';
    return '대기 중';
  };

  const formatMessage = (q) => {
    if (q.status === 'confirmed') {
      return `${q.designerName || '디자이너'}와의 예약이 확정되었습니다.`;
    }
    if (q.status === 'sent' || q.status === 'responded') {
      return `${q.designerName || '디자이너'}가 견적을 보냈습니다.`;
    }
    return `${q.designerName || '디자이너'}에게 보낸 견적 요청입니다.`;
  };

  const formatTime = (quote) => {
    const ts = quote.createdAt;
    if (!ts) return '';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('ko-KR');
  };

  return (
    <PageLayout title="견적 알림">
      <div className="notification-page">
        <div className="notification-container">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
              로딩 중...
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#c00' }}>
              {error}
            </div>
          ) : quotes.length === 0 ? (
            <div className="empty-notification">
              <p>아직 견적 알림이 없습니다</p>
            </div>
          ) : (
            <div className="notification-list">
              {quotes.map((q) => (
                <div
                  key={q.id}
                  className={`notification-item ${q.status === 'confirmed' ? 'read' : 'unread'}`}
                  onClick={() => {
                    if (q.chatRoomId) {
                      navigate(`/chat/${q.chatRoomId}`);
                    } else {
                      navigate('/quote-detail');
                    }
                  }}
                >
                  <div className="notification-icon">
                    {q.status === 'confirmed' ? '📅' : '💌'}
                  </div>
                  <div className="notification-content">
                    <div className="notification-header-row">
                      <h3>{q.dogName || q.designerName || '견적 알림'}</h3>
                      <span className="notification-type-badge">{formatStatus(q)}</span>
                    </div>
                    <p>{formatMessage(q)}</p>
                    <span className="notification-time">{formatTime(q)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
