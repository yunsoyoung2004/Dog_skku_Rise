import './SearchPage.css';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './firebase';
import { addRecentSearch, getRecentSearches } from './services';
import PageLayout from './PageLayout';

const imgSearch = 'https://www.figma.com/api/mcp/asset/9bf497b9-d113-417f-b6c7-0435c3ca0abf';

const LOCAL_RECENT_KEY = 'recentSearches';

// 인기 검색어는 일단 예시로 고정, 최근 검색어는 Firestore/로컬에서 불러옴
const popularSearches = ['예민견', '곰돌이 컷', '노령견'];

function SearchIcon() {
  return (
    <div className="search-icon-container">
      <img src={imgSearch} alt="search" className="search-icon" />
    </div>
  );
}

export default function SearchPage() {
  const [searchInput, setSearchInput] = useState('');
  const [recentSearches, setRecentSearches] = useState([]);
  const navigate = useNavigate();
  const [user] = useAuthState(auth);

  useEffect(() => {
    const loadRecent = async () => {
      // 로그인 X: 로컬스토리지에서 최근 검색어 로드
      if (!user) {
        try {
          const raw = window.localStorage.getItem(LOCAL_RECENT_KEY);
          if (!raw) {
            setRecentSearches([]);
            return;
          }
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            setRecentSearches(parsed.slice(0, 5));
          } else {
            setRecentSearches([]);
          }
        } catch (e) {
          console.error('로컬 최근 검색어 로드 실패:', e);
          setRecentSearches([]);
        }
        return;
      }

      // 로그인 O: Firestore에서 최근 검색어 로드
      try {
        const list = await getRecentSearches(user.uid, 5);
        setRecentSearches(list);
      } catch (e) {
        console.error('최근 검색어 로드 실패:', e);
      }
    };
    loadRecent();
  }, [user]);

  const handleSearchSubmit = async (query) => {
    const trimmed = query.trim();
    if (!trimmed) return;

    // 공통: 화면에 바로 반영
    setRecentSearches((prev) => {
      const updated = [trimmed, ...prev.filter((v) => v !== trimmed)];
      const sliced = updated.slice(0, 5);
      try {
        // 로그인 여부와 상관없이 로컬에도 저장
        window.localStorage.setItem(LOCAL_RECENT_KEY, JSON.stringify(sliced));
      } catch (e) {
        console.error('로컬 최근 검색어 저장 실패:', e);
      }
      return sliced;
    });

    // 로그인 상태라면 Firestore에도 저장
    if (user) {
      try {
        await addRecentSearch(user.uid, trimmed);
      } catch (e) {
        console.error('최근 검색어 저장 실패:', e);
      }
    }

    navigate(`/search-results?q=${encodeURIComponent(trimmed)}`);
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
          {recentSearches.length === 0 ? (
            <p className="search-empty-text">최근 검색어가 없습니다.</p>
          ) : (
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
          )}
        </div>

        {/* Popular Searches Section */}
        <div className="search-section">
          <h3 className="search-section-title">인기 검색어</h3>
          {popularSearches.length === 0 ? (
            <p className="search-empty-text">표시할 인기 검색어가 없습니다.</p>
          ) : (
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
          )}
        </div>
      </div>
    </PageLayout>
  );
}
