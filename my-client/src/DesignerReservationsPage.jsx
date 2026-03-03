import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { auth, db } from './firebase';
import './DesignerPageNav.css';
import './DesignerReservationsPage.css';

const styles = `
.designer-page {
  width: 100%;
  max-width: 393px;
  min-height: 100vh;
  background-color: #f5f5f5;
  font-family: 'Paperlogy', 'Gmarket Sans', -apple-system, sans-serif;
  color: #222;
  margin: 0 auto;
}

.designer-page-header {
  background-color: white;
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 12px;
}

.designer-page-header button {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  padding: 8px;
}

.designer-page-header h1 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  flex: 1;
}

.designer-content {
  padding: 16px;
}

.reservation-item {
  background: white;
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  border-left: 4px solid #2196F3;
}

.reservation-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10px;
}

.reservation-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.reservation-status {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  background-color: #e3f2fd;
  color: #1565c0;
}

.reservation-details {
  font-size: 13px;
  color: #666;
  margin: 10px 0;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #999;
}

.empty-state .icon {
  font-size: 48px;
  margin-bottom: 12px;
}

`;

export default function DesignerReservationsPage() {
  const navigate = useNavigate();
  const [user] = useAuthState(auth);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/designer-login');
      return;
    }
    loadReservations();
  }, [user, navigate]);

  const loadReservations = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, 'bookings'),
        where('designerId', '==', user.uid)
      );
      const snap = await getDocs(q);
      const reservationsData = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setReservations(reservationsData);
    } catch (err) {
      console.error('예약 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelReservation = async (bookingId) => {
    try {
      const bookingRef = doc(db, 'bookings', bookingId);
      await updateDoc(bookingRef, { status: 'cancelled' });
      loadReservations();
    } catch (err) {
      console.error('취소 실패:', err);
    }
  };

  return (
    <div className="designer-page">
      <style>{styles}</style>

      {/* Header */}
      <div className="designer-page-header">
        <button onClick={() => navigate(-1)}>←</button>
        <h1>예약 관리</h1>
      </div>

      {/* Content */}
      <div className="designer-content">
        {loading ? (
          <div style={{ padding: '20px', textAlign: 'center' }}>로딩 중...</div>
        ) : reservations.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📅</div>
            <p>예약이 없습니다</p>
          </div>
        ) : (
          reservations.map(res => (
            <div key={res.id} className="reservation-item">
              <div className="reservation-header">
                <h3>예약 #{res.id?.substring(0, 8)}</h3>
                <span className="reservation-status">
                  {res.status === 'cancelled' ? '취소됨' : '진행 중'}
                </span>
              </div>
              <div className="reservation-details">
                <p><strong>날짜:</strong> {res.bookingDate ? new Date(res.bookingDate).toLocaleDateString('ko-KR') : '-'}</p>
                <p><strong>시간:</strong> {res.timeSlot || '-'}</p>
                <p><strong>가격:</strong> {res.price?.toLocaleString() || '-'}원</p>
              </div>
              {res.status !== 'cancelled' && (
                <button
                  onClick={() => handleCancelReservation(res.id)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #f44336',
                    background: 'white',
                    color: '#f44336',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    marginTop: '10px',
                    fontWeight: '600'
                  }}
                >
                  취소
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Bottom Nav */}
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
