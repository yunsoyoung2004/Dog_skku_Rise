import './DashboardPage.css';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import LocationSelectModal from './LocationSelectModal';
import DesignerDetailPage from './DesignerDetailPage';

const dogLogo = "https://www.figma.com/api/mcp/asset/2e70b3bd-9dec-4a06-8933-29b0bc04a563";
const bannerImage1 = "https://www.figma.com/api/mcp/asset/282241a6-a93a-4b11-a783-5038c6683694";
const bannerImage2 = "https://www.figma.com/api/mcp/asset/62e636bd-1fc8-459f-8902-0d7217991be0";
const radarGrid = "https://www.figma.com/api/mcp/asset/a8e9d91f-9d37-43a5-976b-ea9609cd25cc";
const radarRay = "https://www.figma.com/api/mcp/asset/28b90f41-bc83-443c-a3f5-cffd3675d9cd";
const radarData = "https://www.figma.com/api/mcp/asset/14732a99-c80a-413d-8ffc-f0d261293869";

export default function DashboardPage() {
  const navigate = useNavigate();
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isDesignerDetailOpen, setIsDesignerDetailOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState({
    region: '서울',
    zone: '강남구',
    district: '역삼동',
  });

  return (
    <div className="dashboard-page">
      {/* Header */}
      <div className="dashboard-header">
        <div className="dashboard-logo-section">
          <img src={dogLogo} alt="멍빗어" className="dashboard-logo" />
          <span className="dashboard-title">멍빗어</span>
        </div>
        <div className="dashboard-header-actions">
          <button className="dashboard-search-btn" aria-label="검색" onClick={() => navigate('/search')}>🔍</button>
          <button className="dashboard-menu-btn" onClick={() => navigate('/')}>→</button>
        </div>
      </div>

      {/* Location Section */}
      <div className="dashboard-location-section">
        <span className="dashboard-location-icon">📍</span>
        <span className="dashboard-location-text">
          {selectedLocation.zone} {selectedLocation.district}
        </span>
      </div>

      {/* Banners */}
      <div className="dashboard-banners">
        <div className="dashboard-banner banner-1" onClick={() => setIsLocationModalOpen(true)}>
          <img src={bannerImage1} alt="배너1" className="dashboard-banner-img" />
          <div className="dashboard-banner-content">
            <h3>강남구 애견 미용샵</h3>
            <p className="banner-highlight">TOP 5</p>
            <p className="banner-subtitle">가장 인기있는 샵을 만나보세요</p>
          </div>
        </div>
        <div className="dashboard-banner banner-2" onClick={() => setIsLocationModalOpen(true)}>
          <img src={bannerImage2} alt="배너2" className="dashboard-banner-img" />
          <div className="dashboard-banner-content">
            <h3>우리 집에서 만나는 미용사</h3>
            <p className="banner-highlight">출장 반려견 미용</p>
            <p className="banner-subtitle">근처 미용사 만나러 가기</p>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="dashboard-menu">
        <div className="dashboard-menu-item">
          <span className="dashboard-menu-icon">👥</span>
          <p>전체보기</p>
        </div>
        <div className="dashboard-menu-item">
          <span className="dashboard-menu-icon">📍</span>
          <p>지역별</p>
        </div>
        <div className="dashboard-menu-item">
          <span className="dashboard-menu-icon">🏷️</span>
          <p>맞춤별</p>
        </div>
        <div className="dashboard-menu-item">
          <span className="dashboard-menu-icon">⚡</span>
          <p>당일 예약</p>
        </div>
        <div className="dashboard-menu-item">
          <span className="dashboard-menu-icon">📤</span>
          <p>견적 요청</p>
        </div>
      </div>

      {/* Radar Chart Section */}
      <div className="dashboard-radar-section">
        <h4 className="dashboard-radar-title">우리집 강아지 미용 상태</h4>
        <div className="dashboard-radar-container">
          <div className="dashboard-radar">
            <div className="radar-grid">
              <img src={radarGrid} alt="라다그리드" />
            </div>
            <div className="radar-ray">
              <img src={radarRay} alt="라다레이" />
            </div>
            <div className="radar-data">
              <img src={radarData} alt="라다데이터" />
            </div>
            <div className="radar-labels">
              <span className="radar-label top">털 엉킴</span>
              <span className="radar-label right-top">모질</span>
              <span className="radar-label right-bottom">털 빠짐</span>
              <span className="radar-label bottom">환경 적응도</span>
              <span className="radar-label left-bottom">피부 민감도</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="dashboard-stats-section">
        <div className="dashboard-stat-box">
          <p className="stat-label">매칭 횟수</p>
          <p className="stat-value">3회</p>
        </div>
        <div className="dashboard-stat-box">
          <p className="stat-label">안 읽은 견적</p>
          <p className="stat-value">5건</p>
        </div>
      </div>

      {/* Unread Quote Banner */}
      <button
        className="dashboard-unread-banner"
        onClick={() => setIsDesignerDetailOpen(true)}
      >
        안 읽은 견적서 확인하러 가기
      </button>

      {/* Location Select Modal */}
      <LocationSelectModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        onSelectLocation={(location) => {
          setSelectedLocation(location);
        }}
      />

      {/* Designer Detail Modal */}
      <DesignerDetailPage
        isOpen={isDesignerDetailOpen}
        onClose={() => setIsDesignerDetailOpen(false)}
      />
    </div>
  );
}
