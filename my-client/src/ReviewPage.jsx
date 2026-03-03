import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './firebase';
import { createReview } from './services';
import './ReviewPage.css';

const logoImg = "https://www.figma.com/api/mcp/asset/d3aedc85-e031-473e-aa91-014601f437ff";

export default function ReviewPage() {
  const navigate = useNavigate();
  const [user] = useAuthState(auth);
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [selectedServices, setSelectedServices] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
        designerId: 'designer_1',
        rating,
        text: text.trim(),
        services: selectedServices,
        createdAt: new Date().toISOString()
      });

      if (result.success) {
        console.log('✅ 리뷰 작성 완료:', result.reviewId);
        navigate('/dashboard', { state: { reviewSubmitted: true } });
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
            <h3>미용사 이름</h3>
            <p>2024년 1월 15일</p>
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
          <div className="service-checklist">
            {['친절함', '미용 실력', '청결함', '시간 엄수'].map((service) => (
              <label key={service} className="checkbox-item">
                <input
                  type="checkbox"
                  checked={selectedServices.includes(service)}
                  onChange={() => handleServiceToggle(service)}
                />
                <span>{service}</span>
              </label>
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
        <button onClick={() => navigate('/dashboard')}>🏠</button>
        <button onClick={() => navigate('/search')}>💼</button>
        <button onClick={() => navigate('/chat')}>💬</button>
        <button onClick={() => navigate('/mypage')}>👤</button>
      </div>
    </div>
  );
}
