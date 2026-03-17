import { useNavigate } from 'react-router-dom';
import './DesignerDetailVariantPage.css';

const logoImg = "/vite.svg";

export default function DesignerDetailVariantPage() {
  const navigate = useNavigate();

  return (
    <div className="designer-detail-variant" data-node-id="511:2237">
      {/* Header */}
      <div className="designer-variant-header">
        <button className="designer-back-btn" onClick={() => navigate(-1)}>←</button>
        <h1>디자이너 상세정보</h1>
        <button className="designer-more-btn">⋮</button>
      </div>

      {/* Content */}
      <div className="designer-variant-container">
        {/* Designer Profile */}
        <div className="designer-profile-card">
          <img src={logoImg} alt="Designer" className="designer-profile-img" />
          <div className="designer-profile-info">
            <h2>미용사 이름</h2>
            <p className="designer-rating">⭐ 5.0 (32 리뷰)</p>
            <p className="designer-price">미용비: 50,000원 ~ 80,000원</p>
          </div>
        </div>

        {/* Locked Content */}
        <div className="locked-content-section">
          <h3>강아지별 미용 상태</h3>
          <div className="locked-message">
            <div className="lock-icon">🔒</div>
            <p>강아지 정보를 등록해야 전체 정보를 확인할 수 있습니다.</p>
          </div>
        </div>

        {/* Available Times */}
        <div className="available-times-section">
          <h3>예약 가능 시간</h3>
          <div className="time-grid">
            <div className="time-slot available">10:00</div>
            <div className="time-slot available">11:00</div>
            <div className="time-slot available">13:00</div>
            <div className="time-slot available">14:00</div>
            <div className="time-slot booked">15:00</div>
            <div className="time-slot available">16:00</div>
          </div>
        </div>

        {/* Portfolio */}
        <div className="portfolio-section">
          <h3>미용 포트폴리오</h3>
          <div className="portfolio-grid">
            <div className="portfolio-item">
              <div className="portfolio-img">사진 1</div>
            </div>
            <div className="portfolio-item">
              <div className="portfolio-img">사진 2</div>
            </div>
            <div className="portfolio-item">
              <div className="portfolio-img">사진 3</div>
            </div>
          </div>
        </div>

        {/* Contact Button (디자이너 메시지로 이동) */}
        <button
          className="designer-contact-btn"
          onClick={() => navigate('/designer-messages')}
        >
          디자이너와 연락하기
        </button>
      </div>

      {/* Bottom Navigation */}
      <div className="designer-variant-nav">
          <button onClick={() => navigate('/designer-dashboard')}>🏠</button>
          <button onClick={() => navigate('/designer-gallery')}>💼</button>
          <button onClick={() => navigate('/designer-messages')}>💬</button>
          <button onClick={() => navigate('/designer-profile')}>
           <span className="nav-user-icon">👤</span>
          </button>
      </div>
    </div>
  );
}
