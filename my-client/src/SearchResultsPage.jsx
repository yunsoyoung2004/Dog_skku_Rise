import './SearchResultsPage.css';
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from './firebase';

export default function SearchResultsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const searchQuery = searchParams.get('q') || '';

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('grooming'); // grooming, style

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        // 데모 데이터로 먼저 시작
        const demoData = [
          {
            id: 'demo1',
            name: '부드러운 손 미용실',
            location: '서울 강남구',
            rating: 4.8,
            reviewCount: 156,
            styles: ['곰돌이 컷', '예민견 전문', '노령견 관리']
          },
          {
            id: 'demo2',
            name: '푸들 전문점',
            location: '서울 강북구',
            rating: 4.6,
            reviewCount: 89,
            styles: ['푸들', '고급 미용', '색상 염색']
          },
          {
            id: 'demo3',
            name: '애완동물 미용 센터',
            location: '경기도 수원',
            rating: 4.5,
            reviewCount: 234,
            styles: ['노령견 전문', '예민견 관리', '일반 미용']
          }
        ];

        const lowerQuery = searchQuery.toLowerCase();
        const filtered = demoData.filter(item => 
          item.name.toLowerCase().includes(lowerQuery) ||
          item.styles.some(style => style.toLowerCase().includes(lowerQuery))
        );
        
        setResults(filtered.length > 0 ? filtered : demoData);

        // Firebase 데이터 시도 (선택사항)
        try {
          const designersQuery = query(collection(db, 'designerProfiles'));
          const snapshot = await getDocs(designersQuery);
          
          const allResults = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));

          if (allResults.length > 0) {
            if (activeTab === 'grooming') {
              const data = allResults.filter(item => {
                const name = (item.name || '').toLowerCase();
                const specialty = (item.specialty || '').toLowerCase();
                return name.includes(lowerQuery) || specialty.includes(lowerQuery);
              });
              if (data.length > 0) {
                setResults(data);
              }
            } else if (activeTab === 'style') {
              const data = allResults.filter(item => {
                const styles = Array.isArray(item.styles) ? item.styles : [];
                return styles.some(style => 
                  (style || '').toLowerCase().includes(lowerQuery)
                );
              });
              if (data.length > 0) {
                setResults(data);
              }
            }
          }
        } catch (fbError) {
          console.log('Firebase not available, using demo data');
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    };

    if (searchQuery) {
      fetchResults();
    }
  }, [searchQuery, activeTab]);

  const handleDesignerClick = (designerId) => {
    navigate(`/designer-detail?id=${designerId}`);
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
