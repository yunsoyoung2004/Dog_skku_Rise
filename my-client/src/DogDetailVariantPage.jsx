import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './DogDetailVariantPage.css';

const logoImg = "https://www.figma.com/api/mcp/asset/d3aedc85-e031-473e-aa91-014601f437ff";

export default function DogDetailVariantPage() {
  const navigate = useNavigate();
  const [selectedDesigner, setSelectedDesigner] = useState(null);

  const designers = [
    { id: 1, name: '미용사 1', rating: 5.0 },
    { id: 2, name: '미용사 2', rating: 4.8 }
  ];

  return (
    <div className="dog-detail-variant-page" data-node-id="dog-detail-variant">
      {/* Header */}
      <div className="dog-detail-header">
        <div className="dog-detail-logo">
          <img src={logoImg} alt="멍빗어" />
        </div>
        <h1>멍빗어</h1>
      </div>

      {/* Dog Profile */}
      <div className="dog-detail-container">
        <div className="dog-profile">
          <div className="dog-image">🐕</div>
          <h2>우리의 귀여운 강아지</h2>
          <p className="dog-breed">푸들 · 2살 · 암컷</p>
        </div>

        {/* Dog Stats */}
        <div className="dog-stats-variant">
          <div className="stat">
            <span>체중</span>
            <strong>4.5kg</strong>
          </div>
          <div className="stat">
            <span>미용횟수</span>
            <strong>12회</strong>
          </div>
        </div>

        {/* Favorite Designers */}
        <div className="favorite-designers">
          <h3>선호하는 미용사</h3>
          <div className="designers-grid">
            {designers.map((designer) => (
              <button
                key={designer.id}
                className={`designer-card ${selectedDesigner === designer.id ? 'selected' : ''}`}
                onClick={() => setSelectedDesigner(designer.id)}
              >
                <div className="designer-avatar">💼</div>
                <h4>{designer.name}</h4>
                <p>⭐ {designer.rating}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Additional Info */}
        <div className="dog-notes">
          <h3>특이사항</h3>
          <div className="notes-box">
            <p>- 민감한 피부: 저자극 제품 사용</p>
            <p>- 입질 주의</p>
            <p>- 정기 미용 권장</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="dog-detail-actions">
          <button className="schedule-btn" onClick={() => navigate('/calendar')}>
            미용 예약하기
          </button>
          <button className="edit-btn">수정하기</button>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="dog-detail-nav">
        <button onClick={() => navigate('/dashboard')}>🏠</button>
        <button onClick={() => navigate('/search')}>💼</button>
        <button onClick={() => navigate('/chat')}>💬</button>
        <button onClick={() => navigate('/mypage')}>👤</button>
      </div>
    </div>
  );
}
