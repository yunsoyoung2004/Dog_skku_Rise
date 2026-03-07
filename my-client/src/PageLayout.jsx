import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './firebase';
import { getUserQuotes } from './services';
import './PageLayout.css';

const logoImg = "https://www.figma.com/api/mcp/asset/1907ad64-acfb-41cd-bcbf-9299c17f709e";

export default function PageLayout({ title, children, customHeader }) {
  const navigate = useNavigate();
  const [user] = useAuthState(auth);
  const [quoteCount, setQuoteCount] = useState(0);

  useEffect(() => {
    const loadQuotes = async () => {
      if (!user) {
        setQuoteCount(0);
        return;
      }
      try {
        const quotes = await getUserQuotes(user.uid);
        setQuoteCount(quotes.length || 0);
      } catch (e) {
        console.warn('헤더용 받은 견적 수 로드 실패:', e);
        setQuoteCount(0);
      }
    };

    loadQuotes();
  }, [user]);

  return (
    <div className="page-layout">
      {/* Header */}
      {customHeader ? (
        customHeader
      ) : (
        <div className="page-layout-header">
          <div
            className="page-layout-header-main"
            onClick={() => navigate('/dashboard')}
          >
            <img src={logoImg} alt="멍빗어 로고" className="page-layout-logo" />
            <h1 className="page-layout-title">{title}</h1>
          </div>
          <button
            type="button"
            className="page-layout-header-bell"
            onClick={() => navigate('/quote-detail')}
            aria-label="받은 견적 알림"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {quoteCount > 0 && (
              <span className="page-layout-bell-badge">
                {quoteCount > 9 ? '9+' : quoteCount}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Content */}
      <div className="page-layout-content">
        {children}
      </div>

      {/* Bottom Navigation */}
      <div className="page-layout-bottom-nav">
        <button className="nav-btn" onClick={() => navigate('/dashboard')} title="대시보드">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </button>
        <button className="nav-btn" onClick={() => navigate('/search')} title="검색">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
          </svg>
        </button>
        <button className="nav-btn" onClick={() => navigate('/chat')} title="채팅">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </button>
        <button className="nav-btn" onClick={() => navigate('/mypage')} title="마이페이지">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
