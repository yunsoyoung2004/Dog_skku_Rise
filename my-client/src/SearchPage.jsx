import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './SearchPage.css';

// 임시 검색 데이터
const searchData = [
  { id: 1, title: '예민견', category: 'breed' },
  { id: 2, title: '푸들', category: 'breed' },
  { id: 3, title: '노령견', category: 'age' },
  { id: 4, title: '곰돌이 컷', category: 'grooming' },
  { id: 5, title: '예방접종', category: 'health' },
  { id: 6, title: '피부질환', category: 'health' },
  { id: 7, title: '산책 코스', category: 'activity' },
  { id: 8, title: '반려동물 카페', category: 'place' },
];

export default function SearchPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [recentSearches, setRecentSearches] = useState(['푸들', '예민견', '산책']);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (value.trim() === '') {
      setSearchResults([]);
      return;
    }

    // 검색 필터링
    const results = searchData.filter((item) =>
      item.title.toLowerCase().includes(value.toLowerCase())
    );
    setSearchResults(results);
  };

  const handleSearchSubmit = (term) => {
    if (term.trim() === '') return;

    // 최근 검색어에 추가
    setRecentSearches((prev) => {
      const filtered = prev.filter((item) => item !== term);
      return [term, ...filtered].slice(0, 3);
    });

    // 검색 수행 로직
    console.log('검색:', term);
    setSearchTerm('');
    setSearchResults([]);
  };

  const handleResultClick = (item) => {
    handleSearchSubmit(item.title);
  };

  const handleRecentSearchClick = (search) => {
    setSearchTerm(search);
    handleSearchSubmit(search);
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="search-page">
      {/* 검색 입력창 */}
      <div className="search-header">
        <input
          type="text"
          className="search-input"
          placeholder="검색"
          value={searchTerm}
          onChange={handleSearch}
          autoFocus
        />
        <button className="search-back-btn" onClick={handleBack}>
          ✕
        </button>
      </div>

      {/* 검색 결과 */}
      {searchResults.length > 0 && (
        <div className="search-results">
          {searchResults.map((result) => (
            <div
              key={result.id}
              className="search-result-item"
              onClick={() => handleResultClick(result)}
            >
              <div className="search-result-title">{result.title}</div>
            </div>
          ))}
        </div>
      )}

      {/* 검색 결과가 없을 때 - 최근/인기 검색어 */}
      {searchResults.length === 0 && searchTerm === '' && (
        <div className="search-suggestions">
          {/* 최근 검색어 */}
          <div className="suggestions-section">
            <div className="suggestions-title">최근 검색어</div>
            <div className="suggestions-divider"></div>
            <div className="suggestions-tags">
              {recentSearches.map((search, index) => (
                <button
                  key={index}
                  className="tag recent-tag"
                  onClick={() => handleRecentSearchClick(search)}
                >
                  {search}
                </button>
              ))}
            </div>
          </div>

          {/* 인기 검색어 */}
          <div className="suggestions-section">
            <div className="suggestions-title">인기 검색어</div>
            <div className="suggestions-divider"></div>
            <div className="suggestions-tags">
              <button className="tag popular-tag" onClick={() => handleSearchSubmit('곰돌이 컷')}>
                곰돌이 컷
              </button>
              <button className="tag popular-tag" onClick={() => handleSearchSubmit('예민견')}>
                예민견
              </button>
              <button className="tag popular-tag" onClick={() => handleSearchSubmit('노령견')}>
                노령견
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
