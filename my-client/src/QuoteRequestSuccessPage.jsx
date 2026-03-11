import { useNavigate } from 'react-router-dom';
import './QuoteRequestSuccessPage.css';

const logoImg = "/vite.svg";

export default function QuoteRequestSuccessPage() {
  const navigate = useNavigate();

  const handleNext = () => {
    navigate('/dashboard');
  };

  return (
    <div className="quote-request-success-page" data-node-id="511:1892">
      {/* Header */}
      <div className="quote-success-header">
        <div className="quote-success-logo">
          <img src={logoImg} alt="멍빗어" />
        </div>
        <h1>멍빗어</h1>
      </div>

      {/* Content */}
      <div className="quote-success-content">
        <div className="quote-success-icon">✅</div>
        <h2>견적서가 무사히 전송되었습니다!</h2>
        <p>디자이너님들의 견적서를 기다려주세요.</p>
      </div>

      {/* Action Button */}
      <div className="quote-success-footer">
        <button className="quote-success-btn" onClick={handleNext}>
          견직서 확인하러 가기
        </button>
      </div>

      {/* Bottom Navigation */}
      <div className="quote-success-bottom-nav">
        <button title="홈">🏠</button>
        <button title="디자이너">💼</button>
        <button title="메시지">💬</button>
        <button title="마이페이지">👤</button>
      </div>
    </div>
  );
}
