import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './DashboardVariantRealPage.css';

const logoImg = "/vite.svg";

export default function DashboardVariantRealPage() {
  const navigate = useNavigate();
  const [selectedDog, setSelectedDog] = useState('우리 귀여운 강아지');

  const dogs = [
    { id: 1, name: '우리 귀여운 강아지', emoji: '🐕' },
    { id: 2, name: '해피', emoji: '🐩' },
    { id: 3, name: '뽀삐', emoji: '🐕‍🦺' }
  ];

  const topGroomers = [
    { id: 1, name: '미용사 홍길동', rating: 5.0, reviews: 32, image: '👨‍🦰', specialty: '푸들 전문' },
    { id: 2, name: '미용사 김영희', rating: 4.9, reviews: 28, image: '👩‍🦰', specialty: '소형견 전문' },
    { id: 3, name: '미용사 박준호', rating: 4.8, reviews: 25, image: '👨‍🦱', specialty: '골든 전문' },
    { id: 4, name: '미용사 이미자', rating: 4.8, reviews: 22, image: '👩‍🦱', specialty: '장모견 전문' },
    { id: 5, name: '미용사 최강호', rating: 4.7, reviews: 20, image: '👨', specialty: '순종견 전문' }
  ];

  return (
    <div className="dashboard-real-page" data-node-id="dashboard-real">
      {/* Header */}
      <div className="dashboard-real-header">
        <div className="dashboard-real-logo">
          <img src={logoImg} alt="멍빗어" />
        </div>
        <h1>멍빗어</h1>
      </div>

      {/* Dog Selector */}
      <div className="dashboard-real-dog-selector">
        <div className="selected-dog">
          <span className="dog-emoji">🐕</span>
          <span className="dog-name">{selectedDog}</span>
        </div>
        <button className="dog-selector-btn" onClick={() => navigate('/mypage')}>
          ▼
        </button>
      </div>

      {/* Main Content */}
      <div className="dashboard-real-container">
        {/* Quick Actions */}
        <div className="quick-actions">
          <button className="quick-action-btn" onClick={() => navigate('/quote-request')}>
            <span className="action-icon">📝</span>
            <span>견적 신청</span>
          </button>
          <button className="quick-action-btn" onClick={() => navigate('/calendar')}>
            <span className="action-icon">📅</span>
            <span>예약하기</span>
          </button>
          <button className="quick-action-btn" onClick={() => navigate('/chat')}>
            <span className="action-icon">💬</span>
            <span>메시지</span>
          </button>
        </div>

        {/* Top Groomers Section */}
        <div className="top-groomers-section">
          <h2>민감견 미용사 TOP 5</h2>
          <div className="top-groomers-slider">
            {topGroomers.map((groomer) => (
              <div key={groomer.id} className="groomer-card">
                <div className="groomer-rank">#{groomer.id}</div>
                <div className="groomer-avatar">{groomer.image}</div>
                <h4>{groomer.name}</h4>
                <p className="groomer-rating">⭐ {groomer.rating}</p>
                <p className="groomer-specialty">{groomer.specialty}</p>
                <button
                  className="groomer-contact-btn"
                  onClick={() => navigate('/designer', { state: { designerId: groomer.id } })}
                >
                  보기
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Services */}
        <div className="recent-section">
          <div className="recent-header">
            <h3>최근 미용</h3>
            <button onClick={() => navigate('/mypage-grooming')}>더보기</button>
          </div>
          <div className="recent-list">
            <div className="recent-item">
              <span className="recent-date">2024.02.21</span>
              <span className="recent-designer">미용사 홍길동</span>
              <span className="recent-price">65,000원</span>
            </div>
            <div className="recent-item">
              <span className="recent-date">2024.01.28</span>
              <span className="recent-designer">미용사 김영희</span>
              <span className="recent-price">50,000원</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="dashboard-real-nav">
        <button onClick={() => navigate('/dashboard')}>🏠</button>
        <button onClick={() => navigate('/designer-list')}>💼</button>
          <button onClick={() => navigate('/chat')}>💬</button>
          <button onClick={() => navigate('/mypage')}>
            <span className="nav-user-icon">👤</span>
          </button>
      </div>
    </div>
  );
}
