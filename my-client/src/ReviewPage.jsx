import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './firebase';
import { createReview, createNotification, updateBookingHasReview } from './services';
import './ReviewPage.css';

const logoImg = "/vite.svg";

export default function ReviewPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user] = useAuthState(auth);
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [selectedServices, setSelectedServices] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const designerId = location.state?.designerId || 'designer_1';
  const designerName = location.state?.designerName || '미용사';
  // 사람이 보는 예약 번호(예: BK...)와 Firestore 문서 id를 분리해서 받는다.
  const bookingId = location.state?.bookingId || '';
  const bookingDocId = location.state?.bookingDocId || '';

  const handleServiceToggle = (service) => {
    setSelectedServices(prev =>
      prev.includes(service)
        ? prev.filter(s => s !== service)
        : [...prev, service]
    );
  };

  const handleSubmit = async () => {
    setError('');

    if (!user) {
      setError('로그인이 필요합니다');
      navigate('/login');
      return;
    }

    if (rating === 0) {
      setError('별점을 선택해주세요');
      return;
    }

    if (!text.trim()) {
      setError('리뷰를 입력해주세요');
      return;
    }

    setLoading(true);
    try {
      const result = await createReview(user.uid, {
        designerId: designerId,
        // 리뷰에는 사람이 보는 bookingId를 저장
        bookingId: bookingId,
        rating,
        text: text.trim(),
        services: selectedServices,
        createdAt: new Date().toISOString()
      });

      if (result.success) {
        console.log('✅ 리뷰 작성 완료:', result.reviewId);
        
        // Booking 문서에 hasReview 플래그 업데이트
        if (bookingDocId) {
          try {
            // Booking 문서의 hasReview 플래그는 Firestore 문서 id 기준으로 갱신
            await updateBookingHasReview(bookingDocId);
            console.log('✅ Booking hasReview 플래그 업데이트 완료');
          } catch (updateError) {
            console.warn('Booking 업데이트 실패(무시 가능):', updateError);
          }
        }
        
        // 디자이너에게 리뷰 작성 알림 발송
        try {
          await createNotification(designerId, {
            title: '새 리뷰가 작성되었습니다',
            message: `고객이 ${rating}점의 리뷰를 남겼습니다.`,
            type: 'review',
            reviewId: result.reviewId,
            userId: user.uid,
          });
        } catch (notifError) {
          console.warn('리뷰 알림 발송 실패(무시 가능):', notifError);
        }
        
        // 디자이너 포트폴리오 페이지로 이동 (새로 작성된 리뷰 즉시 표시)
        navigate(`/designer-detail?id=${designerId}`, { state: { reviewSubmitted: true } });
      }
    } catch (err) {
      console.error('❌ 리뷰 작성 실패:', err);
      setError('리뷰 작성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="review-page" data-node-id="review">
      {/* Header */}
      <div className="review-header">
        <button className="review-back-btn" onClick={() => navigate(-1)}>←</button>
        <h1>리뷰 작성</h1>
        <div style={{ width: '36px' }}></div>
      </div>

      {/* Content */}
      <div className="review-container">
        {error && <div style={{ color: '#d32f2f', padding: '12px', margin: '12px 0', borderRadius: '6px', backgroundColor: '#ffebee' }}>{error}</div>}

        {/* Designer Info */}
        <div className="review-designer-card">
          <img src={logoImg} alt="Designer" className="review-designer-img" />
          <div className="review-designer-info">
            <h3>{designerName}</h3>
            <p>{new Date().toLocaleDateString('ko-KR')}</p>
          </div>
        </div>

        {/* Rating Selection */}
        <div className="review-rating-section">
          <label>평점</label>
          <div className="star-rating">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                className={`star ${rating >= star ? 'active' : ''}`}
                onClick={() => setRating(star)}
              >
                ⭐
              </button>
            ))}
          </div>
        </div>

        {/* Review Text */}
        <div className="review-text-section">
          <label>리뷰 내용</label>
          <textarea
            className="review-textarea"
            placeholder="미용사의 서비스에 대한 의견을 자유롭게 적어주세요..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={500}
          />
          <p className="char-count">{text.length}/500</p>
        </div>

        {/* Service Checklist */}
        <div className="review-service-section">
          <label>서비스 평가</label>
          <div className="service-tag-group">
            {['친절함', '미용 실력', '청결함', '시간 엄수'].map((service) => (
              <button
                key={service}
                className={`service-tag ${selectedServices.includes(service) ? 'active' : ''}`}
                onClick={() => handleServiceToggle(service)}
                type="button"
              >
                {service}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="review-footer">
        <button className="review-cancel-btn" onClick={() => navigate(-1)}>
          취소
        </button>
        <button
          className="review-submit-btn"
          onClick={handleSubmit}
          disabled={rating === 0 || !text.trim()}
        >
          리뷰 등록
        </button>
      </div>

      {/* Bottom Navigation */}
      <div className="review-bottom-nav">
        <button className="nav-btn" onClick={() => navigate('/dashboard')} title="대시보드">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </button>
        <button className="nav-btn" onClick={() => navigate('/search')} title="검색">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
          </svg>
        </button>
        <button className="nav-btn" onClick={() => navigate('/chat')} title="채팅">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </button>
        <button className="nav-btn" onClick={() => navigate('/mypage')} title="마이페이지">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
