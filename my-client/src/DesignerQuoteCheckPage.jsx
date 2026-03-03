import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './DesignerPageNav.css';
import './DesignerQuoteCheckPage.css';

const dogImg1 = "https://www.figma.com/api/mcp/asset/c7a241f3-8019-4aed-a7b9-1c4d8d932ea9";
const dogImg2 = "https://www.figma.com/api/mcp/asset/b61b5a9c-dc45-4c44-82d4-ca7bc33c52fb";

export default function DesignerQuoteCheckPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');

  const quoteCards = [
    {
      id: 1,
      title: '초코 | 푸들 | 5KG | 15살',
      dogMainImg: dogImg1,
      dogSubImg: dogImg2,
      skin: '매우 민감',
      disease: '없음',
      bite: '가끔 있음',
      etc: '없음',
      vaccine: '종합백신, 광견병, 켄넬코프, 신종인플루엔자',
      place: '샵',
      method: '기계컷',
      extra: '치석 관리, 귀청소',
      time: '2월 20일 19:00 - 21:00',
      tags: ['푸들', '곰돌이 컷', '소형견'],
    },
    {
      id: 2,
      title: '쿠키 | 푸들 | 3KG | 1살',
      dogMainImg: dogImg2,
      dogSubImg: dogImg1,
      skin: '매우 민감',
      disease: '없음',
      bite: '가끔 있음',
      etc: '없음',
      vaccine: '종합백신, 광견병, 켄넬코프, 신종인플루엔자',
      place: '샵',
      method: '기계컷',
      extra: '치석 관리, 귀청소',
      time: '2월 20일 19:00 - 21:00',
      tags: ['푸들', '곰돌이 컷', '소형견'],
    },
  ];

  const filteredCards = quoteCards; // 필터 로직은 추후 확장 가능

  return (
    <div className="designer-page">
      <div className="designer-page-header">
        <button onClick={() => navigate(-1)}>←</button>
        <h1>견적서 확인하기</h1>
      </div>

      <div className="designer-content">
        <div className="dq-filter-row">
          <button
            type="button"
            className={`dq-filter-pill ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            전체
          </button>
          <button
            type="button"
            className={`dq-filter-pill ${filter === 'tag' ? 'active' : ''}`}
            onClick={() => setFilter('tag')}
          >
            태그순
          </button>
          <button
            type="button"
            className={`dq-filter-pill ${filter === 'price' ? 'active' : ''}`}
            onClick={() => setFilter('price')}
          >
            가격순
          </button>
          <button
            type="button"
            className={`dq-filter-pill ${filter === 'location' ? 'active' : ''}`}
            onClick={() => setFilter('location')}
          >
            위치순
          </button>
        </div>

        <div className="dq-card-list">
          {filteredCards.map(card => (
            <div key={card.id} className="dq-card">
              <p className="dq-card-title">{card.title}</p>

              <div className="dq-card-main">
                <div className="dq-card-images">
                  <img src={card.dogMainImg} alt={card.title} className="dq-dog-img main" />
                  <img src={card.dogSubImg} alt="서브" className="dq-dog-img sub" />
                </div>

                <div className="dq-card-text-group">
                  <p><span className="label">피부 민감도:</span> {card.skin}</p>
                  <p><span className="label">피부 질환 :</span> {card.disease}</p>
                  <p><span className="label">입질 여부:</span> {card.bite}</p>
                  <p><span className="label">기타 지병 및 주의사항:</span> {card.etc}</p>
                  <p><span className="label">예방 접종:</span> {card.vaccine}</p>
                </div>
              </div>

              <div className="dq-tag-row">
                {card.tags.map(tag => (
                  <span key={tag} className="dq-tag-pill">{tag}</span>
                ))}
              </div>

              <div className="dq-bottom-info">
                <div className="dq-bottom-text">
                  <p><span className="label">미용 장소:</span> {card.place}</p>
                  <p><span className="label">미용 방식:</span> {card.method}</p>
                  <p><span className="label">추가 미용:</span> {card.extra}</p>
                  <p><span className="label">미용 가능 시간:</span> {card.time}</p>
                </div>
              </div>

              <div className="dq-send-row">
                <button
                  type="button"
                  className="dq-send-btn"
                  onClick={() => navigate(`/designer-quote-send/${card.id}`, { state: { quote: card } })}
                >
                  견적서 보내기
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="designer-bottom-nav">
        <button
          className="designer-nav-btn"
          onClick={() => navigate('/designer-dashboard')}
          title="대시보드"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
          </svg>
        </button>
        <button
          className="designer-nav-btn"
          onClick={() => navigate('/designer-messages')}
          title="메시지"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </button>
        <button
          className="designer-nav-btn"
          onClick={() => navigate('/designer-profile')}
          title="프로필"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
