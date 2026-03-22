import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, query, where, getDocs, doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from './firebase';
import AlertModal from './components/AlertModal';
import TutorialModal from './components/TutorialModal';
import './DesignerPageNav.css';
import './DesignerDashboard.css';

const logoImg = "https://www.figma.com/api/mcp/asset/3536782b-2696-4419-ba6a-95a020af5338";

// 달력 컴포넌트
function DesignerCalendar({ reservationsByDate, onDateSelect }) {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const firstDay = new Date(currentYear, currentMonth, 1);
  const lastDay = new Date(currentYear, currentMonth + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  const days = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

  return (
    <div className="dd-calendar">
      <div className="dd-calendar-header">
        <h3 className="dd-calendar-month">{currentYear}년 {currentMonth + 1}월</h3>
      </div>
      <div className="dd-calendar-weekdays">
        {dayNames.map((day) => (
          <div key={day} className="dd-calendar-weekday">{day}</div>
        ))}
      </div>
      <div className="dd-calendar-grid">
        {days.map((day, idx) => {
          const dateKey = day
            ? `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            : null;
          const hasReservation = dateKey && reservationsByDate[dateKey] && reservationsByDate[dateKey].length > 0;
          const isToday = day === today.getDate() && currentMonth === today.getMonth();

          return (
            <div
              key={idx}
              className={`dd-calendar-day ${isToday ? 'today' : ''} ${day ? '' : 'empty'} ${hasReservation ? 'has-reservation' : ''}`}
              onClick={() => {
                if (day && hasReservation) {
                  onDateSelect(dateKey, reservationsByDate[dateKey]);
                }
              }}
            >
              {day && (
                <>
                  <span className="dd-calendar-day-num">{day}</span>
                  {hasReservation && (
                    <span className="dd-calendar-dot" />
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function DesignerDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user] = useAuthState(auth);
  const [designer, setDesigner] = useState(null);
  const [stats, setStats] = useState({
    quotes: 0,
    reservations: 0,
    reviews: 0,
    messages: 0
  });
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [reservationsByDate, setReservationsByDate] = useState({});
  const [showTutorial, setShowTutorial] = useState(false);
  
  // 특정 고객의 예약만 보이는 모드
  const customerUserId = location.state?.customerUserId;
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedReservations, setSelectedReservations] = useState([]);
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

  // 디자이너용 알림(종 아이콘) 뱃지 카운트 실시간 구독
  useEffect(() => {
    if (!user) {
      setUnreadNotificationCount(0);
      return;
    }

    const userRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(
      userRef,
      (docSnap) => {
        const count = docSnap.data()?.unreadNotificationCount || 0;
        setUnreadNotificationCount(count);
      },
      (error) => {
        console.warn('디자이너 알림 수 로드 실패:', error);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // 최초 1회 튜토리얼 자동 오픈 (디자이너)
  useEffect(() => {
    if (!user) return;
    const storageKey = `tutorial_seen_designer_${user.uid}`;
    if (!localStorage.getItem(storageKey)) {
      setShowTutorial(true);
      localStorage.setItem(storageKey, '1');
    }
  }, [user]);

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

      // 예약 쿼리 조건부 구성
      let reservationsQuery;
      if (customerUserId) {
        reservationsQuery = query(
          collection(db, 'bookings'),
          where('designerId', '==', user.uid),
          where('userId', '==', customerUserId)
        );
      } else {
        reservationsQuery = query(
          collection(db, 'bookings'),
          where('designerId', '==', user.uid)
        );
      }
      
      const reservationsSnap = await getDocs(reservationsQuery);

      // 예약을 날짜별로 정렬
      const dateMap = {};
      reservationsSnap.forEach(doc => {
        const booking = { id: doc.id, ...doc.data() };
        
        // customerUserId 모드: 진행 중인 예약만 표시 (상태: pending, confirmed)
        if (customerUserId && booking.status && !['pending', 'confirmed'].includes(booking.status)) {
          return;
        }
        
        const dateStr = booking.reservationDate || booking.date;
        if (dateStr) {
          const date = typeof dateStr === 'string' ? dateStr.split('T')[0] : dateStr;
          if (!dateMap[date]) {
            dateMap[date] = [];
          }
          dateMap[date].push(booking);
        }
      });
      setReservationsByDate(dateMap);

      const reviewsSnap = await getDocs(query(
        collection(db, 'reviews'),
        where('designerId', '==', user.uid)
      ));

      const chatRoomsSnap = await getDocs(query(
        collection(db, 'chatRooms'),
        where('designerId', '==', user.uid)
      ));

      // 아직 응답하지 않은 견적 요청만 카운트 (status: 'pending')
      const pendingQuotesCount = quotesSnap.docs.filter(doc => {
        const data = doc.data();
        return data.status === 'pending' || !data.status;
      }).length;

      setStats({
        quotes: quotesSnap.size,
        reservations: reservationsSnap.size,
        reviews: reviewsSnap.size,
        messages: chatRoomsSnap.size
      });

      setShowQuoteAlert(pendingQuotesCount > 0);
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
      {/* Header (사용자 헤더와 동일 구조) */}
      <header className="dd-header">
        {customerUserId && (
          <button
            type="button"
            className="dd-back-btn"
            onClick={() => navigate(-1)}
          >
            ←
          </button>
        )}
        <div 
          className="dd-header-left"
          onClick={() => navigate('/designer-dashboard')}
        >
          <img src={logoImg} alt="멍빗어" className="dd-logo-img" />
          <h1 className="dd-logo-text">{customerUserId ? '예약 일정' : '멍빗어'}</h1>
        </div>
        <div className="dd-header-right">
          <button
            type="button"
            className="dd-help-btn"
            onClick={() => setShowTutorial(true)}
            aria-label="튜토리얼 열기"
          >
            ?
          </button>
          <button 
            className="dd-notification-btn"
            onClick={() => navigate('/notification')}
            type="button"
            aria-label="알림"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {unreadNotificationCount > 0 && (
              <span className="dd-notification-badge">
                {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {showQuoteAlert && (
        <AlertModal
          isOpen={showQuoteAlert}
          title="새 견적 요청이 있습니다"
          text="고객이 보낸 견적서를 확인하고 응답해 주세요."
          primaryButtonText="견적서 바로 확인하기"
          onPrimaryClick={() => {
            setShowQuoteAlert(false);
            navigate('/designer-quotes-check');
          }}
          secondaryButtonText="나중에 볼게요"
          onSecondaryClick={() => setShowQuoteAlert(false)}
          variant="quote"
        />
      )}

      {showProfileReminder && (
        <AlertModal
          isOpen={showProfileReminder}
          title="프로필 정보를 먼저 입력해 주세요"
          text="위치, 소개, 전문 분야 등이 입력되지 않으면 고객님들께 디자이너 정보가 제대로 표시되지 않습니다."
          primaryButtonText="마이페이지에서 정보 입력하기"
          onPrimaryClick={() => navigate('/designer-profile')}
          secondaryButtonText="나중에 할게요"
          onSecondaryClick={() => setShowProfileReminder(false)}
          variant="profile"
        />
      )}

      <TutorialModal
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
        variant="designer"
      />

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
          </div>
          <div className="dd-briefing-line" />
          <div className="dd-briefing-list">
            {(() => {
              // 다가오는 예약 찾기 (오늘 이후)
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              
              const upcomingDates = Object.keys(reservationsByDate)
                .filter(dateStr => {
                  const [year, month, day] = dateStr.split('-').map(Number);
                  const reservationDate = new Date(year, month - 1, day);
                  return reservationDate >= today;
                })
                .sort();
              
              if (upcomingDates.length === 0) {
                return (
                  <div className="dd-locked-panel">
                    <div className="dd-locked-icon">📅</div>
                    <p className="dd-locked-text">
                      다가오는 미용이 없습니다.
                    </p>
                  </div>
                );
              }
              
              // 가장 가까운 예약 표시
              const nextDate = upcomingDates[0];
              const nextReservations = reservationsByDate[nextDate];
              
              return (
                <div>
                  <div className="dd-next-reservation">
                    <div className="dd-next-date-label">{nextDate}</div>
                    <div className="dd-reservation-list">
                      {nextReservations.map((res) => (
                        <div key={res.id} className="dd-reservation-item">
                          <div className="dd-res-dog">{res.dogName || '강아지'}</div>
                          <div className="dd-res-time">{res.reservationTime || res.time || '시간 미정'}</div>
                          <div className="dd-res-customer">{res.customerName || '고객'}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}
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
            onClick={() => {}}
            disabled
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
              <span className="menu-lock">🔒 잠금</span>
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
