import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { auth, db } from './firebase';
import './DesignerPageNav.css';
import './DesignerReviewsPage.css';

export default function DesignerReviewsPage() {
  const navigate = useNavigate();
  const [user] = useAuthState(auth);
  const [sortBy, setSortBy] = useState('recent');
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/designer-login');
      return;
    }

    const loadReviews = async () => {
      try {
        setLoading(true);
        const q = query(
          collection(db, 'reviews'),
          where('designerId', '==', user.uid)
        );
        const snap = await getDocs(q);
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setReviews(data);
      } catch (err) {
        console.error('리뷰 로드 실패:', err);
      } finally {
        setLoading(false);
      }
    };

    loadReviews();
  }, [user, navigate]);

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1)
      : '0.0';

  const sortedReviews = [...reviews].sort((a, b) => {
    if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
    // 최신순: createdAt(타임스탬프) 또는 date 문자열 기준
    const aTime = a.createdAt?.toMillis?.() || new Date(a.date || 0).getTime();
    const bTime = b.createdAt?.toMillis?.() || new Date(b.date || 0).getTime();
    return bTime - aTime;
  });

  return (
    <div className="designer-page">
      <div className="reviews-header">
        <button className="reviews-back-btn" onClick={() => navigate(-1)}>←</button>
        <h1>리뷰</h1>
        <div style={{ width: '24px' }}></div>
      </div>

      <div className="designer-content designer-reviews-page">
        <div className="reviews-sort">
          <button
            className={`sort-btn ${sortBy === 'recent' ? 'active' : ''}`}
            onClick={() => setSortBy('recent')}
          >
            최신순
          </button>
          <button
            className={`sort-btn ${sortBy === 'rating' ? 'active' : ''}`}
            onClick={() => setSortBy('rating')}
          >
            별점순
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '20px', textAlign: 'center', fontSize: '13px', color: '#666' }}>
            리뷰를 불러오는 중입니다...
          </div>
        ) : reviews.length === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: '#999', fontSize: '13px' }}>
            아직 받은 리뷰가 없습니다.
          </div>
        ) : (
          <div className="reviews-container">
            {sortedReviews.map((review) => {
              const displayName = review.author || review.userName || '고객';
              let dateText = '';

              if (review.createdAt && typeof review.createdAt.toDate === 'function') {
                try {
                  dateText = review.createdAt.toDate().toLocaleDateString('ko-KR');
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

              return (
                <div key={review.id} className="review-card">
                  <div className="review-header">
                    <div className="reviewer-info">
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
                      <div className="reviewer-meta">
                        <span className="reviewer-name-line">
                          <span className="reviewer-name">{displayName}</span>
                          {dateText && (
                            <span className="review-date-inline">· {dateText}</span>
                          )}
                        </span>
                      </div>
                    </div>
                    <div className="review-rating">
                      {'⭐'.repeat(ratingValue)}
                    </div>
                  </div>
                  <p className="review-text">{review.text || review.comment || ''}</p>

                  {Array.isArray(review.services) && review.services.length > 0 && (
                    <div className="review-tags">
                      {review.services.map((service, idx) => (
                        <span key={idx} className="review-tag">
                          {service}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

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
