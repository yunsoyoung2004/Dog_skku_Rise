import './SearchPage.css';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './firebase';
import { addRecentSearch, getRecentSearches, deleteRecentSearch, clearRecentSearches } from './services';
import PageLayout from './PageLayout';

const LOCAL_RECENT_KEY = 'recentSearches';

// 인기 검색어는 일단 예시로 고정, 최근 검색어는 Firestore/로컬에서 불러옴
const popularSearches = ['예민견', '곰돌이 컷', '노령견'];

function SearchIcon() {
  return (
    <button
      type="button"
      className="search-icon-btn"
      aria-label="검색"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: 'none',
        background: 'none',
        padding: '4px 8px',
        cursor: 'pointer',
        color: '#999'
      }}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
    </button>
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

  const persistLocalRecent = (list) => {
    try {
      if (list.length === 0) {
        window.localStorage.removeItem(LOCAL_RECENT_KEY);
      } else {
        window.localStorage.setItem(LOCAL_RECENT_KEY, JSON.stringify(list));
      }
    } catch (e) {
      console.error('로컬 최근 검색어 저장 실패:', e);
    }
  };

  const handleSearchSubmit = async (query) => {
    const trimmed = query.trim();
    if (!trimmed) return;

    // 공통: 화면에 바로 반영
    setRecentSearches((prev) => {
      const updated = [trimmed, ...prev.filter((v) => v !== trimmed)];
      const sliced = updated.slice(0, 5);
      // 로그인 여부와 상관없이 로컬에도 저장
      persistLocalRecent(sliced);
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

  const handleDeleteRecent = async (keyword) => {
    setRecentSearches((prev) => {
      const next = prev.filter((v) => v !== keyword);
      persistLocalRecent(next);
      return next;
    });

    if (user) {
      try {
        await deleteRecentSearch(user.uid, keyword);
      } catch (e) {
        console.warn('최근 검색어 삭제 실패(무시 가능):', e);
      }
    }
  };

  const handleClearRecent = async () => {
    setRecentSearches([]);
    persistLocalRecent([]);

    if (user) {
      try {
        await clearRecentSearches(user.uid);
      } catch (e) {
        console.warn('최근 검색어 전체 삭제 실패(무시 가능):', e);
      }
    }
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
          <div className="search-section-header">
            <h3 className="search-section-title">최근 검색어</h3>
            {recentSearches.length > 0 && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={handleClearRecent}
              >
                전체 삭제
              </button>
            )}
          </div>
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
                  <span className="search-tag-label">{tag}</span>
                  <span
                    className="search-tag-delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      handleDeleteRecent(tag);
                    }}
                  >
                    ✕
                  </span>
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
