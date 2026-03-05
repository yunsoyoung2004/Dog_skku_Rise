import './SearchResultsPage.css';
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getAllDesigners } from './services';

export default function SearchResultsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const searchQuery = searchParams.get('q') || '';

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasDesigners, setHasDesigners] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [activeTab, setActiveTab] = useState('grooming'); // grooming, style

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      setLoadError('');
      try {
        const allDesigners = await getAllDesigners();
        const lowerQuery = searchQuery.toLowerCase();

        const filtered = allDesigners.filter((item) => {
          const name = (item.name || '').toLowerCase();
          const location = (item.location || '').toLowerCase();
          const specialties = Array.isArray(item.styles)
            ? item.styles
            : Array.isArray(item.tags)
            ? item.tags
            : [];

          const matchesText =
            name.includes(lowerQuery) ||
            location.includes(lowerQuery) ||
            specialties.some((style) => (style || '').toLowerCase().includes(lowerQuery));

          if (!matchesText) return false;

          if (activeTab === 'style') {
            return specialties.some((style) => (style || '').toLowerCase().includes(lowerQuery));
          }

          // grooming 탭은 텍스트 매칭만으로 충분
          return true;
        });

        setHasDesigners(allDesigners.length > 0);
        setResults(filtered);
      } catch (error) {
        console.error('Search error:', error);
        setLoadError('디자이너 정보를 불러오지 못했습니다.');
        setHasDesigners(false);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    if (searchQuery) {
      fetchResults();
    }
  }, [searchQuery, activeTab]);

  const handleDesignerClick = (designerId) => {
    navigate(`/designer?id=${designerId}`);
  };

  return (
    <div className="search-results-page">
      {/* Header */}
      <div className="search-results-header">
        <button className="back-btn" onClick={() => navigate('/search')}>
          ←
        </button>
        <h1>"{searchQuery}" 검색 결과</h1>
      </div>

      {/* Tabs */}
      <div className="search-tabs">
        <button
          className={`tab ${activeTab === 'grooming' ? 'active' : ''}`}
          onClick={() => setActiveTab('grooming')}
        >
          미용실
        </button>
        <button
          className={`tab ${activeTab === 'style' ? 'active' : ''}`}
          onClick={() => setActiveTab('style')}
        >
          스타일
        </button>
      </div>

      {/* Results */}
      <div className="search-results-content">
        {loading ? (
          <div className="loading">검색 중...</div>
        ) : loadError ? (
          <div className="no-results">
            <p>🔒 {loadError}</p>
            <small>잠시 후 다시 시도해 주세요.</small>
          </div>
        ) : !hasDesigners ? (
          <div className="no-results">
            <p>🔒 현재 등록된 디자이너가 없습니다.</p>
            <small>서비스 준비 중입니다.</small>
          </div>
        ) : results.length === 0 ? (
          <div className="no-results">
            <p>"{searchQuery}"에 대한 결과가 없습니다</p>
            <small>다른 검색어를 시도해보세요</small>
          </div>
        ) : (
          <div className="results-grid">
            {results.map(result => (
              <div
                key={result.id}
                className="result-card"
                onClick={() => handleDesignerClick(result.id)}
              >
                {result.image && (
                  <img
                    src={result.image}
                    alt={result.name}
                    className="result-image"
                  />
                )}
                <div className="result-info">
                  <h3>{result.name}</h3>
                  <p className="result-location">
                    {result.location || '위치 정보 없음'}
                  </p>
                  {result.styles && Array.isArray(result.styles) && (
                    <div className="result-tags">
                      {result.styles.slice(0, 3).map((tag, idx) => (
                        <span key={idx} className="tag">
                          {tag}
                        </span>
                      ))}
                      {result.styles.length > 3 && (
                        <span className="tag-more">
                          +{result.styles.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                  {result.rating && (
                    <div className="result-rating">
                      ⭐ {result.rating.toFixed(1)}
                      <span className="review-count">
                        ({result.reviewCount || 0})
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="search-bottom-nav">
        <button className="nav-btn" onClick={() => navigate('/dashboard')}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
        </button>
        <button className="nav-btn" onClick={() => navigate('/search')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
          </svg>
        </button>
        <button className="nav-btn">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </button>
        <button className="nav-btn" onClick={() => navigate('/mypage')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
