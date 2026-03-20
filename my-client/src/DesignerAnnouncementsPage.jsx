import { useNavigate } from 'react-router-dom';
import './DesignerPageNav.css';
import './DesignerAnnouncementsPage.css';
import DesignerNotificationButton from './components/DesignerNotificationButton';
import DesignerHeaderBrand from './components/DesignerHeaderBrand';

export default function DesignerAnnouncementsPage() {
  const navigate = useNavigate();

  return (
    <div className="designer-page">
      <div className="designer-page-header">
        <DesignerHeaderBrand />
        <h1>공지사항 및 이벤트</h1>
        <div className="designer-header-right">
          <DesignerNotificationButton />
        </div>
      </div>

      <div className="designer-content designer-announcements-page">
        <section className="announcement-card">
          <h2 className="announcement-title">디자이너 전용 공지</h2>
          <p className="announcement-body">
            멍빗어와 함께해 주시는 디자이너님을 위한 안내입니다.
            {"\n"}
            {"\n"}
            - 디자이너 전용 프로모션 및 교육 일정은 앱 내 공지로 순차 안내됩니다.{"\n"}
            - 새로운 기능이나 정책 변경 사항은 사전에 푸시 알림과 함께 공유됩니다.{"\n"}
            - 자세한 문의는 고객센터 메뉴를 통해 운영팀으로 연락해 주세요.
          </p>
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
