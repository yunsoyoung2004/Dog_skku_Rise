import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './firebase';
import './DesignerPageNav.css';
import './DesignerPortfolioPage.css';

export default function DesignerPortfolioPage() {
  const navigate = useNavigate();
  const [user] = useAuthState(auth);

  useEffect(() => {
    if (!user) {
      navigate('/designer-login');
    }
  }, [user, navigate]);

  return (
    <div className="designer-page">
      <div className="designer-page-header">
        <button onClick={() => navigate(-1)}>←</button>
        <h1>포트폴리오</h1>
      </div>

      <div className="designer-content designer-portfolio-page">
        <section className="portfolio-hero">
          <div className="portfolio-photo" aria-hidden="true" />
          <div className="portfolio-main">
            <p className="portfolio-title">{user?.displayName || '김민지 디자이너'}</p>
            <p className="portfolio-sub">강남구 역삼동</p>
            <p className="portfolio-desc">
              우리 아이가 가장 편안한 순간을 담은 포트폴리오를 관리해 보세요.
            </p>
          </div>
        </section>

        <section className="portfolio-menu">
          <button type="button" className="portfolio-menu-item primary">
            포트폴리오 수정하기
          </button>
          <button type="button" className="portfolio-menu-item">
            공지사항 및 이벤트
          </button>
          <button type="button" className="portfolio-menu-item">
            결제수단
          </button>
          <button type="button" className="portfolio-menu-item">
            고객센터
          </button>
        </section>
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
