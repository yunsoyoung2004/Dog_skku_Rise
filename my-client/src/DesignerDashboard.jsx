import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from './firebase';
import './DesignerPageNav.css';
import './DesignerDashboard.css';

const logoImg = "https://www.figma.com/api/mcp/asset/a74ada5d-7974-4caa-89a9-1b46a6727731";

export default function DesignerDashboard() {
  const navigate = useNavigate();
  const [user] = useAuthState(auth);
  const [designer, setDesigner] = useState(null);
  const [stats, setStats] = useState({
    quotes: 0,
    reservations: 0,
    reviews: 0,
    messages: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/designer-login');
      return;
    }

    loadDesignerData();
  }, [user, navigate]);

  const loadDesignerData = async () => {
    try {
      setLoading(true);

      // 현재 사용자 정보 가져오기
      const userRef = collection(db, 'users');
      const q = query(userRef, where('__name__', '==', user.uid));
      const docs = await getDocs(q);
      
      if (!docs.empty) {
        const userData = { id: docs.docs[0].id, ...docs.docs[0].data() };
        setDesigner({
          name: user.displayName || '미용사',
          email: user.email,
          rating: userData.rating || 0,
          reviewCount: userData.reviewCount || 0,
          specialty: userData.specialty || '일반 미용',
          location: userData.location || '위치 미설정'
        });
      }

      // 통계 가져오기 (임시: 실제 데이터는 Firestore에서)
      const quotesSnap = await getDocs(query(
        collection(db, 'quotes'),
        where('designerId', '==', user.uid)
      ));

      const reservationsSnap = await getDocs(query(
        collection(db, 'bookings'),
        where('designerId', '==', user.uid)
      ));

      const reviewsSnap = await getDocs(query(
        collection(db, 'reviews'),
        where('designerId', '==', user.uid)
      ));
      // 오늘 일정 개수 계산
      let todayReservations = 0;
      const today = new Date();
      reservationsSnap.forEach((docSnap) => {
        const data = docSnap.data();
        const bookingDate = data.bookingDate || data.date;
        if (!bookingDate) return;
        const d = bookingDate.toDate ? bookingDate.toDate() : new Date(bookingDate);
        if (
          d.getFullYear() === today.getFullYear() &&
          d.getMonth() === today.getMonth() &&
          d.getDate() === today.getDate()
        ) {
          todayReservations += 1;
        }
      });

      setStats({
        quotes: quotesSnap.size,
        reservations: reservationsSnap.size,
        reservationsToday: todayReservations,
        reviews: reviewsSnap.size,
        messages: 5 // 임시
      });
    } catch (err) {
      console.error('데이터 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/designer-login');
    } catch (err) {
      console.error('로그아웃 실패:', err);
    }
  };

  if (loading) {
    return (
      <div className="designer-page">
        <div className="designer-loading">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="designer-page">
      {/* Header (디자이너 전용 로고 영역) */}
      <header className="dd-header">
        <div className="dd-header-left">
          <button
            type="button"
            className="dd-logo-btn"
            onClick={() => navigate('/designer-dashboard')}
          >
            <img src={logoImg} alt="멍빗어" className="dd-logo-img" />
          </button>
          <span className="dd-logo-text">멍빗어</span>
        </div>
        <div className="dd-header-right">
          <button type="button" className="dd-icon-btn" aria-label="검색">
            🔍
          </button>
          <button type="button" className="dd-icon-btn" aria-label="알림">
            ↗
          </button>
        </div>
      </header>

      <main className="designer-content dd-main">
        {/* 오늘의 AI 인사이트 카드 */}
        <section className="dd-ai-card">
          <p className="dd-section-title">오늘의 AI 인사이트</p>
          <div className="dd-ai-content">
            <div className="dd-ai-radar">
              <p className="dd-ai-caption">나의 매칭 경쟁력</p>
              <p className="dd-ai-subcaption">가격 · 위치 · 리뷰 · 응답속도</p>
            </div>
            <div className="dd-ai-graph">
              <p className="dd-ai-graph-title">나의 견적 성사율</p>
              <p className="dd-ai-graph-desc">현재 15% 상향 중 · 응답 경쟁력이 올라갔습니다!</p>
            </div>
          </div>
        </section>

        {/* 오늘의 브리핑 */}
        <section className="dd-briefing-section">
          <div className="dd-briefing-header">
            <span>오늘의 미용 브리핑</span>
            <span className="dd-briefing-count">총 {stats.reservations}건</span>
          </div>
          <div className="dd-briefing-line" />
          <div className="dd-briefing-list">
            <div className="dd-briefing-card">
              <p className="dd-briefing-dog">초코 · 푸들, 5KG</p>
              <p className="dd-briefing-time">14:00</p>
              <div className="dd-briefing-tags">
                <span>예민견</span>
                <span>노령견</span>
                <span>곰돌이 컷</span>
              </div>
              <p className="dd-briefing-note">위치: 강남역 인근 샵 142</p>
            </div>
            <div className="dd-briefing-card">
              <p className="dd-briefing-dog">모카 · 포메라니안, 4KG</p>
              <p className="dd-briefing-time">16:00</p>
              <div className="dd-briefing-tags">
                <span>스포팅</span>
                <span>부분 미용</span>
              </div>
              <p className="dd-briefing-note">위치: 예약 상세에서 확인 가능</p>
            </div>
          </div>
        </section>

        {/* 이번 달 수익 & 채팅 요청 */}
        <section className="dd-summary-section">
          <p className="dd-summary-title">이번 달 수익</p>
          <div className="dd-summary-row">
            <div className="dd-summary-card dd-summary-card-large">
              <p className="dd-summary-amount">3,700,000원</p>
              <p className="dd-summary-meta">이번 달 매칭 건수: {stats.reservations}건</p>
              <p className="dd-summary-meta">누적 매칭: 129건 (예시)</p>
            </div>
            <div className="dd-summary-card dd-summary-card-small">
              <p className="dd-summary-label">새로운 채팅 요청</p>
              <p className="dd-summary-highlight">{stats.messages}건</p>
              <button
                type="button"
                className="dd-summary-link"
                onClick={() => navigate('/designer-messages')}
              >
                확인하러 가기 &gt;
              </button>
            </div>
          </div>
        </section>

        {/* 빠른 이동 메뉴 */}
        <section className="designer-menu">
          <button 
            className="designer-menu-item"
            onClick={() => navigate('/designer-quotes-check')}
          >
            <span className="icon">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <rect x="4" y="4" width="16" height="16" rx="3" ry="3"/>
                <path d="M8 12l3 3 5-6"/>
              </svg>
            </span>
            <span className="label">견적 확인</span>
            <span className="count">{stats.quotes}건</span>
          </button>

          <button 
            className="designer-menu-item"
            onClick={() => navigate('/designer-reviews')}
          >
            <span className="icon">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M12 3l2.3 4.7L19 8.5l-3.5 3.4.8 4.9L12 14.8l-4.3 2 0.8-4.9L5 8.5l4.7-.8L12 3z"/>
              </svg>
            </span>
            <span className="label">후기</span>
            <span className="count">{stats.reviews}개</span>
          </button>

          <button 
            className="designer-menu-item"
            onClick={() => navigate('/designer-analytics')}
          >
            <span className="icon">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M5 19V9"/>
                <path d="M12 19V5"/>
                <path d="M19 19v-7"/>
              </svg>
            </span>
            <span className="label">통계</span>
            <span className="count">예약 {stats.reservations}건</span>
          </button>

          <button 
            className="designer-menu-item"
            onClick={() => navigate('/designer-schedule')}
          >
            <span className="icon">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <rect x="4" y="5" width="16" height="15" rx="2" ry="2"/>
                <path d="M9 3v4"/>
                <path d="M15 3v4"/>
                <path d="M4 10h16"/>
              </svg>
            </span>
            <span className="label">일정</span>
            <span className="count">오늘 {stats.reservationsToday || 0}건</span>
          </button>
        </section>

      </main>

      {/* Bottom Nav (디자이너 전용, 고객 페이지와 동일한 디자인 시스템) */}
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
