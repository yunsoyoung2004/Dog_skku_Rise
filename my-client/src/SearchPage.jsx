import './SearchPage.css';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from './PageLayout';

const imgSearch = 'https://www.figma.com/api/mcp/asset/9bf497b9-d113-417f-b6c7-0435c3ca0abf';

const recentSearches = ['예민견', '푸들', '노령견'];
const popularSearches = ['곰돌이 컷', '예민견', '노령견'];

function SearchIcon() {
  return (
    <div className="search-icon-container">
      <img src={imgSearch} alt="search" className="search-icon" />
    </div>
  );
}

export default function SearchPage() {
  const [searchInput, setSearchInput] = useState('');
  const navigate = useNavigate();

  const handleSearchSubmit = (query) => {
    if (query.trim()) {
      // Navigate with search results
      navigate(`/search-results?q=${encodeURIComponent(query)}`);
    }
  };

  const handleTagClick = (tag) => {
    handleSearchSubmit(tag);
  };

  return (
    <PageLayout title="검색">
      {/* Search Bar */}
      <div className="search-bar-container">
        <div className="search-bar">
          <SearchIcon />
          <input
            type="text"
            className="search-input"
            placeholder="검색"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearchSubmit(searchInput)}
          />
        </div>
      </div>

      <div className="search-sections-wrapper">
        {/* Recent Searches Section */}
        <div className="search-section">
          <h3 className="search-section-title">최근 검색어</h3>
          <div className="search-tags">
            {recentSearches.map((tag, idx) => (
              <button
                key={idx}
                className="search-tag recent"
                onClick={() => handleTagClick(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Popular Searches Section */}
        <div className="search-section">
          <h3 className="search-section-title">인기 검색어</h3>
          <div className="search-tags">
            {popularSearches.map((tag, idx) => (
              <button
                key={idx}
                className="search-tag popular"
                onClick={() => handleTagClick(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
