import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
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
        setProfile(snap.data());
      }
    } catch (err) {
      console.error('프로필 로드 실패:', err);
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
      <div className="designer-page-header">
        <button onClick={() => navigate(-1)}>←</button>
        <h1>마이 페이지</h1>
      </div>

      <div className="designer-content designer-profile-page">
        <section className="designer-profile-hero">
          <div className="designer-profile-photo" aria-hidden="true" />
          <div className="designer-profile-main">
            <p className="designer-profile-title">
              {profile.name || user?.displayName || '김민지 디자이너'}
            </p>
            <p className="designer-profile-sub">강남구 역삼동</p>
            <p className="designer-profile-desc">
              {profile.bio || '우리 아이가 가장 편한 공간은 집이라는 말, 디자이너 김민지가 실현하고 있어요.'}
            </p>

            <div className="designer-profile-tags">
              <button type="button" className="profile-tag">예약만 진행</button>
              <button type="button" className="profile-tag">낮공개 가능</button>
              <button type="button" className="profile-tag">퇴근</button>
              <button type="button" className="profile-tag">소통 친화</button>
            </div>
          </div>
        </section>

        <section className="designer-profile-menu">
          <button
            type="button"
            className="profile-menu-item"
            onClick={() => navigate('/designer-portfolio')}
          >
            포트폴리오 수정하기
          </button>
          <button type="button" className="profile-menu-item">
            공지사항 및 이벤트
          </button>
          <button type="button" className="profile-menu-item">
            결제수단
          </button>
          <button type="button" className="profile-menu-item">
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
