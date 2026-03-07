import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { createOrGetChatRoom, getDesignerReviews } from './services';
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
      alert('디자이너 정보를 찾을 수 없습니다.');
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
      alert('채팅방을 생성하지 못했습니다. 잠시 후 다시 시도해 주세요.');
    }
  };

  const handleRequestQuote = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!designerId || !designer) {
      alert('견적서를 보낼 디자이너를 찾을 수 없습니다.');
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

  if (!isOpen) return null;

  return (
    <div className="designer-detail-overlay">
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
                      <span className="designer-avatar-icon">👤</span>
                    </div>
                  )}
                </div>

                <div className="designer-intro">
                  <h1 className="designer-name">{designer.name || '이름 없음'}</h1>
                  <div className="designer-location">
                    <span className="location-icon">📍</span>
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
                    {designer.usageCount ? `${designer.usageCount}회` : '-'}
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
                </section>
              )}

              {activeTab === 'reviews' && (
                <section className="designer-section">
                  <h2 className="section-title">리뷰</h2>

                  <div className="review-header">
                    <div className="review-rating">
                      <span className="rating-stars">⭐</span>
                      <div>
                        <div className="rating-score">{avgRating}</div>
                        <p className="section-text" style={{ marginTop: 4 }}>
                          {totalReviewCount > 0
                            ? `${totalReviewCount}개의 리뷰`
                            : '아직 등록된 리뷰가 없습니다.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {reviewsLoading ? (
                    <div style={{ padding: '16px', fontSize: '10px', color: '#999' }}>
                      리뷰를 불러오는 중입니다...
                    </div>
                  ) : reviews.length === 0 ? (
                    <div style={{ padding: '16px', fontSize: '10px', color: '#999' }}>
                      첫 번째 리뷰를 남겨보세요.
                    </div>
                  ) : (
                    reviews.slice(0, 3).map((review) => {
                      const displayName = review.author || review.userName || '고객';
                      let dateText = '';

                      if (review.createdAt && typeof review.createdAt.toDate === 'function') {
                        try {
                          dateText = review.createdAt
                            .toDate()
                            .toLocaleDateString('ko-KR');
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

                      return (
                        <div key={review.id} className="review-item">
                          <div className="review-header-content">
                            <div className="reviewer-avatar">
                              <span className="designer-avatar-icon">👤</span>
                            </div>
                            <div className="reviewer-info">
                              <p className="reviewer-name">{displayName}</p>
                              <p className="review-date">{dateText}</p>
                            </div>
                            <div className="review-stars">
                              {'⭐'.repeat(ratingValue || 0)}
                            </div>
                          </div>
                          <p className="review-text">{review.text || review.comment || ''}</p>
                        </div>
                      );
                    })
                  )}
                </section>
              )}
            </>
          )}
        </div>

        {/* 하단 고정 버튼: 채팅 / 견적 요청 */}
        {!loading && !error && designer && (
          <div className="designer-detail-footer">
            <button
              type="button"
              className="designer-footer-btn chat"
              onClick={handleStartChat}
            >
              💬 채팅하기
            </button>
            <button
              type="button"
              className="designer-footer-btn quote"
              onClick={handleRequestQuote}
            >
              📄 견적서 요청하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
