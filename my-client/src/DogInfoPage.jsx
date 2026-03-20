import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './firebase';
import { getUserProfile } from './services';
import './DogInfoPage.css';

const logoImg = "/dog-logo.png";

export default function DogInfoPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user] = useAuthState(auth);
  const [dogInfo, setDogInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDogInfo();
  }, [user, location]);

  const loadDogInfo = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // URL에서 dogId 추출
      const params = new URLSearchParams(location.search);
      const dogId = params.get('id');

      if (dogId) {
        // 실제로는 Firebase에서 특정 강아지의 정보를 조회해야 함
        // 여기서는 안내용 데이터를 표시
        setDogInfo({
          id: dogId,
          name: '우리 강아지',
          breed: '푸들',
          lastGrooming: new Date().toLocaleDateString('ko-KR'),
          designerInfo: {
            name: '미용사 이름',
            rating: 5.0
          }
        });
      }
    } catch (err) {
      console.error('강아지 정보 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dog-info-page" data-node-id="489:1077">
      {/* Header */}
      <div className="dog-info-header">
        <div className="dog-info-logo">
          <img src={logoImg} alt="멍빗어" />
        </div>
        <h1>멍빗어</h1>
      </div>

      {/* Location */}
      <div className="dog-info-location">
        <span>📍 강남구 역삼동</span>
      </div>

      {/* Dog Info */}
      <div className="dog-info-container">
        <h2>{dogInfo?.name || '우리집 강아지'} 미용 내역</h2>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
            로딩 중...
          </div>
        ) : (
          <>
            {/* Designer Info Card */}
            <div className="designer-info-card">
              <img src={logoImg} alt="Designer" className="designer-avatar" />
              <div className="designer-details">
                <h3>{dogInfo?.designerInfo?.name || '미용사'}</h3>
                <p>⭐ {dogInfo?.designerInfo?.rating || 5.0}</p>
                <button 
                  className="designer-msg-btn"
                  onClick={() => navigate('/chat')}
                >
                  💬 메시지
                </button>
              </div>
            </div>

            {/* Grooming Date */}
            <div className="grooming-date-section">
              <h3>최근 미용일</h3>
              <p>{dogInfo?.lastGrooming || '미용 정보 없음'}</p>
            </div>

            {/* Stats */}
            <div className="dog-stats">
              <div className="stat-item">
                <span>견종</span>
                <strong>{dogInfo?.breed || '미등록'}</strong>
              </div>
              <div className="stat-item">
                <span>총 평점</span>
                <strong>5점</strong>
              </div>
            </div>
          </>
        )}

        {/* Review Button */}
        <button className="dog-info-review-btn" onClick={() => navigate('/write-review')}>
          후기 작성하기
        </button>
      </div>

      {/* Bottom Navigation */}
      <div className="dog-info-bottom-nav">
        <button title="홈" onClick={() => navigate('/dashboard')}>🏠</button>
        <button title="디자이너" onClick={() => navigate('/designer')}>💼</button>
        <button title="메시지" onClick={() => navigate('/chat')}>💬</button>
          <button title="마이페이지" onClick={() => navigate('/mypage')}>
            <span className="nav-user-icon">👤</span>
          </button>
      </div>
    </div>
  );
}
