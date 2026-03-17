import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './firebase';
import { getUserProfile, getUserDogs, getUserBookings, getUserFavorites, notifyPendingReviews, getUserQuotes, getUserReviews, createReview, updateBookingHasReview, createNotification } from './services';
import PageLayout from './PageLayout';
import './MyPage.css';

export default function MyPage() {
  const navigate = useNavigate();
  const [user] = useAuthState(auth);
  const [userProfile, setUserProfile] = useState(null);
  const [dogs, setDogs] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDogModal, setShowDogModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [reviewServices, setReviewServices] = useState([]);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      const profile = await getUserProfile(user.uid);
      setUserProfile(profile);

      const userDogs = await getUserDogs(user.uid);
      setDogs(userDogs);

      const userBookings = await getUserBookings(user.uid);
      setBookings(userBookings || []);

      // 사용자가 받은 견적(특히 확정된 견적)을 함께 조회해,
      // bookings 컬렉션이 비어 있더라도 다가오는 예약을 표시할 수 있도록 보조 데이터로 사용
      try {
        const userQuotes = await getUserQuotes(user.uid);
        setQuotes(userQuotes || []);
      } catch (quoteErr) {
        console.warn('견적 데이터 로드 실패(무시 가능):', quoteErr);
        setQuotes([]);
      }

      try {
        const userReviews = await getUserReviews(user.uid);
        setReviews(userReviews || []);
      } catch (reviewErr) {
        console.warn('리뷰 데이터 로드 실패(무시 가능):', reviewErr);
        setReviews([])
      }

      // 지난 예약 중 리뷰가 없는 건에 대해 리뷰 알림 생성
      await notifyPendingReviews(user.uid);

      const userFavorites = await getUserFavorites(user.uid);
      setFavorites(userFavorites || []);

      if (!userDogs || userDogs.length === 0) {
        setShowDogModal(true);
      }
    } catch (err) {
      console.error('사용자 데이터 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  const primaryDog = dogs && dogs.length > 0 ? dogs[0] : null;

  const toDate = (tsOrDate) => {
    if (!tsOrDate) return null;
    return tsOrDate.toDate ? tsOrDate.toDate() : new Date(tsOrDate);
  };

  const now = new Date();
  const validBookings = Array.isArray(bookings) ? bookings : [];

  // 1차: bookings 컬렉션에서 다가오는 예약 찾기
  const upcomingFromBookings = validBookings
    .filter((b) => {
      // bookingDate가 없으면 preferredDate를 보조로 사용
      const d = toDate(b.bookingDate || b.preferredDate);
      return d && d >= now && b.status !== 'cancelled';
    })
    .sort((a, b) => {
      const da = toDate(a.bookingDate || a.preferredDate);
      const db = toDate(b.bookingDate || b.preferredDate);
      return da - db;
    })[0] || null;

  const pastBookings = validBookings
    .filter((b) => {
      const d = toDate(b.bookingDate || b.preferredDate);
      return d && d < now && b.status !== 'cancelled';
    })
    .sort((a, b) => {
      const da = toDate(a.bookingDate);
      const db = toDate(b.bookingDate);
      return db - da;
    })
    .slice(0, 3);

  // 미용 내역 카드 클릭 핸들러
  const handleGroomingCardClick = (booking) => {
    // 리뷰가 없는 경우 확인 대화상자 표시
    if (!booking.hasReview) {
      const confirmed = window.confirm('리뷰가 없습니다. 리뷰를 작성하시겠습니까?');
      if (!confirmed) return;
    }

    setSelectedBooking(booking);
    setShowReviewModal(true);
    // 이미 리뷰가 있으면 그 리뷰를 로드
    if (booking.hasReview) {
      const existingReview = reviews.find((r) => r.bookingId === booking.id);
      if (existingReview) {
        setReviewRating(existingReview.rating || 0);
        setReviewText(existingReview.text || '');
        setReviewServices(existingReview.services || []);
      }
    } else {
      setReviewRating(0);
      setReviewText('');
      setReviewServices([]);
    }
  };

  // 리뷰 제출
  const handleSubmitReview = async () => {
    if (!selectedBooking || !user) return;

    if (reviewRating === 0) {
      alert('별점을 선택해주세요');
      return;
    }

    if (!reviewText.trim()) {
      alert('리뷰를 입력해주세요');
      return;
    }

    setReviewSubmitting(true);
    try {
      const result = await createReview(user.uid, {
        designerId: selectedBooking.designerId,
        bookingId: selectedBooking.id,
        rating: reviewRating,
        text: reviewText.trim(),
        services: reviewServices,
      });

      if (result.success) {
        // Booking 문서 업데이트
        await updateBookingHasReview(selectedBooking.id);
        
        // 디자이너 알림 발송
        try {
          await createNotification(selectedBooking.designerId, {
            title: '새 리뷰가 작성되었습니다',
            message: `고객이 ${reviewRating}점의 리뷰를 남겼습니다.`,
            type: 'review',
            reviewId: result.reviewId,
            userId: user.uid,
          });
        } catch (e) {
          console.warn('알림 발송 실패:', e);
        }

        // 데이터 새로고침
        await loadUserData();
        setShowReviewModal(false);
      }
    } catch (err) {
      console.error('리뷰 제출 실패:', err);
      alert('리뷰 작성에 실패했습니다.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  // 2차: bookings 에서 못 찾았을 경우, "받은 견적" 중 하나를 보조로 사용
  // 단, 이 경우에도 이미 시간이 지난 예약은 다가오는 예약으로 표시하지 않음
  let upcomingFromQuote = null;
  const validQuotes = Array.isArray(quotes) ? quotes : [];
  if (!upcomingFromBookings && validQuotes.length > 0) {
    // 1순위: 확정된 견적, 없으면 2순위: 가장 최근 견적(확정 전이라도 사용)
    const confirmedQuote = validQuotes.find((q) => q.status === 'confirmed');
    const baseQuote = confirmedQuote || validQuotes[0];

    if (baseQuote) {
      const quoteDate = toDate(baseQuote.bookingDate || baseQuote.preferredDate);
      // 예약 시간이 현재 이후인 경우에만 배너로 노출
      if (quoteDate && quoteDate >= now) {
        upcomingFromQuote = {
          // bookings 구조와 최대한 맞춰서, 기존 UI가 그대로 동작하도록 맞춤
          bookingDate: baseQuote.bookingDate || baseQuote.preferredDate,
          preferredDate: baseQuote.preferredDate,
          timeSlot: baseQuote.preferredTime || '',
          designerName: baseQuote.designerName,
          designerId: baseQuote.designerId,
          chatRoomId: baseQuote.chatRoomId || '',
          status: baseQuote.status || 'pending',
        };
      }
    }
  }

  const upcomingBooking = upcomingFromBookings || upcomingFromQuote;
  const hasUpcomingBooking = !!upcomingFromBookings;
  const hasUpcomingFromQuoteOnly = !upcomingFromBookings && !!upcomingFromQuote;

  const parseGaugeValue = (val) => {
    if (val === '' || val == null) return null;
    const num = Number(val);
    if (Number.isNaN(num)) return null;
    if (num < 0) return 0;
    if (num > 100) return 100;
    return num;
  };

  return (
    <PageLayout title="마이 페이지">
      {/* Content */}
      <div className="mypage-main-container">
        {showDogModal && (
          <div className="modal-overlay">
            <div className="modal-content mypage-dog-modal">
              <h2>우리집 강아지를 먼저 등록해 주세요</h2>
              <p>견적 요청, 예약 등 서비스를 이용하려면 강아지 정보를 등록해야 해요.</p>
              <div className="mypage-dog-modal-actions">
                <button
                  type="button"
                  className="primary"
                  onClick={() => {
                    setShowDogModal(false);
                    navigate('/dog-registration');
                  }}
                >
                  강아지 등록하러 가기
                </button>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => setShowDogModal(false)}
                >
                  나중에 할게요
                </button>
              </div>
            </div>
          </div>
        )}
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
              
              {/* 미용 내역 정보 */}
              <div className="grooming-info">
                <h3>미용 내역 정보</h3>
                <div className="info-item">
                  <span className="label">날짜:</span>
                  <span className="value">
                    {toDate(selectedBooking.bookingDate)?.toLocaleDateString('ko-KR') || '-'}
                  </span>
                </div>
                <div className="info-item">
                  <span className="label">시간:</span>
                  <span className="value">{selectedBooking.timeSlot || '-'}</span>
                </div>
                <div className="info-item">
                  <span className="label">디자이너:</span>
                  <span className="value">{selectedBooking.designerName || '-'}</span>
                </div>
                {selectedBooking.location && (
                  <div className="info-item">
                    <span className="label">장소:</span>
                    <span className="value">{selectedBooking.location}</span>
                  </div>
                )}
                {selectedBooking.groomingStyle && (
                  <div className="info-item">
                    <span className="label">미용 방식:</span>
                    <span className="value">{selectedBooking.groomingStyle}</span>
                  </div>
                )}
              </div>

              <hr style={{ margin: '20px 0', borderColor: '#eee' }} />

              {/* 리뷰 섹션 */}
              <div className="review-section">
                <h3>리뷰</h3>
                
                {selectedBooking.hasReview ? (
                  // 이미 리뷰가 있을 때: 읽기 모드
                  <div className="review-display">
                    <div className="review-rating-display">
                      {'⭐'.repeat(reviewRating)} <span>{reviewRating}점</span>
                    </div>
                    <p className="review-text-display">{reviewText}</p>
                    {reviewServices.length > 0 && (
                      <div className="review-services-display">
                        {reviewServices.map((service, idx) => (
                          <span key={idx} className="service-tag">{service}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  // 리뷰가 없을 때: 작성 폼 표시
                  <div className="review-form">
                    <div className="review-rating-input">
                      <label>평점</label>
                      <div className="star-rating">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            className={`star ${reviewRating >= star ? 'active' : ''}`}
                            onClick={() => setReviewRating(star)}
                          >
                            ⭐
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="review-text-input">
                      <label>리뷰 내용</label>
                      <textarea
                        className="review-textarea"
                        placeholder="미용사의 서비스에 대한 의견을 자유롭게 적어주세요..."
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        maxLength={500}
                      />
                      <p className="char-count">{reviewText.length}/500</p>
                    </div>

                    <div className="review-services-input">
                      <label>서비스 평가</label>
                      <div className="service-tag-group">
                        {['친절함', '미용 실력', '청결함', '시간 엄수'].map((service) => (
                          <button
                            key={service}
                            type="button"
                            className={`service-tag ${reviewServices.includes(service) ? 'active' : ''}`}
                            onClick={() => {
                              setReviewServices((prev) =>
                                prev.includes(service)
                                  ? prev.filter((s) => s !== service)
                                  : [...prev, service]
                              );
                            }}
                          >
                            {service}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="review-actions">
                      <button
                        type="button"
                        className="review-submit-btn"
                        onClick={handleSubmitReview}
                        disabled={reviewSubmitting}
                      >
                        {reviewSubmitting ? '등록 중...' : '리뷰 작성'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
            로딩 중...
          </div>
        ) : (
          <>
            {/* 우리집 강아지 정보 */}
            <section className="mypage-section">
              <h2 className="section-title">우리집 강아지 정보</h2>
              <div className="section-divider" />
              {primaryDog ? (
                <div
                  className="mypage-dog-info"
                  onClick={() => navigate('/dog-edit', { state: { dogId: primaryDog.id } })}
                >
                  <div className="dog-photo-circle">
                    <div className="dog-photo-inner">
                      {primaryDog.imageUrl ? (
                        <img
                          src={primaryDog.imageUrl}
                          alt={primaryDog.name || '강아지 프로필 사진'}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            borderRadius: '50%',
                            objectPosition: `50% ${
                              typeof primaryDog.imageOffsetY === 'number'
                                ? primaryDog.imageOffsetY
                                : 50
                            }%`
                          }}
                        />
                      ) : (
                        <svg
                          className="dog-photo-placeholder-icon"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <rect
                            x="3"
                            y="5"
                            width="18"
                            height="14"
                            rx="2"
                            ry="2"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          />
                          <circle
                            cx="10"
                            cy="11"
                            r="2.3"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          />
                          <path
                            d="M21 16.2 16.2 11.5 11 17"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </div>
                  </div>
                  <div className="dog-info-text">
                    <p className="dog-name">{primaryDog.name || '이름 미등록'}</p>
                    <p className="dog-meta-line">
                      품종 {primaryDog.breed || '-'} · 나이 {primaryDog.age || '-'} · 체중 {primaryDog.weight || '-'}
                    </p>
                    <p className="dog-meta-line">성별 / 중성화 / 접종 정보는 마이페이지에서 관리할 수 있어요.</p>
                    <p className="dog-meta-line small">최근 예약 횟수와 미용 이력은 아래에서 바로 확인해 보세요.</p>
                  </div>
                </div>
              ) : (
                <div className="mypage-dog-info-empty">
                  <p className="dog-meta-line">등록된 강아지 정보가 없습니다.</p>
                  <button
                    type="button"
                    className="link-text-btn"
                    onClick={() => navigate('/dog-registration')}
                  >
                    우리 집 강아지 등록하러 가기
                  </button>
                </div>
              )}
            </section>

            {/* 예약 알림 */}
            {upcomingBooking && (
              <section className="mypage-section booking-alert">
                {(() => {
                  const alertClass = 'alert-info';

                  const rawDate = upcomingBooking.bookingDate || upcomingBooking.preferredDate || '';
                  let whenLabel = '';
                  if (rawDate) {
                    try {
                      const bookingDate = toDate(rawDate);
                      if (bookingDate && !isNaN(bookingDate.getTime())) {
                        whenLabel = `${bookingDate.toLocaleDateString('ko-KR')} ${upcomingBooking.timeSlot || ''}`.trim();
                      } else if (typeof rawDate === 'string') {
                        whenLabel = `${rawDate} ${upcomingBooking.timeSlot || ''}`.trim();
                      }
                    } catch (e) {
                      if (typeof rawDate === 'string') {
                        whenLabel = `${rawDate} ${upcomingBooking.timeSlot || ''}`.trim();
                      }
                    }
                  }

                  return (
                    <div className={`booking-alert-content ${alertClass}`}>
                      <p className="alert-message">✅ 예약이 확정되었습니다.</p>
                      <p className="alert-detail">
                        다가오는 예약 일정 · {upcomingBooking.designerName || '디자이너'}
                        {whenLabel ? ` · ${whenLabel}` : ''}
                      </p>
                      <button
                        type="button"
                        className="alert-btn"
                        onClick={() => navigate('/quote-detail')}
                      >
                        예약 일정 확인
                      </button>
                    </div>
                  );
                })()}
              </section>
            )}

            {/* 우리집 강아지 미용 상태 (프로필 기준) */}
            {primaryDog && (
              <section
                className="mypage-section mypage-section-clickable"
                onClick={() => navigate('/dog-groom-edit', { state: { dogId: primaryDog.id } })}
              >
                <h2 className="section-title">우리집 강아지 미용 상태</h2>
                <div className="section-divider" />
                <div className="groom-gauges">
                  {[
                    { key: 'matting', label: '털 엉킴', value: primaryDog.matting },
                    { key: 'coatQuality', label: '모질', value: primaryDog.coatQuality },
                    { key: 'shedding', label: '털 빠짐', value: primaryDog.shedding },
                    { key: 'environmentAdaptation', label: '환경 적응도', value: primaryDog.environmentAdaptation },
                    { key: 'skinSensitivity', label: '피부 민감도', value: primaryDog.skinSensitivity },
                  ].map((metric) => {
                    const v = parseGaugeValue(metric.value);
                    return (
                      <div className="groom-gauge-row" key={metric.key}>
                        <div className="groom-gauge-label">
                          <span className="groom-gauge-name">{metric.label}</span>
                          <span className="groom-gauge-value">
                            {v != null ? `${v}` : '입력 없음'}
                          </span>
                        </div>
                        <div className="groom-gauge-bar">
                          <div
                            className="groom-gauge-fill"
                            style={{ width: `${v != null ? v : 0}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* 우리집 강아지 미용 내역 */}
            <section className="mypage-section">
              <h2 className="section-title">우리집 강아지 미용 내역</h2>
              <div className="section-divider" />
              {pastBookings.length === 0 ? (
                <p className="dog-meta-line small">아직 미용 내역이 없습니다.</p>
              ) : (
                <>
                  <div className="mypage-grooming-thumbs">
                    {pastBookings.map((item) => {
                      const d = toDate(item.bookingDate);
                      const dateLabel = d
                        ? d.toLocaleDateString('ko-KR')
                        : '-';
                      return (
                        <div
                          className="groom-thumb-card"
                          key={item.docId || item.id}
                          onClick={() => handleGroomingCardClick(item)}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="groom-thumb-photo" />
                          <p className="groom-thumb-date">{dateLabel}</p>
                          <p className="groom-thumb-designer">
                            {item.hasReview ? '✓ 리뷰 작성됨' : '미용예약'}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                  <button
                    className="link-text-btn"
                    onClick={() => navigate('/mypage-grooming')}
                  >
                    디자이너가 작성한 미용 후기 보러가기
                  </button>
                </>
              )}
            </section>

            {/* 내가 좋아요 누른 샵 / 디자이너 */}
            <section className="mypage-section">
              <h2 className="section-title">내가 좋아요 누른 샵 / 디자이너</h2>
              <div className="section-divider" />
              {favorites.length === 0 ? (
                <p className="dog-meta-line small">즐겨찾기한 샵/디자이너가 없습니다.</p>
              ) : (
                <div className="mypage-favorites-row">
                  {favorites.slice(0, 3).map((fav) => (
                    <div
                      className="favorite-card"
                      key={fav.id || fav.designerId}
                      onClick={() => fav.designerId && navigate(`/designer?id=${fav.designerId}`)}
                    >
                      <div className="favorite-photo" />
                      <p className="favorite-name">{fav.name || '이름 미등록'}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* 다가오는 예약 */}
            {hasUpcomingBooking ? (
              <button
                className="mypage-upcoming-btn"
                type="button"
                onClick={() => navigate('/calendar')}
              >
                {(() => {
                  const rawDate = upcomingBooking.bookingDate || upcomingBooking.preferredDate || '';
                  let label = '';
                  if (rawDate) {
                    try {
                      const d = toDate(rawDate);
                      if (d && !isNaN(d.getTime())) {
                        label = `${d.toLocaleDateString('ko-KR')} ${upcomingBooking.timeSlot || ''}`;
                      } else if (typeof rawDate === 'string') {
                        label = `${rawDate} ${upcomingBooking.timeSlot || ''}`;
                      }
                    } catch (e) {
                      if (typeof rawDate === 'string') {
                        label = `${rawDate} ${upcomingBooking.timeSlot || ''}`;
                      }
                    }
                  }
                  if (!label) {
                    label = `날짜 미정 ${upcomingBooking.timeSlot || ''}`.trim();
                  }
                  return `다가오는 예약 | ${label}`;
                })()}
              </button>
            ) : hasUpcomingFromQuoteOnly ? null : (
              <button
                className="mypage-upcoming-btn"
                type="button"
                disabled
              >
                🔒 다가오는 예약이 없습니다.
              </button>
            )}

            {/* 하단 버튼들 */}
            <div className="mypage-bottom-buttons">
              <button
                type="button"
                className="bottom-action-btn"
                onClick={() => navigate('/mypage-account')}
              >
                계정 정보 확인하기
              </button>
              <button
                type="button"
                className="bottom-action-btn"
                onClick={() => navigate('/help')}
              >
                FAQ | 고객 센터
              </button>
            </div>
          </>
        )}
      </div>
    </PageLayout>
  );
}
