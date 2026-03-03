import { useNavigate } from 'react-router-dom';
import './DogRegistrationSuccessPage.css';

const logoImg = "https://www.figma.com/api/mcp/asset/d3aedc85-e031-473e-aa91-014601f437ff";

export default function DogRegistrationSuccessPage() {
  const navigate = useNavigate();

  const handleNext = () => {
    navigate('/quote-request');
  };

  return (
    <div className="dog-registration-success-page" data-node-id="503:1293">
      {/* Header */}
      <div className="success-header">
        <div className="success-logo">
          <img src={logoImg} alt="멍빗어" />
        </div>
        <h1>멍빗어</h1>
      </div>

      {/* Content */}
      <div className="success-content">
        <div className="success-icon">✅</div>
        <h2>강아지 등록이 완료되었습니다!</h2>
        <p>이제 디자이너에게 견적서를 요청할 수 있습니다.</p>
      </div>

      {/* Action Button */}
      <div className="success-footer">
        <button className="success-btn" onClick={handleNext}>
          견적서 보내러 가기
        </button>
      </div>

      {/* Bottom Navigation */}
      <div className="success-bottom-nav">
        <button title="홈">🏠</button>
        <button title="디자이너">💼</button>
        <button title="메시지">💬</button>
        <button title="마이페이지">👤</button>
      </div>
    </div>
  );
}
