import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import AlertModal from './components/AlertModal';
import './DesignerPageNav.css';
import './DesignerProfilePage.css';

export default function DesignerProfilePage() {
  const navigate = useNavigate();
  const [user] = useAuthState(auth);
  const [profile, setProfile] = useState({
    name: '',
    specialty: '',
    location: '',
    bio: '',
    experience: 0,
    priceMin: 0,
    priceMax: 0
  });
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  useEffect(() => {
    if (!user) {
      navigate('/designer-login');
      return;
    }
    loadProfile();
  }, [user, navigate]);

  const loadProfile = async () => {
    try {
      const userRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const data = snap.data();
        setProfile(data);
        // 디자이너 알림 갯수 로드
        setUnreadNotificationCount(data?.unreadNotificationCount || 0);
      }
    } catch (err) {
      console.error('프로필 로드 실패:', err);
      setAlert({
        title: '프로필 로드 실패',
        text: '프로필 정보를 불러올 수 없습니다. 잠시 후 다시 시도해 주세요.'
      });
    }
  };

  const handleLogout = async () => {
    if (window.confirm('로그아웃 하시겠습니까?')) {
      try {
        await signOut(auth);
        navigate('/designer-login');
      } catch (err) {
        console.error('로그아웃 실패:', err);
      }
    }
  };

  return (
    <div className="designer-page">
      <AlertModal
        isOpen={!!alert}
        title={alert?.title}
        text={alert?.text}
        primaryButtonText="확인"
        onPrimaryClick={() => setAlert(null)}
      />
      <div className="designer-page-header">
        <button onClick={() => navigate(-1)}>←</button>
        <h1>마이 페이지</h1>
      </div>

      <div className="designer-content designer-profile-page">
        <section className="designer-profile-hero">
          <div className="designer-profile-photo" aria-hidden="true">
            {profile.photoURL && (
              <img
                src={profile.photoURL}
                alt="디자이너 프로필"
                className="designer-profile-photo-img"
              />
            )}
          </div>
          <button
            type="button"
            className="designer-profile-main"
            onClick={() => navigate('/designer-portfolio')}
          >
            <p className="designer-profile-title">
              {profile.name || user?.displayName || '이름을 설정해 주세요'}
            </p>
            <p className="designer-profile-sub">
              {profile.location || '위치를 설정해 주세요'}
            </p>
            <p className="designer-profile-desc">
              {profile.bio || '소개를 작성해 주세요.'}
            </p>
          </button>

            {/* 태그 영역은 추후 실제 설정 데이터가 생기면 노출 */}
        </section>

        <section className="designer-profile-menu">
          <button
            type="button"
            className="profile-menu-item"
            onClick={() => navigate('/designer-portfolio')}
          >
            포트폴리오 수정하기
          </button>
          <button
            type="button"
            className="profile-menu-item"
            onClick={() => navigate('/designer-announcements')}
          >
            공지사항 및 이벤트
          </button>
          <button
            type="button"
            className="profile-menu-item"
            onClick={() => navigate('/designer-support')}
          >
            고객센터
          </button>
        </section>

        <button
          type="button"
          className="profile-logout-button"
          onClick={handleLogout}
          disabled={loading}
        >
          {loading ? '처리 중...' : '로그아웃'}
        </button>
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
