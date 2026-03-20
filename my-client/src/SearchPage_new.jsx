import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './SearchPage.css';

const imgSearch = "/dog-logo.png";

const TEMP_DESIGNERS = [
  {
    id: '1',
    name: '찰리 미용실',
    rating: 4.8,
    reviews: 24,
    priceMin: '50000',
    priceMax: '80000',
    image: '🐕',
    location: '강남구 역삼동',
  },
  {
    id: '2',
    name: '폼폼 그루밍',
    rating: 4.6,
    reviews: 18,
    priceMin: '45000',
    priceMax: '75000',
    image: '🐕',
    location: '강남구 삼성동',
  },
  {
    id: '3',
    name: '뽀송이 살롱',
    rating: 4.9,
    reviews: 32,
    priceMin: '55000',
    priceMax: '85000',
    image: '🐕',
    location: '강남구 강남동',
  },
  {
    id: '4',
    name: '깨끗한 미용실',
    rating: 4.7,
    reviews: 21,
    priceMin: '48000',
    priceMax: '78000',
    image: '🐕',
    location: '강남구 논현동',
  },
  {
    id: '5',
    name: '프리미엄 그루밍',
    rating: 5.0,
    reviews: 15,
    priceMin: '60000',
    priceMax: '100000',
    image: '🐕',
    location: '강남구 청담동',
  },
  {
    id: '6',
    name: '행복한 미용실',
    rating: 4.5,
    reviews: 16,
    priceMin: '40000',
    priceMax: '70000',
    image: '🐕',
    location: '강남구 역삼동',
  },
];

export default function SearchPage() {
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState([]);
  const [recentSearches, setRecentSearches] = useState(['예민견', '푸들']);

  const doSearch = (keyword) => {
    const trimmed = keyword.trim();
    
    if (!trimmed) {
      setInput('');
      setShowResults(false);
      return;
    }

    const filtered = TEMP_DESIGNERS.filter(item =>
      item.name.toLowerCase().includes(trimmed.toLowerCase()) ||
      item.location.toLowerCase().includes(trimmed.toLowerCase())
    );

    setInput(trimmed);
    setResults(filtered);
    setShowResults(true);

    if (filtered.length > 0) {
      setRecentSearches(prev => {
        const updated = [trimmed, ...prev.filter(s => s !== trimmed)];
        return updated.slice(0, 3);
      });
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInput(value);
    
    if (!value || value.trim() === '') {
      setShowResults(false);
      return;
    }
    
    const filtered = TEMP_DESIGNERS.filter(item =>
      item.name.toLowerCase().includes(value.toLowerCase()) ||
      item.location.toLowerCase().includes(value.toLowerCase())
    );
    setResults(filtered);
    setShowResults(true);
  };

  const handleSearchClick = () => {
    doSearch(input);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      doSearch(input);
    }
  };

  const handleTagClick = (keyword) => {
    doSearch(keyword);
  };

  return (
    <div className="search-page">
      {/* 검색 헤더 */}
      <div className="search-header">
        <input
          type="text"
          className="search-input"
          placeholder="검색"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          autoFocus
        />
        <button
          className="search-icon-btn"
          onClick={handleSearchClick}
          title="검색"
        >
          <img src={imgSearch} alt="검색" className="search-icon" />
        </button>
      </div>

      {!showResults ? (
        /* 초기 화면 */
        <div className="search-content">
          {/* 최근 검색어 */}
          <div className="search-section">
            <h2 className="search-section-title">최근 검색어</h2>
            <div className="search-cards-row">
              {recentSearches.map((search, idx) => (
                <button
                  key={idx}
                  className="search-card"
                  onClick={() => handleTagClick(search)}
                >
                  {search}
                </button>
              ))}
            </div>
          </div>

          {/* 인기 검색어 */}
          <div className="search-section">
            <h2 className="search-section-title">인기 검색어</h2>
            <div className="search-cards-row">
              <button className="search-card" onClick={() => handleTagClick('곰돌이 컷')}>
                곰돌이 컷
              </button>
              <button className="search-card" onClick={() => handleTagClick('예민견')}>
                예민견
              </button>
              <button className="search-card" onClick={() => handleTagClick('노령견')}>
                노령견
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* 검색 결과 화면 */
        <div className="search-results">
          {results.length > 0 ? (
            <div className="search-results-list">
              {results.map((designer) => (
                <div
                  key={designer.id}
                  className="search-result-card"
                  onClick={() => navigate(`/designer?id=${designer.id}`)}
                >
                  <div className="search-result-avatar">{designer.image}</div>
                  <div className="search-result-info">
                    <h3 className="search-result-name">{designer.name}</h3>
                    <div className="search-result-rating">
                      <span className="stars">⭐ {designer.rating.toFixed(1)}</span>
                      <span className="review-count">({designer.reviews})</span>
                    </div>
                    <p className="search-result-price">{designer.priceMin}~{designer.priceMax}원</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="search-no-results">
              <p>검색 결과가 없습니다.</p>
            </div>
          )}
        </div>
      )}

      {/* 하단 네비게이션 */}
      <div className="search-bottom-nav">
        <button
          className="nav-btn"
          onClick={() => navigate('/dashboard')}
          title="홈"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </button>
        <button
          className="nav-btn active"
          onClick={() => navigate('/search')}
          title="검색"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
        </button>
        <button
          className="nav-btn"
          onClick={() => navigate('/chat')}
          title="채팅"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </button>
        <button
          className="nav-btn"
          onClick={() => navigate('/mypage')}
          title="프로필"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
