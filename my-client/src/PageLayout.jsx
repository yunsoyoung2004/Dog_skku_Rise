import { useNavigate } from 'react-router-dom';
import './PageLayout.css';

const logoImg = "https://www.figma.com/api/mcp/asset/1907ad64-acfb-41cd-bcbf-9299c17f709e";

export default function PageLayout({ title, children, customHeader }) {
  const navigate = useNavigate();

  return (
    <div className="page-layout">
      {/* Header */}
      {customHeader ? (
        customHeader
      ) : (
        <div
          className="page-layout-header"
          onClick={() => navigate('/dashboard')}
        >
          <img src={logoImg} alt="멍빗어 로고" className="page-layout-logo" />
          <h1 className="page-layout-title">{title}</h1>
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
