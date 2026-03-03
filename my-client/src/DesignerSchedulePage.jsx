import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { auth, db } from './firebase';
import './DesignerPageNav.css';
import './DesignerSchedulePage.css';

export default function DesignerSchedulePage() {
  const navigate = useNavigate();
  const [user] = useAuthState(auth);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/designer-login');
      return;
    }

    const loadBookings = async () => {
      try {
        setLoading(true);
        const q = query(
          collection(db, 'bookings'),
          where('designerId', '==', user.uid)
        );
        const snap = await getDocs(q);
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setBookings(data);
      } catch (err) {
        console.error('일정 로드 실패:', err);
      } finally {
        setLoading(false);
      }
    };

    loadBookings();
  }, [user, navigate]);

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const monthName = currentMonth.toLocaleString('ko-KR', { month: 'long', year: 'numeric' });
  const calendarDays = renderCalendar();

  const isSameDate = (tsOrDate, target) => {
    if (!tsOrDate) return false;
    const d = tsOrDate.toDate ? tsOrDate.toDate() : new Date(tsOrDate);
    return (
      d.getFullYear() === target.getFullYear() &&
      d.getMonth() === target.getMonth() &&
      d.getDate() === target.getDate()
    );
  };

  const dailyBookings = bookings.filter((b) =>
    isSameDate(b.bookingDate || b.date, selectedDate)
  );

  return (
    <div className="designer-page">
      <div className="designer-page-header">
        <button onClick={() => navigate(-1)}>←</button>
        <h1>일정</h1>
      </div>

      <div className="designer-content">
        {/* Calendar */}
        <div className="calendar-header">
          <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}>
            ←
          </button>
          <span style={{ fontWeight: '600' }}>{monthName}</span>
          <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}>
            →
          </button>
        </div>

        <div className="calendar">
          <div className="calendar-weekdays">
            <div>일</div>
            <div>월</div>
            <div>화</div>
            <div>수</div>
            <div>목</div>
            <div>금</div>
            <div>토</div>
          </div>
          <div className="calendar-days">
            {calendarDays.map((day, index) => {
              const dayDate = day
                ? new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
                : null;
              const hasBooking = dayDate && bookings.some((b) => isSameDate(b.bookingDate || b.date, dayDate));

              return (
                <button
                  key={index}
                  className={`calendar-day ${
                    day && day === selectedDate.getDate() ? 'active' : ''
                  } ${day && isSameDate(new Date(), dayDate) ? 'today' : ''} ${
                    hasBooking ? 'has-booking' : ''
                  }`}
                  onClick={() => {
                    if (day) {
                      setSelectedDate(dayDate);
                    }
                  }}
                  disabled={!day}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        {/* Schedule List */}
        <h3 style={{ marginTop: '20px', marginBottom: '12px' }}>
          {selectedDate.toLocaleDateString('ko-KR')} 예약
        </h3>
        
        {loading ? (
          <div className="empty-state">일정을 불러오는 중입니다...</div>
        ) : dailyBookings.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>📅</div>
            <p>예약이 없습니다</p>
          </div>
        ) : (
          <div className="schedule-list">
            {dailyBookings.map((item) => (
              <div key={item.id} className="schedule-item">
                <div className="schedule-time">{item.timeSlot || item.time}</div>
                <div className="schedule-details">
                  고객: {item.customerName || item.userName || '-'} | 강아지: {item.dogName || '-'}
                </div>
              </div>
            ))}
          </div>
        )}
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
