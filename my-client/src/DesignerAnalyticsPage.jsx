import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import AlertModal from './components/AlertModal';
import './DesignerPageNav.css';
import './DesignerAnalyticsPage.css';

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

.analytics-card {
  background: white;
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.analytics-card h3 {
  margin: 0 0 12px 0;
  font-size: 15px;
  font-weight: 600;
  color: #999;
  text-transform: uppercase;
}

.analytics-number {
  font-size: 28px;
  font-weight: 700;
  color: #FF6B6B;
}

.analytics-label {
  font-size: 13px;
  color: #999;
  margin-top: 4px;
}

.chart {
  background: #f5f5f5;
  padding: 16px;
  border-radius: 8px;
  margin-top: 12px;
  height: 150px;
  display: flex;
  align-items: flex-end;
  gap: 8px;
}

.bar {
  flex: 1;
  background: #FF6B6B;
  border-radius: 4px;
  opacity: 0.7;
}

.bottom-nav {
  display: flex;
  justify-content: space-around;
  padding: 12px 0;
  background: white;
  border-top: 1px solid #e0e0e0;
  position: sticky;
  bottom: 0;
}

.bottom-nav button {
  flex: 1;
  padding: 12px;
  border: none;
  background: none;
  font-size: 24px;
  cursor: pointer;
}
`;

export default function DesignerAnalyticsPage() {
  const navigate = useNavigate();
  const [user] = useAuthState(auth);
  const [alert, setAlert] = useState(null);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  useEffect(() => {
    if (!user) {
      navigate('/designer-login');
      return;
    }
    // 디자이너 알림 갯수 로드
    const loadNotifications = async () => {
      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        setUnreadNotificationCount(userSnap.data()?.unreadNotificationCount || 0);
      } catch (e) {
        console.warn('디자이너 알림을 로드 실패:', e);
      }
    };
    loadNotifications();
  }, [user, navigate]);

  return (
    <div className="designer-page">
      <AlertModal
        isOpen={!!alert}
        title={alert?.title}
        text={alert?.text}
        primaryButtonText="확인"
        onPrimaryClick={() => setAlert(null)}
      />
      <div className="designer-page-header">
        <button onClick={() => navigate(-1)}>←</button>
        <h1>통계</h1>
        <button
          type="button"
          className="designer-header-notification"
          onClick={() => navigate('/notification')}
          aria-label="알림"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 8a6 6 0 0 0-12 0c0 5-2 7-2 7h16s-2-2-2-7" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          {unreadNotificationCount > 0 && (
            <span className="designer-notification-badge">
              {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
            </span>
          )}
        </button>
      </div>

      <div className="designer-content">
        <div className="analytics-card">
          <h3>월간 매출</h3>
          <div className="analytics-number">1,250,000원</div>
          <div className="analytics-label">예약 12건 × 평균 가격</div>
        </div>

        <div className="analytics-card">
          <h3>이달 예약</h3>
          <div className="analytics-number">12</div>
          <div className="analytics-label">지난달 대비 +3건</div>
        </div>

        <div className="analytics-card">
          <h3>평균 평점</h3>
          <div className="analytics-number">4.8</div>
          <div className="analytics-label">12건 리뷰</div>
        </div>

        <div className="analytics-card">
          <h3>주간 예약 현황</h3>
          <div className="chart">
            <div className="bar" style={{ height: '60%' }}></div>
            <div className="bar" style={{ height: '75%' }}></div>
            <div className="bar" style={{ height: '50%' }}></div>
            <div className="bar" style={{ height: '80%' }}></div>
            <div className="bar" style={{ height: '65%' }}></div>
            <div className="bar" style={{ height: '90%' }}></div>
            <div className="bar" style={{ height: '55%' }}></div>
          </div>
          <div style={{ fontSize: '12px', color: '#999', marginTop: '8px', textAlign: 'center' }}>
            월 화 수 목 금 토 일
          </div>
        </div>
      </div>

      <div className="designer-bottom-nav">
        <button className="designer-nav-btn" onClick={() => navigate('/designer-dashboard')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
          </svg>
        </button>
        <button className="designer-nav-btn" onClick={() => navigate('/designer-messages')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M21 11.5a8.38 8.38 0 0 1-1.9 5.4 8.5 8.5 0 0 1-6.6 3.1 8.38 8.38 0 0 1-5.4-1.9L3 21l2.9-4.1A8.38 8.38 0 0 1 4 11.5 8.5 8.5 0 0 1 7.1 4.9 8.38 8.38 0 0 1 12.5 3a8.5 8.5 0 0 1 6 2.5 8.5 8.5 0 0 1 2.5 6z"/>
          </svg>
        </button>
        <button className="designer-nav-btn" onClick={() => navigate('/designer-profile')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
