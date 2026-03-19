import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from './firebase';
import AlertModal from './components/AlertModal';
import './DesignerPageNav.css';
import './DesignerReviewsPage.css';

export default function DesignerReviewsPage() {
  const navigate = useNavigate();
  const [user] = useAuthState(auth);
  const [sortBy, setSortBy] = useState('recent');
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replyImage, setReplyImage] = useState(null);
  const [replyImageFile, setReplyImageFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState(null);

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
        
        // 답변하지 않은 리뷰 확인
        const unreplied = data.filter(r => !r.designerReply);
        if (unreplied.length > 0) {
          setTimeout(() => {
            setAlert({
              title: '답변 필요',
              text: `답변하지 않은 리뷰가 ${unreplied.length}개 있습니다.\n고객님께 성의 있는 답변을 남겨주세요!`,
            });
          }, 300);
        }
      } catch (err) {
        console.error('리뷰 로드 실패:', err);
      } finally {
        setLoading(false);
      }
    };

    loadReviews();
  }, [user, navigate]);

  const handleOpenReplyModal = (review) => {
    setSelectedReview(review);
    setReplyText(review.designerReply?.text || '');
    setReplyImage(review.designerReply?.imageUrl || null);
    setReplyImageFile(null);
    setShowReplyModal(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setReplyImageFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setReplyImage(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitReply = async () => {
    if (!selectedReview || !user) return;
    
    if (!replyText.trim()) {
      setAlert({
        title: '입력 필요',
        text: '답변 내용을 입력해주세요.',
      });
      return;
    }

    try {
      setSubmitting(true);
      let imageUrl = replyImage;

      // 새로운 이미지가 있으면 업로드
      if (replyImageFile) {
        const storageRef = ref(
          storage,
          `review-replies/${selectedReview.id}/designer-reply-${Date.now()}.jpg`
        );
        await uploadBytes(storageRef, replyImageFile);
        imageUrl = await getDownloadURL(storageRef);
      }

      // 리뷰에 디자이너 답변 저장
      const reviewRef = doc(db, 'reviews', selectedReview.id);
      await updateDoc(reviewRef, {
        designerReply: {
          text: replyText,
          imageUrl: imageUrl || null,
          createdAt: new Date().toISOString(),
        },
      });

      // 로컬 상태 업데이트
      setReviews((prevReviews) =>
        prevReviews.map((r) =>
          r.id === selectedReview.id
            ? {
                ...r,
                designerReply: {
                  text: replyText,
                  imageUrl: imageUrl || null,
                  createdAt: new Date().toISOString(),
                },
              }
            : r
        )
      );

      setShowReplyModal(false);
      setAlert({
        title: '저장 완료',
        text: '답변이 저장되었습니다!\n고객님이 확인할 수 있습니다.',
      });
    } catch (err) {
      console.error('답변 저장 실패:', err);
      setAlert({
        title: '저장 실패',
        text: '답변 저장에 실패했습니다.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1)
      : '0.0';

  const sortedReviews = [...reviews].sort((a, b) => {
    if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
    const aTime = a.createdAt?.toMillis?.() || new Date(a.date || 0).getTime();
    const bTime = b.createdAt?.toMillis?.() || new Date(b.date || 0).getTime();
    return bTime - aTime;
  });

  const closeReplyModal = () => {
    setShowReplyModal(false);
    setSelectedReview(null);
    setReplyText('');
    setReplyImage(null);
    setReplyImageFile(null);
  };

  return (
    <div className="designer-page">
      <AlertModal
        isOpen={!!alert}
        title={alert?.title || '알림'}
        text={alert?.text || ''}
        primaryButtonText="확인"
        onPrimaryClick={() => setAlert(null)}
        variant="default"
      />
      <div className="reviews-header">
        <button className="reviews-back-btn" onClick={() => navigate(-1)}>←</button>
        <h1>리뷰</h1>
        <div style={{ width: '24px' }}></div>
      </div>

      <div className="designer-content designer-reviews-page">
        {reviews.length > 0 && (
          <div className="reviews-stats">
            <div className="rating-box">
              <div className="rating-number">{avgRating}</div>
              <div className="rating-stars">{'⭐'.repeat(Math.round(parseFloat(avgRating)))}</div>
              <div className="rating-count">({reviews.length}개 리뷰)</div>
            </div>
          </div>
        )}

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
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#999' }}>
            📚 리뷰를 불러오는 중입니다...
          </div>
        ) : reviews.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: '#999' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>📝</div>
            <p style={{ margin: '0' }}>아직 받은 리뷰가 없습니다.</p>
            <p style={{ fontSize: '12px', margin: '8px 0 0 0' }}>좋은 서비스로 리뷰를 모아보세요!</p>
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
              const hasReply = !!review.designerReply;

              return (
                <div key={review.id} className={`review-card ${hasReply ? 'has-reply' : ''}`}>
                  <div className="review-main">
                    {/* 상단: 고객정보 + 별점 */}
                    <div className="review-header-section">
                      <div className="reviewer-info-group">
                        <div className="reviewer-avatar">
                          {photoUrl ? (
                            <img src={photoUrl} alt={displayName} />
                          ) : (
                            <div className="avatar-placeholder"></div>
                          )}
                        </div>
                        <div className="reviewer-details">
                          <div className="reviewer-name">{displayName}</div>
                          <div className="review-date-text">{dateText}</div>
                        </div>
                      </div>
                      <div className="review-rating-large">
                        {'⭐'.repeat(ratingValue)}
                      </div>
                    </div>

                    {/* 리뷰 내용 + 태그들 */}
                    <div className="review-content-row">
                      {/* 리뷰 내용 */}
                      <p className="review-text">{review.text || review.comment || ''}</p>

                      {/* 태그들 */}
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

                    {/* 디자이너 답변 */}
                    {hasReply && (
                      <div className="designer-reply-section">
                        <div className="reply-header">
                          <span className="reply-label">디자이너 답변</span>
                        </div>
                        <p className="reply-text">{review.designerReply.text}</p>
                        {review.designerReply.imageUrl && (
                          <img
                            src={review.designerReply.imageUrl}
                            alt="디자이너 답변 이미지"
                            className="reply-image"
                          />
                        )}
                      </div>
                    )}
                  </div>

                  {/* 답변 버튼 */}
                  <button
                    type="button"
                    className={`reply-btn ${hasReply ? 'edit' : ''}`}
                    onClick={() => handleOpenReplyModal(review)}
                  >
                    {hasReply ? '답변 수정' : '답변하기'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showReplyModal && selectedReview && (
        <div className="modal-overlay" onClick={closeReplyModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>리뷰 답변</h2>
              <button className="modal-close" onClick={closeReplyModal}>×</button>
            </div>

            <div className="modal-body">
              <div className="reply-to-customer">
                <p className="reply-to-label">고객님의 리뷰:</p>
                <div className="customer-review-preview">
                  <p className="preview-text">{selectedReview.text || selectedReview.comment || ''}</p>
                  <p className="preview-rating">{'⭐'.repeat(Math.round(selectedReview.rating || 0))}</p>
                </div>
              </div>

              <div className="reply-input-section">
                <label htmlFor="reply-text" className="input-label">답변 내용</label>
                <textarea
                  id="reply-text"
                  className="reply-textarea"
                  placeholder="고객님께 드릴 답변을 작성해주세요."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={5}
                />
              </div>

              <div className="image-upload-section">
                <label htmlFor="reply-image" className="input-label">사진 추가 (선택사항)</label>
                <div className="image-upload-box">
                  {replyImage ? (
                    <div className="image-preview">
                      <img src={replyImage} alt="미리보기" />
                      <button
                        type="button"
                        className="remove-image-btn"
                        onClick={() => {
                          setReplyImage(null);
                          setReplyImageFile(null);
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <label htmlFor="reply-image" className="upload-label">
                      <div className="upload-icon">+</div>
                      <p>사진 추가</p>
                      <input
                        id="reply-image"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        style={{ display: 'none' }}
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn-cancel" onClick={closeReplyModal}>
                취소
              </button>
              <button
                className="btn-submit"
                onClick={handleSubmitReply}
                disabled={submitting || !replyText.trim()}
              >
                {submitting ? '저장 중...' : '답변 저장'}
              </button>
            </div>
          </div>
        </div>
      )}

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
