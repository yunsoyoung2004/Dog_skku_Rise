import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './firebase';
import { createBooking } from './services';
import './CalendarPage.css';

const logoImg = "/dog-logo.png";

export default function CalendarPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user] = useAuthState(auth);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 오늘(당일)과 그 이전 날짜는 예약 불가 처리
  const today = new Date();
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const timeSlots = [
    '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'
  ];

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    setSelectedDate(null);
    setSelectedTime(null);
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    setSelectedDate(null);
    setSelectedTime(null);
  };

  const handleConfirmBooking = async () => {
    setError('');

    if (!user) {
      setError('로그인이 필요합니다');
      navigate('/login');
      return;
    }

    if (!selectedDate || !selectedTime) {
      setError('날짜와 시간을 선택해주세요');
      return;
    }

    const bookingDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), selectedDate);
    const [hours, minutes] = selectedTime.split(':').map(Number);
    bookingDate.setHours(hours, minutes);

    // 당일 및 과거 날짜는 예약 불가 (UI 방어와 별개로 한 번 더 체크)
    const bookingMidnight = new Date(bookingDate.getFullYear(), bookingDate.getMonth(), bookingDate.getDate());
    if (bookingMidnight <= todayMidnight) {
      setError('당일 예약은 불가능합니다. 내일부터 선택해주세요.');
      return;
    }

    setLoading(true);
    try {
      const result = await createBooking(user.uid, {
        designerId: location.state?.designerId || 'designer_1',
        bookingDate: bookingDate,
        timeSlot: selectedTime,
        notes: location.state?.notes || ''
      });

      if (result.success) {
        navigate('/payment', { state: { bookingId: result.bookingId } });
      }
    } catch (err) {
      console.error('❌ 예약 생성 실패:', err);
      setError('예약 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDayOfMonth = getFirstDayOfMonth(currentMonth);
  const calendarDays = [];

  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  return (
    <div className="calendar-page" data-node-id="511:3087">
      {/* Header */}
      <div className="calendar-header">
        <div className="calendar-logo">
          <img src={logoImg} alt="멍빗어" />
        </div>
        <h1>멍빗어</h1>
      </div>

      {/* Content */}
      <div className="calendar-container">
        <h2>예약 일정 선택</h2>

        {error && (
          <div style={{ padding: '10px', backgroundColor: '#ffeeee', color: '#cc0000', textAlign: 'center', marginBottom: '10px' }}>
            {error}
          </div>
        )}

        {/* Calendar */}
        <div className="calendar-section">
          <div className="calendar-header-info">
            <button className="month-nav" onClick={handlePrevMonth}>‹</button>
            <span>{currentMonth.getFullYear()}년 {currentMonth.getMonth() + 1}월</span>
            <button className="month-nav" onClick={handleNextMonth}>›</button>
          </div>

          <div className="calendar-grid">
            <div className="weekday">일</div>
            <div className="weekday">월</div>
            <div className="weekday">화</div>
            <div className="weekday">수</div>
            <div className="weekday">목</div>
            <div className="weekday">금</div>
            <div className="weekday">토</div>

            {calendarDays.map((day, idx) => {
              if (!day) {
                return (
                  <button
                    key={idx}
                    className="calendar-day empty"
                    disabled
                  />
                );
              }

              const cellDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
              const cellMidnight = new Date(cellDate.getFullYear(), cellDate.getMonth(), cellDate.getDate());
              const isPastOrToday = cellMidnight <= todayMidnight;

              return (
                <button
                  key={idx}
                  className={`calendar-day ${day === selectedDate ? 'selected' : ''} ${isPastOrToday ? 'disabled' : ''}`}
                  onClick={() => {
                    if (isPastOrToday) return;
                    setSelectedDate(day);
                    setSelectedTime(null);
                  }}
                  disabled={isPastOrToday}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        {/* Time Selection */}
        {selectedDate && (
          <div className="time-section">
            <h3>시간 선택</h3>
            <p className="date-display">{currentMonth.getFullYear()}년 {currentMonth.getMonth() + 1}월 {selectedDate}일</p>
            <div className="time-grid-calendar">
              {timeSlots.map((time) => (
                <button
                  key={time}
                  className={`time-btn ${selectedTime === time ? 'selected' : ''}`}
                  onClick={() => setSelectedTime(time)}
                  disabled={loading}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Confirm Button */}
        {selectedDate && selectedTime && (
          <button 
            className="calendar-confirm-btn"
            onClick={handleConfirmBooking}
            disabled={loading}
          >
            {loading ? '예약중...' : `예약 확인 (${currentMonth.getMonth() + 1}월 ${selectedDate}일 ${selectedTime})`}
          </button>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="calendar-bottom-nav">
          <button onClick={() => navigate('/dashboard')}>🏠</button>
          <button onClick={() => navigate('/designer')}>💼</button>
          <button onClick={() => navigate('/chat')}>💬</button>
          <button onClick={() => navigate('/mypage')}>
           <span className="nav-user-icon">👤</span>
          </button>
      </div>
    </div>
  );
}
