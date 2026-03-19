import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './firebase';
import { cancelBooking, completeBooking } from './services';
import AlertModal from './components/AlertModal';
import './BookingConfirmationPage.css';

export default function BookingConfirmationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user] = useAuthState(auth);
  const [bookingInfo, setBookingInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    // 예약 정보는 location.state에서 전달됨 (booking 객체 우선)
    if (location.state?.booking) {
      const b = location.state.booking;
      setBookingInfo({
        bookingDocId: b.docId || b.id || null,
        bookingId: b.bookingId || b.id || location.state.bookingId || '예약번호 미지정',
        designerName: b.designerName || '디자이너',
        dogName: b.dogName || b.dog || '반려견',
        date: (b.bookingDate || b.preferredDate)
          ? (b.bookingDate?.toDate ? b.bookingDate.toDate() : new Date(b.bookingDate || b.preferredDate)).toLocaleDateString('ko-KR')
          : new Date().toLocaleDateString('ko-KR'),
        time: b.timeSlot || b.preferredTime || '시간 미정',
        location: b.location || b.knowledge || '장소 미정',
        amount: b.price || b.amount || 0,
      });
      setLoading(false);
      return;
    }

    if (location.state?.bookingId) {
      // TODO: bookingId로 Firestore에서 예약 상세를 조회하는 로직 추가 가능
      setBookingInfo({
        bookingDocId: null,
        bookingId: location.state.bookingId,
        designerName: '미용사 홍길동',
        dogName: '우리 귀여운 강아지 (푸들)',
        date: new Date().toLocaleDateString('ko-KR'),
        time: '10:00 ~ 11:30',
        location: '서울시 강남구 테헤란로 123',
        amount: 65000,
      });
    }
    setLoading(false);
  }, [location]);

  if (loading) {
    return (
      <div className="booking-confirmation-page">
        <div style={{ textAlign: 'center', padding: '20px' }}>로딩 중...</div>
      </div>
    );
  }

  const handleComplete = async () => {
    if (!bookingInfo?.bookingDocId) {
      setAlert({
        title: '정보 없음',
        text: '예약 정보를 찾을 수 없습니다.\n나중에 마이페이지에서 다시 시도해 주세요.',
      });
      return;
    }

    const ok = window.confirm('미용을 완료 처리하시겠습니까?\n완료 처리된 예약은 다가오는 예약에서 사라지고, 미용 내역에 저장됩니다.');
    if (!ok) return;

    try {
      await completeBooking(bookingInfo.bookingDocId);
      setAlert({
        title: '완료',
        text: '미용이 완료 처리되었습니다.',
      });
      setTimeout(() => navigate('/mypage'), 1000);
    } catch (e) {
      console.error('미용 완료 처리 실패:', e);
      setAlert({
        title: '처리 실패',
        text: '미용 완료 처리에 실패했습니다.\n잠시 후 다시 시도해 주세요.',
      });
    }
  };

  const handleCancel = async () => {
    if (!bookingInfo?.bookingDocId) {
      setAlert({
        title: '정보 없음',
        text: '예약 정보를 찾을 수 없습니다.\n나중에 마이페이지에서 다시 시도해 주세요.',
      });
      return;
    }

    const ok = window.confirm('정말 예약을 철회하시겠습니까?\n합의된 내용입니까?');
    if (!ok) return;

    try {
      await cancelBooking(bookingInfo.bookingDocId);
      setAlert({
        title: '철회 완료',
        text: '예약이 철회되었습니다.',
      });
      setTimeout(() => navigate('/mypage'), 1000);
    } catch (e) {
      console.error('예약 철회 실패:', e);
      setAlert({
        title: '철회 실패',
        text: '예약 철회에 실패했습니다.\n잠시 후 다시 시도해 주세요.',
      });
    }
  };

  return (
    <div className="booking-confirmation-page" data-node-id="booking-confirmation">
      <AlertModal
        isOpen={!!alert}
        title={alert?.title || '알림'}
        text={alert?.text || ''}
        primaryButtonText="확인"
        onPrimaryClick={() => setAlert(null)}
        variant="default"
      />

      {/* Header */}
      <div className="confirmation-header">
        <button className="confirmation-back-btn" onClick={() => navigate('/dashboard')}>←</button>
        <h1>예약 확인</h1>
        <div style={{ width: '24px' }}></div>
      </div>

      {/* Content */}
      <div className="confirmation-container">
        {/* Success Message */}
        <div className="success-box">
          <div className="success-icon">✓</div>
          <h2>예약이 완료되었습니다!</h2>
          <p>미용 예약이 성공적으로 완료되었습니다</p>
        </div>

        {/* Booking Details */}
        <div className="booking-details">
          <h3>예약 정보</h3>
          <div className="detail-item">
            <span className="label">예약번호</span>
            <span className="value">{bookingInfo?.bookingId || 'BK202402251000'}</span>
          </div>
          <div className="detail-item">
            <span className="label">디자이너</span>
            <span className="value">{bookingInfo?.designerName || '미용사 홍길동'}</span>
          </div>
          <div className="detail-item">
            <span className="label">강아지</span>
            <span className="value">{bookingInfo?.dogName || '우리 귀여운 강아지 (푸들)'}</span>
          </div>
          <div className="detail-item">
            <span className="label">날짜</span>
            <span className="value">{bookingInfo?.date || '2024년 2월 25일'}</span>
          </div>
          <div className="detail-item">
            <span className="label">시간</span>
            <span className="value">{bookingInfo?.time || '10:00 ~ 11:30'}</span>
          </div>
          <div className="detail-item">
            <span className="label">장소</span>
            <span className="value">{bookingInfo?.location || '서울시 강남구 테헤란로 123'}</span>
          </div>
          <div className="detail-item">
            <span className="label">결제 금액</span>
            <span className="value" style={{ fontWeight: 600, color: '#222' }}>
              {(bookingInfo?.amount || 65000).toLocaleString()}원
            </span>
          </div>
        </div>

        {/* Notes */}
        <div className="confirmation-notes">
          <h3>중요 안내사항</h3>
          <ul>
            <li>예약 24시간 전까지 취소/변경이 가능합니다</li>
            <li>예약 10분 전에는 꼭 도착해주세요</li>
            <li>긴급 상황시 미용사에게 연락해주세요</li>
            <li>미용 완료 후 후기를 남겨주세요</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="confirmation-actions">
          <button
            className="action-btn primary"
            onClick={() => navigate('/quote-detail')}
          >
            예약 일정 확인
          </button>
          <button
            className="action-btn secondary"
            onClick={handleComplete}
          >
            미용 완료 처리하기
          </button>
          <button
            className="action-btn danger"
            onClick={handleCancel}
          >
            예약 철회하기
          </button>
          <button
            className="action-btn secondary"
            onClick={() => navigate('/dashboard')}
          >
            홈으로 돌아가기
          </button>
          <button
            className="action-btn secondary"
            onClick={() => navigate('/chat')}
          >
            미용사에게 연락하기
          </button>
        </div>
      </div>
    </div>
  );
}
