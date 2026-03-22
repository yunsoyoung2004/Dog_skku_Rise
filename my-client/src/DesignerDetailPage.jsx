import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import {
  createOrGetChatRoom,
  getDesignerReviews,
  getDesignerBookingPhotos,
  getDesignerUsageCount,
} from './services';
import AlertModal from './components/AlertModal';
import './DesignerDetailPage.css';

export default function DesignerDetailPage({ isOpen = true, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [user] = useAuthState(auth);
  const [designer, setDesigner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('info'); // info | portfolio | reviews
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [bookingPhotos, setBookingPhotos] = useState([]);
  const [usageCount, setUsageCount] = useState(null);
  const [alert, setAlert] = useState(null);

  const searchParams = new URLSearchParams(location.search);
  const designerId = searchParams.get('id');

  useEffect(() => {
    if (!isOpen) return;
    if (!designerId) {
      setError('디자이너 정보를 찾을 수 없습니다.');
      setLoading(false);
      return;
    }

    const loadDesigner = async () => {
      try {
        setLoading(true);
        setError('');
        setReviews([]);
        setReviewsLoading(true);

        // 공개용 designers 컬렉션에서 정보 조회
        const designerRef = doc(db, 'designers', designerId);
        const designerSnap = await getDoc(designerRef);

        if (!designerSnap.exists()) {
          setError('등록된 디자이너 정보를 찾을 수 없습니다.');
          setDesigner(null);
          return;
        }

        const data = designerSnap.data();
        setDesigner({
          id: designerId,
          name: data.name || data.designerName || '이름 미등록',
          photoURL: data.image || data.photoURL || '',
          location: data.location || '위치 미등록',
          bio: data.bio || '',
          portfolioIntro: data.portfolioIntro || '',
          announcements: data.announcements || '',
          paymentInfo: data.paymentInfo || '',
          supportInfo: data.supportInfo || '',
          portfolioImages: data.portfolioImages || data.portfolio || [],
          rating: typeof data.rating === 'number' ? data.rating : 0,
          reviewCount: typeof data.reviews === 'number' ? data.reviews : 0,
          usageCount: data.usageCount ?? data.totalBookings ?? 0,
          careerYears: data.careerYears ?? data.experienceYears ?? null,
        });

        // 디자이너 리뷰 모음 (사용자/다른 사용자 포함)
        try {
          const loadedReviews = await getDesignerReviews(designerId);
          setReviews(Array.isArray(loadedReviews) ? loadedReviews : []);
        } catch (err) {
          console.error('디자이너 리뷰 로드 실패:', err);
          setReviews([]);
        } finally {
          setReviewsLoading(false);
        }

        // 예약 기반으로 업로드된 미용 사진 모으기 (booking.photoUrl 등)
        try {
          const photos = await getDesignerBookingPhotos(designerId);
          setBookingPhotos(Array.isArray(photos) ? photos : []);
        } catch (err) {
          console.warn('디자이너 예약 사진 로드 실패(무시 가능):', err);
          setBookingPhotos([]);
        }

        // 이용 횟수(확정/완료 예약) 집계
        try {
          const count = await getDesignerUsageCount(designerId);
          setUsageCount(count);
        } catch (err) {
          console.warn('디자이너 이용 횟수 로드 실패(무시 가능):', err);
          setUsageCount(null);
        }
      } catch (e) {
        console.error('디자이너 정보 로드 실패:', e);
        setError('디자이너 정보를 불러오지 못했습니다.');
        setDesigner(null);
        setReviews([]);
        setReviewsLoading(false);
      } finally {
        setLoading(false);
      }
    };

    loadDesigner();
  }, [designerId, isOpen]);

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      navigate(-1);
    }
  };

  const handleStartChat = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!designerId || !designer) {
      setAlert({
        title: '정보 없음',
        text: '디자이너 정보를 찾을 수 없습니다.',
      });
      return;
    }

    try {
      const room = await createOrGetChatRoom(user.uid, designerId, {
        designerName: designer.name,
        designerAvatar: designer.photoURL || '',
      });
      navigate(`/chat/${room.id}`);
    } catch (e) {
      console.error('채팅 시작 실패:', e);
      setAlert({
        title: '멌닁 실패',
        text: '채팅방을 생성할 수 없습니다.\n잠시 후 다시 시도해 주세요.',
      });
    }
  };

  const handleRequestQuote = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!designerId || !designer) {
      setAlert({
        title: '정보 없음',
        text: '견적서를 미난 디자이너를 \ucc3e을 수 없습니다.',
      });
      return;
    }

    navigate('/quote-request', {
      state: {
        designerId,
        designerName: designer.name,
        designerImage: designer.photoURL || '',
      },
    });
  };

  // 리뷰 요약 정보 (디자이너가 등록한 값 + 사용자 리뷰를 합산하는 느낌으로 사용)
  const totalReviewCount =
    reviews.length > 0
      ? reviews.length
      : designer && typeof designer.reviewCount === 'number'
      ? designer.reviewCount
      : 0;

  const avgRating = (() => {
    if (reviews.length > 0) {
      const sum = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
      return (sum / reviews.length).toFixed(1);
    }
    if (designer && typeof designer.rating === 'number') {
      return Number(designer.rating || 0).toFixed(1);
    }
    return '0.0';
  })();

  const usageValue = (() => {
    if (typeof usageCount === 'number') return usageCount;
    if (designer && typeof designer.usageCount === 'number') return designer.usageCount;
    if (designer && typeof designer.totalBookings === 'number') return designer.totalBookings;
    return 0;
  })();

  const collectReviewImages = (review) => {
    const set = new Set();
    if (!review) return [];

    const pushValue = (val) => {
      if (!val) return;
      if (typeof val === 'string') {
        set.add(val);
      } else if (typeof val === 'object') {
        const objUrl =
          val.url ||
          val.imageUrl ||
          val.photoUrl ||
          val.src ||
          val.downloadURL ||
          val.downloadUrl;
        if (objUrl) set.add(objUrl);
      }
    };

    const pushAll = (arr) => Array.isArray(arr) && arr.forEach(pushValue);

    pushAll(review.images);
    pushAll(review.photos);
    pushAll(review.reviewImages);
    pushAll(review.reviewPhotos);
    pushAll(review.imageUrls);
    pushAll(review.photoUrls);
    pushAll(review.pictures);
    pushAll(review.files);
    pushValue(review.reviewImage);
    pushValue(review.reviewPhoto);
    pushValue(review.imageUrl);
    pushValue(review.photoUrl);
    pushValue(review.image);
    pushValue(review.photo);
    pushValue(review.picture);

    return Array.from(set);
  };

  const reviewPhotos = (() => {
    const set = new Set();
    reviews.forEach((review) => {
      collectReviewImages(review).forEach((url) => set.add(url));
    });
    return Array.from(set);
  })();

  const portfolioReviewPhotos = (() => {
    const set = new Set();
    bookingPhotos.forEach((url) => url && set.add(url));
    reviewPhotos.forEach((url) => url && set.add(url));
    return Array.from(set);
  })();

  if (!isOpen) return null;

  return (
    <div className="designer-detail-overlay">
      <AlertModal
        isOpen={!!alert}
        title={alert?.title || '알림'}
        text={alert?.text || ''}
        primaryButtonText="확인"
        onPrimaryClick={() => setAlert(null)}
        variant="default"
      />
      <div className="designer-detail-container">
        {/* Header */}
        <div className="designer-detail-header">
          <button className="designer-detail-back" onClick={handleClose}>
            ←
          </button>
        </div>

        {/* Content */}
        <div className="designer-detail-scroll">
          {loading ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
              디자이너 정보를 불러오는 중입니다...
            </div>
          ) : error || !designer ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
              <p>🔒 {error || '디자이너 정보를 찾을 수 없습니다.'}</p>
            </div>
          ) : (
            <>
              {/* Top Section - 디자이너 기본 정보 */}
              <div className="designer-hero">
                <div className="designer-image-wrapper">
                  {designer.photoURL ? (
                    <img
                      src={designer.photoURL}
                      alt={designer.name}
                      className="designer-image"
                    />
                  ) : (
                    <div className="designer-image placeholder">
                    </div>
                  )}
                </div>

                <div className="designer-intro">
                  <h1 className="designer-name">{designer.name || '이름 없음'}</h1>
                  <div className="designer-location">
                    <span className="location-text">{designer.location || '위치 없음'}</span>
                  </div>
                  <p className="designer-motto">
                    {designer.portfolioIntro || '포트폴리오 소개 없음'}
                  </p>
                </div>
              </div>

              {/* 상단 통계 카드 (이용 횟수 / 경력 / 평점) */}
              <div className="designer-stats">
                <div className="stat-box">
                  <span className="stat-label">이용 횟수</span>
                  <span className="stat-value">
                    {usageValue ? `${usageValue}회` : '-'}
                  </span>
                </div>
                <div className="stat-box">
                  <span className="stat-label">디자이너 경력</span>
                  <span className="stat-value">
                    {designer.careerYears ? `${designer.careerYears}년` : '-'}
                  </span>
                </div>
                <div className="stat-box">
                  <span className="stat-label">리뷰 평점</span>
                  <span className="stat-value">{avgRating}</span>
                </div>
              </div>

              {/* 탭: 디자이너 정보 / 포트폴리오 / 리뷰 */}
              <div className="designer-tabs">
                <button
                  type="button"
                  className={`designer-tab ${activeTab === 'info' ? 'active' : ''}`}
                  onClick={() => setActiveTab('info')}
                >
                  디자이너 정보
                </button>
                <button
                  type="button"
                  className={`designer-tab ${activeTab === 'portfolio' ? 'active' : ''}`}
                  onClick={() => setActiveTab('portfolio')}
                >
                  포트폴리오
                </button>
                <button
                  type="button"
                  className={`designer-tab ${activeTab === 'reviews' ? 'active' : ''}`}
                  onClick={() => setActiveTab('reviews')}
                >
                  리뷰
                </button>
              </div>

              {/* 탭 콘텐츠 */}
              {activeTab === 'info' && (
                <>
                  {/* 디자이너 소개 섹션 */}
                  <section className="designer-section">
                    <h2 className="section-title">디자이너 소개글</h2>
                    <p className="section-text">{designer.bio || '없음'}</p>
                  </section>

                  {/* 공지 / 결제 / 문의 정보 */}
                  <section className="designer-section">
                    <h2 className="section-title">추가 정보</h2>
                    <div className="section-content">
                      <h3 className="section-subtitle">공지사항 및 이벤트</h3>
                      <p className="section-text">{designer.announcements || '없음'}</p>
                    </div>
                    <div className="section-content">
                      <h3 className="section-subtitle">결제수단 안내</h3>
                      <p className="section-text">{designer.paymentInfo || '없음'}</p>
                    </div>
                    <div className="section-content">
                      <h3 className="section-subtitle">문의 및 고객센터</h3>
                      <p className="section-text">{designer.supportInfo || '없음'}</p>
                    </div>
                  </section>
                </>
              )}

              {activeTab === 'portfolio' && (
                <section className="designer-section">
                  <h2 className="section-title">미용 포트폴리오</h2>
                  {designer.portfolioImages && designer.portfolioImages.length > 0 ? (
                    <div className="portfolio-grid">
                      {designer.portfolioImages.map((item, index) => {
                        const src = typeof item === 'string' ? item : item.url || item.imageUrl;
                        const label =
                          (typeof item === 'object' && (item.label || item.title)) || '';
                        if (!src) return null;
                        return (
                          <div key={index} className="portfolio-item">
                            <img src={src} alt={label || `포트폴리오 ${index + 1}`} className="portfolio-img" />
                            {label && <p className="portfolio-label">{label}</p>}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="designer-portfolio-empty">
                      <div className="portfolio-empty-icon">📷</div>
                      <p className="portfolio-empty-title">등록된 포트폴리오 사진이 아직 없습니다.</p>
                      <p className="portfolio-empty-sub">
                        시술 후 사진이 등록되면 이곳에서 확인하실 수 있어요.
                      </p>
                    </div>
                  )}

                  <div className="review-photo-section">
                    <h3 className="section-subtitle">리뷰/미용 사진</h3>
                    {portfolioReviewPhotos.length > 0 ? (
                      <div className="review-photo-grid">
                        {portfolioReviewPhotos.map((src, idx) => (
                          <img
                            key={idx}
                            src={src}
                            alt={`리뷰 사진 ${idx + 1}`}
                            className="review-photo-card"
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="section-text" style={{ marginTop: '8px' }}>
                        리뷰나 예약에서 업로드된 사진이 아직 없습니다.
                      </p>
                    )}
                  </div>
                </section>
              )}

              {activeTab === 'reviews' && (
                <section className="designer-section">
                  <h2 className="section-title">리뷰</h2>
                  {reviewsLoading ? (
                    <div style={{ padding: '16px', fontSize: '10px', color: '#999' }}>
                      리뷰를 불러오는 중입니다...
                    </div>
                  ) : reviews.length === 0 ? (
                    <div style={{ padding: '16px', fontSize: '10px', color: '#999' }}>
                      첫 번째 리뷰를 남겨보세요.
                    </div>
                  ) : (
                    reviews.map((review) => {
                      const displayName = review.author || review.userName || '고객';
                      let dateText = '';

                      if (review.createdAt && typeof review.createdAt.toDate === 'function') {
                        try {
                          dateText = review.createdAt.toDate().toLocaleDateString('ko-KR');
                        } catch (e) {
                          dateText = '';
                        }
                      } else if (typeof review.createdAt === 'string') {
                        try {
                          dateText = new Date(review.createdAt).toLocaleDateString('ko-KR');
                        } catch (e) {
                          dateText = '';
                        }
                      } else if (review.date) {
                        try {
                          dateText = new Date(review.date).toLocaleDateString('ko-KR');
                        } catch (e) {
                          dateText = '';
                        }
                      }

                      const ratingValue = Math.round(review.rating || 0);
                      const photoUrl = review.userPhoto || review.photoURL || review.image || '';
                      const reviewImages = collectReviewImages(review);

                      return (
                        <div key={review.id} className="review-item">
                          <div className="review-header-content">
                            <div className="reviewer-avatar">
                              {photoUrl ? (
                                <img src={photoUrl} alt={displayName} />
                              ) : (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                  <circle cx="12" cy="7" r="4" />
                                </svg>
                              )}
                            </div>
                            <div className="reviewer-info">
                              <span className="reviewer-name-line">
                                <span className="reviewer-name">{displayName}</span>
                                {dateText && (
                                  <span className="review-date-inline">· {dateText}</span>
                                )}
                              </span>
                            </div>
                            <div className="review-stars">
                              {'⭐'.repeat(ratingValue || 0)}
                            </div>
                          </div>
                          <p className="review-text">{review.text || review.comment || ''}</p>
                          {reviewImages.length > 0 && (
                            <div className="review-photos">
                              {reviewImages.slice(0, 3).map((img, idx) => (
                                <img
                                  key={idx}
                                  src={img}
                                  alt={`리뷰 사진 ${idx + 1}`}
                                  className="review-photo"
                                />
                              ))}
                            </div>
                          )}
                          {review.services && review.services.length > 0 && (
                            <div className="review-services">
                              {review.services.map((service, idx) => (
                                <span key={idx} className="review-service-tag">{service}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </section>
              )}
            </>
          )}
        </div>

        {/* 하단 고정 버튼: 채팅 / 견적 요청 (아이콘 제거) */}
        {!loading && !error && designer && (
          <div className="designer-detail-footer">
            <button
              type="button"
              className="designer-footer-btn chat"
              onClick={handleStartChat}
            >
              채팅하기
            </button>
            <button
              type="button"
              className="designer-footer-btn quote"
              onClick={handleRequestQuote}
            >
              견적서 요청하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
