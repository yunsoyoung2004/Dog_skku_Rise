import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './firebase';
import { getLatestGroomingHistory, getUserBookings, getUserReviews, uploadDogImage } from './services';
import AlertModal from './components/AlertModal';
import './MyPageGroomingPage.css';

export default function MyPageGroomingPage() {
  const navigate = useNavigate();
  const [user] = useAuthState(auth);
  const [history, setHistory] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingBookingId, setUploadingBookingId] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [reviewServices, setReviewServices] = useState([]);
  const [alert, setAlert] = useState(null);

  const toDate = (tsOrDate) => {
    if (!tsOrDate) return null;
    return tsOrDate.toDate ? tsOrDate.toDate() : new Date(tsOrDate);
  };

  useEffect(() => {
    loadGroomingHistory();
  }, [user]);

  const loadGroomingHistory = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setLoading(true);
    setError('');
    try {
      try {
        const latest = await getLatestGroomingHistory(user.uid);
        setHistory(latest || null);
      } catch (err) {
        console.warn('디자이너 미용 내역 로드 실패(무시 가능):', err);
      }

      try {
        const userBookings = await getUserBookings(user.uid);
        setBookings(userBookings || []);
      } catch (err) {
        console.warn('예약 기반 미용 내역 로드 실패(무시 가능):', err);
      }
      try {
        const userReviews = await getUserReviews(user.uid);
        setReviews(userReviews || []);
      } catch (err) {
        console.warn('리뷰 데이터 로드 실패(무시 가능):', err);
        setReviews([]);
      }
    } finally {
      setLoading(false);
    }
  };
  
  const displayDate = history?.date || '2026. 02. 02.';
  const displayDesigner = history?.designerName || '김민지 디자이너';

  const now = new Date();
  const validBookings = Array.isArray(bookings) ? bookings : [];
  const allPastBookings = validBookings
    .filter((b) => {
      const d = toDate(b.bookingDate || b.preferredDate);
      if (!d) return false;
      if (b.status === 'completed') return true;
      return d < now && b.status !== 'cancelled';
    })
    .sort((a, b) => {
      const da = toDate(a.bookingDate || a.preferredDate);
      const db = toDate(b.bookingDate || b.preferredDate);
      return db - da;
    });

  const handleUploadBookingPhoto = async (booking, file) => {
    if (!user || !booking || !file) return;
    try {
      if (!file.type.startsWith('image/')) {
        setAlert({
          title: '파일 형식 오류',
          text: '이미지 파일만 업로드 가능합니다.'
        });
        return;
      }
      setUploadingBookingId(booking.id);
      setSaving(true);

      const dogId = booking.dogId || 'default';
      const result = await uploadDogImage(user.uid, dogId, file);

      if (result?.url) {
        const updated = bookings.map((b) =>
          b.id === booking.id ? { ...b, photoUrl: result.url } : b
        );
        setBookings(updated);
      }
    } catch (err) {
      console.error('미용 사진 업로드 실패:', err);
      setAlert({
        title: '업로드 실패',
        text: '사진 업로드에 실패했습니다. 다시 시도해주세요.'
      });
    } finally {
      setSaving(false);
      setUploadingBookingId(null);
    }
  };

  const handleGroomingCardClick = (booking) => {
    setSelectedBooking(booking);
    const existingReview = reviews.find((r) => r.bookingId === booking.id);
    if (existingReview) {
      setReviewRating(existingReview.rating || 0);
      setReviewText(existingReview.text || '');
      setReviewServices(existingReview.services || []);
    } else {
      setReviewRating(0);
      setReviewText('');
      setReviewServices([]);
    }
    setShowReviewModal(true);
  };

  return (
    <div className="mypage-grooming" data-node-id="511:2993">
      <AlertModal
        isOpen={!!alert}
        title={alert?.title}
        text={alert?.text}
        primaryButtonText="확인"
        onPrimaryClick={() => setAlert(null)}
      />
      {/* Header */}
      <div className="mypage-grooming-header">
        <button className="back-btn" onClick={() => navigate(-1)}>←</button>
        <h1 className="title">우리집 강아지 미용 내역</h1>
        <button
          type="button"
          className="header-bell-btn"
          onClick={() => navigate('/notifications')}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 8-3 8h18s-3-1-3-8" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="mypage-grooming-container">
        {selectedBooking && showReviewModal && (
          <div className="modal-overlay">
            <div className="modal-content mypage-review-modal">
              <div className="modal-header">
                <h2>미용 내역</h2>
                <button
                  className="modal-close"
                  onClick={() => setShowReviewModal(false)}
                >
                  ×
                </button>
              </div>

              <div className="grooming-info">
                <h3>미용 내역 정보</h3>
                {selectedBooking.bookingId && (
                  <div className="info-item">
                    <span className="label">예약 번호:</span>
                    <span className="value">{selectedBooking.bookingId}</span>
                  </div>
                )}
                <div className="info-item">
                  <span className="label">날짜:</span>
                  <span className="value">
                    {toDate(selectedBooking.bookingDate || selectedBooking.preferredDate)?.toLocaleDateString('ko-KR') || '-'}
                  </span>
                </div>
                <div className="info-item">
                  <span className="label">시간:</span>
                  <span className="value">{selectedBooking.timeSlot || ''}</span>
                </div>
                {selectedBooking.dogName && (
                  <div className="info-item">
                    <span className="label">강아지:</span>
                    <span className="value">{selectedBooking.dogName}</span>
                  </div>
                )}
                <div className="info-item">
                  <span className="label">디자이너:</span>
                  <span className="value">{selectedBooking.designerName || '-'}</span>
                </div>
              </div>

              <hr style={{ margin: '20px 0', borderColor: '#eee' }} />

              <div className="review-section">
                <h3>리뷰</h3>
                {reviewRating > 0 || reviewText || (reviewServices && reviewServices.length > 0) ? (
                  <div className="review-display">
                    {reviewRating > 0 && (
                      <div className="review-rating-display">
                        {'⭐'.repeat(reviewRating)} <span>{reviewRating}점</span>
                      </div>
                    )}
                    {reviewText && (
                      <p className="review-text-display">{reviewText}</p>
                    )}
                    {reviewServices && reviewServices.length > 0 && (
                      <div className="review-services-display">
                        {reviewServices.map((service, idx) => (
                          <span key={idx} className="service-tag">{service}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <p style={{ fontSize: 12, color: '#777' }}>
                    아직 작성된 리뷰가 없습니다. 마이페이지에서 리뷰를 작성해 보세요.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
            로딩 중...
          </div>
        ) : error ? (
          <div style={{ padding: '10px', backgroundColor: '#ffeeee', color: '#cc0000', textAlign: 'center', marginBottom: '10px' }}>
            {error}
          </div>
        ) : (
          <>
            {history ? (
              <>
                <div className="grooming-top-photo">
                  <div className="photo-card">
                    {history?.dogName && (
                      <span className="photo-dog-name">{history.dogName}</span>
                    )}
                  </div>
                </div>
                <p className="grooming-photo-meta">{displayDate} {displayDesigner}</p>

                <div className="grooming-radar-section">
                  <p className="small-label">{history?.title || '뽀또의 미용 상태 분석'}</p>
                  <div className="grooming-metrics">
                    <div className="metric-row">
                      <span className="metric-label">털 엉킴</span>
                      <span className="metric-value">{history?.metrics?.matting ?? 70.34}</span>
                    </div>
                    <div className="metric-row">
                      <span className="metric-label">환경 적응도</span>
                      <span className="metric-value">{history?.metrics?.environmentAdaptation ?? 84.45}</span>
                    </div>
                    <div className="metric-row">
                      <span className="metric-label">털 빠짐</span>
                      <span className="metric-value">{history?.metrics?.shedding ?? 30.7}</span>
                    </div>
                    <div className="metric-row">
                      <span className="metric-label">모질</span>
                      <span className="metric-value">{history?.metrics?.coatQuality ?? 63.17}</span>
                    </div>
                    <div className="metric-row">
                      <span className="metric-label">피부 민감도</span>
                      <span className="metric-value">{history?.metrics?.skinSensitivity ?? 97.84}</span>
                    </div>
                  </div>
                </div>

                <div className="designer-comment-section">
                  <p className="small-label">디자이너 코멘트</p>
                  <div className="comment-box">
                    <p>
                      {history?.comment || '오늘 미용 전반적으로 아이 컨디션을 보면서 천천히 진행했어요. 처음엔 조금 긴장했지만 중간부터는 많이 편안해진 게 보여서 다행이었어요. 특히 얼굴 쪽은 예민해 보여서 가위 사용 위주로 부드럽게 정리했습니다. 집에서는 오늘 하루만큼은 충분히 쉬게 해주세요. 다음 미용 때도 이 성향 참고해서 더 편안하게 진행해드릴게요 😊'}
                    </p>
                  </div>
                </div>
              </>
            ) : null}

            <div style={{ marginTop: '24px' }}>
              <p className="small-label">지난 미용 예약 전체 보기</p>
              {allPastBookings.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '12px', color: '#777', fontSize: '11px' }}>
                  아직 미용 예약 내역이 없습니다.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {allPastBookings.map((item) => {
                    const d = toDate(item.bookingDate || item.preferredDate);
                    const dateLabel = d ? d.toLocaleDateString('ko-KR') : '-';
                    return (
                      <div
                        key={item.docId || item.id}
                        style={{
                          backgroundColor: '#fff',
                          borderRadius: '10px',
                          padding: '10px 12px',
                          display: 'flex',
                          flexDirection: 'row',
                          gap: '10px',
                          fontSize: '11px',
                        }}
                        onClick={() => handleGroomingCardClick(item)}
                      >
                        <div
                          style={{
                            width: 56,
                            height: 56,
                            borderRadius: 8,
                            backgroundColor: '#eee',
                            overflow: 'hidden',
                            flexShrink: 0,
                          }}
                        >
                          {item.photoUrl ? (
                            <img
                              src={item.photoUrl}
                              alt="미용 사진"
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <label
                              style={{
                                width: '100%',
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 10,
                                color: '#999',
                                cursor: 'pointer',
                              }}
                            >
                              사진 등록
                              <input
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    handleUploadBookingPhoto(item, file);
                                  }
                                }}
                              />
                            </label>
                          )}
                        </div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 600 }}>{dateLabel}</span>
                            <span style={{ color: '#999' }}>{item.timeSlot || ''}</span>
                          </div>
                          <div style={{ color: '#555' }}>
                            {item.dogName && <span>{item.dogName} · </span>}
                            <span>{item.designerName || '디자이너'}</span>
                          </div>
                          <div style={{ color: '#888' }}>
                            {item.hasReview ? '✓ 리뷰 작성됨' : '리뷰 미작성'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="mypage-grooming-nav">
        <button className="nav-btn" onClick={() => navigate('/dashboard')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </button>
        <button className="nav-btn" onClick={() => navigate('/search')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
          </svg>
        </button>
        <button className="nav-btn" onClick={() => navigate('/chat')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </button>
        <button className="nav-btn" onClick={() => navigate('/mypage')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
          </svg>
        </button>
      </div>
    </div>
  );
}
