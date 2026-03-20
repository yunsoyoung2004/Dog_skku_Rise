import { useNavigate } from 'react-router-dom';
import './DesignerPageNav.css';
import './DesignerSupportPage.css';
import DesignerNotificationButton from './components/DesignerNotificationButton';
import DesignerHeaderBrand from './components/DesignerHeaderBrand';

export default function DesignerSupportPage() {
  const navigate = useNavigate();

  return (
    <div className="designer-page">
      <div className="designer-page-header">
        <DesignerHeaderBrand />
        <h1>고객센터</h1>
        <div className="designer-header-right">
          <DesignerNotificationButton />
        </div>
      </div>

      <div className="designer-content designer-support-page">
        <section className="support-card">
          <h2 className="support-title">문의 및 연락처</h2>
          <p className="support-body">
            디자이너 전용 고객센터 안내입니다.{"\n"}
            {"\n"}
            - 운영 시간: 평일 10:00 ~ 18:00 (주말·공휴일 휴무){"\n"}
            - 이메일: support@meongbit-eo.com{"\n"}
            - 카카오톡 채널: @멍빗어디자이너{"\n"}
            {"\n"}
            견적/예약/정산 관련 문의나 서비스 개선 제안이 있다면 언제든지 연락 주세요.
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
