import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './firebase';
import { getUserProfile } from './services';
import './LocationSelectPage.css';

export default function LocationSelectPage() {
  const navigate = useNavigate();
  const [user] = useAuthState(auth);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [customLocation, setCustomLocation] = useState('');
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    loadUserLocation();
  }, [user]);

  const loadUserLocation = async () => {
    if (!user) return;
    try {
      const profile = await getUserProfile(user.uid);
      if (profile?.address) {
        setUserLocation(profile.address);
      }
    } catch (err) {
      console.error('사용자 위치 로드 실패:', err);
    }
  };

  const locations = [
    { id: 1, name: '강남역', area: '강남구' },
    { id: 2, name: '신사역', area: '강남구' },
    { id: 3, name: '한강공원', area: '강남구' },
    { id: 4, name: '서초역', area: '서초구' },
    { id: 5, name: '교대역', area: '서초구' },
    { id: 6, name: '홍대입구역', area: '마포구' },
    { id: 7, name: '이태원역', area: '용산구' },
    { id: 8, name: '명동역', area: '중구' }
  ];

  const handleSelect = (location) => {
    setSelectedLocation(location);
  };

  const handleConfirm = () => {
    if (selectedLocation) {
      navigate('/calendar', { state: { location: selectedLocation } });
    }
  };

  const filteredLocations = locations.filter(loc =>
    customLocation === '' || 
    loc.name.includes(customLocation) || 
    loc.area.includes(customLocation)
  );

  return (
    <div className="location-select-page" data-node-id="location-select">
      {/* Header */}
      <div className="location-header">
        <button className="location-back-btn" onClick={() => navigate(-1)}>←</button>
        <h1>위치 선택</h1>
        <div style={{ width: '24px' }}></div>
      </div>

      {/* Search */}
      <div className="location-search">
        <input
          type="text"
          placeholder="위치 검색..."
          value={customLocation}
          onChange={(e) => setCustomLocation(e.target.value)}
        />
        <button className="location-search-btn">🔍</button>
      </div>

      {/* Content */}
      <div className="location-container">
        {/* Current Location */}
        <div className="location-section">
          <h3>📍 현재 위치</h3>
          <button className="location-item current">
            <span className="location-icon">📍</span>
            <div className="location-info">
              <h4>현재 위치 사용</h4>
              <p>GPS로 자동 인식</p>
            </div>
          </button>
        </div>

        {/* Favorites */}
        <div className="location-section">
          <h3>⭐ 자주 가는 장소</h3>
          <button className="location-item">
            <span className="location-icon">🏠</span>
            <div className="location-info">
              <h4>집</h4>
              <p>서울시 강남구 테헤란로 123</p>
            </div>
          </button>
          <button className="location-item">
            <span className="location-icon">💼</span>
            <div className="location-info">
              <h4>회사</h4>
              <p>서울시 강남구 영동대로 513</p>
            </div>
          </button>
        </div>

        {/* Popular Locations */}
        <div className="location-section">
          <h3>🌟 인기 있는 장소</h3>
          <div className="location-grid">
            {locations.map((location) => (
              <button
                key={location.id}
                className={`location-item-card ${selectedLocation?.id === location.id ? 'selected' : ''}`}
                onClick={() => handleSelect(location)}
              >
                <h4>{location.name}</h4>
                <p>{location.area}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Action Button */}
      {selectedLocation && (
        <button className="location-confirm-btn" onClick={handleConfirm}>
          {selectedLocation.name}에서 선택 완료
        </button>
      )}

      {/* Bottom Navigation */}
      <div className="location-nav">
        <button onClick={() => navigate('/dashboard')}>🏠</button>
        <button onClick={() => navigate('/search')}>💼</button>
        <button onClick={() => navigate('/chat')}>💬</button>
        <button onClick={() => navigate('/mypage')}>👤</button>
      </div>
    </div>
  );
}
