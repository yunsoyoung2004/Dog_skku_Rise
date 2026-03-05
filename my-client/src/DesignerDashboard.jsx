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
  const [showProfileReminder, setShowProfileReminder] = useState(false);
  const [showQuoteAlert, setShowQuoteAlert] = useState(false);

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

      let isProfileComplete = false;

      // 현재 사용자 정보 가져오기
      const userRef = collection(db, 'users');
      const q = query(userRef, where('__name__', '==', user.uid));
      const docs = await getDocs(q);
      
      if (!docs.empty) {
        const userData = { id: docs.docs[0].id, ...docs.docs[0].data() };

        const location = userData.location || '';
        const bio = userData.bio || '';
        const specialty = userData.specialty || '';

        // 위치와 소개만 입력되면 프로필을 "완료"로 간주
        isProfileComplete = Boolean(location.trim() && bio.trim());

        setDesigner({
          name: user.displayName || '미용사',
          email: user.email,
          rating: userData.rating || 0,
          reviewCount: userData.reviewCount || 0,
          specialty: specialty || '일반 미용',
          location: location || '위치 미설정'
        });
      }

      setShowProfileReminder(!isProfileComplete);

      // 통계 가져오기
      // - 견적 요청: quoteRequests 컬렉션에서 디자이너 기준
      const quotesSnap = await getDocs(query(
        collection(db, 'quoteRequests'),
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

      const chatRoomsSnap = await getDocs(query(
        collection(db, 'chatRooms'),
        where('designerId', '==', user.uid)
      ));

      const quotesCount = quotesSnap.size;

      setStats({
        quotes: quotesCount,
        reservations: reservationsSnap.size,
        reviews: reviewsSnap.size,
        messages: chatRoomsSnap.size
      });

      setShowQuoteAlert(quotesCount > 0);
    } catch (err) {
      console.error('데이터 로드 실패:', err);
    } finally {
      setLoading(false);
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
      </header>

      {showQuoteAlert && (
        <div className="dd-quote-alert-overlay">
          <div className="dd-quote-alert-modal">
            <h2 className="dd-quote-alert-title">새 견적 요청이 있습니다</h2>
            <p className="dd-quote-alert-text">
              고객이 보낸 견적서를 확인하고 응답해 주세요.
            </p>
            <div className="dd-quote-alert-actions">
              <button
                type="button"
                className="dd-quote-alert-primary"
                onClick={() => {
                  setShowQuoteAlert(false);
                  navigate('/designer-quotes-check');
                }}
              >
                견적서 바로 확인하기
              </button>
              <button
                type="button"
                className="dd-quote-alert-secondary"
                onClick={() => setShowQuoteAlert(false)}
              >
                나중에 볼게요
              </button>
            </div>
          </div>
        </div>
      )}

      {showProfileReminder && (
        <div className="dd-profile-reminder-overlay">
          <div className="dd-profile-reminder-modal">
            <h2 className="dd-profile-reminder-title">프로필 정보를 먼저 입력해 주세요</h2>
            <p className="dd-profile-reminder-text">
              위치, 소개, 전문 분야 등이 입력되지 않으면
              <br />
              고객님들께 디자이너 정보가 제대로 표시되지 않습니다.
            </p>
            <div className="dd-profile-reminder-actions">
              <button
                type="button"
                className="dd-profile-reminder-primary"
                onClick={() => navigate('/designer-profile')}
              >
                마이페이지에서 정보 입력하기
              </button>
              <button
                type="button"
                className="dd-profile-reminder-secondary"
                onClick={() => setShowProfileReminder(false)}
              >
                나중에 할게요
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="designer-content dd-main">
        {/* 오늘의 AI 인사이트 카드 */}
        <section className="dd-ai-card">
          <p className="dd-section-title">AI 인사이트</p>
          {stats.quotes === 0 && stats.reservations === 0 && stats.reviews === 0 && stats.messages === 0 ? (
            <div className="dd-locked-panel dd-ai-locked">
              <div className="dd-locked-icon">🔒</div>
              <p className="dd-locked-text">
                견적, 예약, 후기, 채팅 데이터가 쌓이면
                <br />
                나만의 AI 인사이트가 제공됩니다.
              </p>
            </div>
          ) : (
            <div className="dd-ai-content">
              <div className="dd-ai-radar">
                <p className="dd-ai-caption">나의 활동 현황</p>
                <p className="dd-ai-subcaption">
                  견적 {stats.quotes}건 · 예약 {stats.reservations}건 · 후기 {stats.reviews}개
                </p>
              </div>
              <div className="dd-ai-graph">
                <p className="dd-ai-graph-title">채팅/응답 현황</p>
                <p className="dd-ai-graph-desc">채팅 요청 {stats.messages}건</p>
              </div>
            </div>
          )}
        </section>

        {/* 오늘의 브리핑 */}
        <section className="dd-briefing-section">
          <div className="dd-briefing-header">
            <span>오늘의 미용 브리핑</span>
            <span className="dd-briefing-count">총 {stats.reservations}건</span>
          </div>
          <div className="dd-briefing-line" />
          <div className="dd-briefing-list">
            {stats.reservations > 0 ? (
              <div className="dd-locked-panel">
                <div className="dd-locked-icon">📌</div>
                <p className="dd-locked-text">
                  오늘 예약이 {stats.reservations}건 있습니다.
                  <br />
                  상세 일정은 일정 메뉴에서 확인해 주세요.
                </p>
              </div>
            ) : (
              <div className="dd-locked-panel">
                <div className="dd-locked-icon">🔒</div>
                <p className="dd-locked-text">
                  예약이 들어오면 오늘의 미용 브리핑을 확인할 수 있어요.
                </p>
                <button className="dd-locked-button" disabled>
                  예약 대기 중
                </button>
              </div>
            )}
          </div>
        </section>

        {/* 이번 달 수익 & 채팅 요청 */}
        <section className="dd-summary-section">
          <p className="dd-summary-title">이번 달 수익</p>
          <div className="dd-summary-row">
            <div className="dd-summary-card dd-summary-card-large">
              <p className="dd-summary-amount">- 원</p>
              <p className="dd-summary-meta">이번 달 매칭 건수: {stats.reservations}건</p>
              {stats.reservations === 0 && (
                <p className="dd-summary-meta">🔒 매칭 데이터가 아직 없습니다.</p>
              )}
            </div>
            <div className="dd-summary-card dd-summary-card-small">
              <p className="dd-summary-label">새로운 채팅 요청</p>
              <p className="dd-summary-highlight">{stats.messages}건</p>
              {stats.messages === 0 && (
                <p className="dd-summary-meta">🔒 아직 도착한 채팅이 없습니다.</p>
              )}
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
            onClick={() => {
              if (stats.quotes > 0) navigate('/designer-quotes-check');
            }}
            disabled={stats.quotes === 0}
          >
            <span className="icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="3" y="4" width="18" height="16" rx="2" ry="2" />
                <path d="M7 9h10" />
                <path d="M7 13h6" />
              </svg>
            </span>
            <span className="label">견적 확인</span>
            <div className="menu-subtext">
              {stats.quotes > 0 ? (
                <span>{stats.quotes}건</span>
              ) : (
                <span className="menu-lock">🔒 잠금</span>
              )}
            </div>
          </button>

          <button 
            className="designer-menu-item"
            onClick={() => {
              if (stats.reviews > 0) navigate('/designer-reviews');
            }}
            disabled={stats.reviews === 0}
          >
            <span className="icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M12 3.5 14.5 9l5.5.4-4.2 3.4 1.4 5.2L12 15.8 6.8 18l1.4-5.2L4 9.4 9.5 9 12 3.5z" />
              </svg>
            </span>
            <span className="label">후기</span>
            <div className="menu-subtext">
              {stats.reviews > 0 ? (
                <span>{stats.reviews}개</span>
              ) : (
                <span className="menu-lock">🔒 잠금</span>
              )}
            </div>
          </button>

          <button 
            className="designer-menu-item"
            onClick={() => {
              if (stats.quotes > 0 || stats.reservations > 0) {
                navigate('/designer-analytics');
              }
            }}
            disabled={!(stats.quotes > 0 || stats.reservations > 0)}
          >
            <span className="icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="4" y="10" width="3" height="8" />
                <rect x="10.5" y="6" width="3" height="12" />
                <rect x="17" y="3" width="3" height="15" />
              </svg>
            </span>
            <span className="label">통계</span>
            <div className="menu-subtext">
              {stats.quotes > 0 || stats.reservations > 0 ? (
                <span>분석 가능</span>
              ) : (
                <span className="menu-lock">🔒 잠금</span>
              )}
            </div>
          </button>

          <button 
            className="designer-menu-item"
            onClick={() => {
              if (stats.reservations > 0) navigate('/designer-schedule');
            }}
            disabled={stats.reservations === 0}
          >
            <span className="icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="3" y="5" width="18" height="16" rx="2" ry="2" />
                <path d="M8 3v4" />
                <path d="M16 3v4" />
                <path d="M3 10h18" />
              </svg>
            </span>
            <span className="label">일정</span>
            <div className="menu-subtext">
              {stats.reservations > 0 ? (
                <span>{stats.reservations}건</span>
              ) : (
                <span className="menu-lock">🔒 잠금</span>
              )}
            </div>
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
