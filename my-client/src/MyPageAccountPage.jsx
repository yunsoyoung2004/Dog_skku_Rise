import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './firebase';
import { signOut } from 'firebase/auth';
import { saveUserProfile, getUserProfile } from './services';
import './MyPageAccountPage.css';

const logoImg = "/vite.svg";

export default function MyPageAccountPage() {
  const navigate = useNavigate();
  const [user] = useAuthState(auth);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userInfo, setUserInfo] = useState({
    name: '',
    phone: '',
    address: ''
  });

  useEffect(() => {
    loadUserProfile();
  }, [user]);

  const loadUserProfile = async () => {
    if (!user) return;
    try {
      const profile = await getUserProfile(user.uid);
      if (profile) {
        setUserInfo({
          name: profile.name || user.displayName || '',
          phone: profile.phone || '',
          address: profile.address || ''
        });
      }
    } catch (err) {
      console.error('프로필 로드 실패:', err);
    }
  };

  const handleEditChange = (field, value) => {
    setUserInfo({ ...userInfo, [field]: value });
  };

  const handleSaveProfile = async () => {
    setError('');

    if (!userInfo.name.trim() || !userInfo.phone.trim() || !userInfo.address.trim()) {
      setError('모든 필드를 입력해주세요');
      return;
    }

    setLoading(true);
    try {
      const result = await saveUserProfile(user.uid, {
        name: userInfo.name,
        phone: userInfo.phone,
        address: userInfo.address
      });

      if (result.success) {
        setIsEditing(false);
        setError('프로필이 저장되었습니다');
        setTimeout(() => setError(''), 2000);
      }
    } catch (err) {
      console.error('❌ 프로필 저장 실패:', err);
      setError('프로필 저장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (err) {
      console.error('로그아웃 실패:', err);
      setError('로그아웃에 실패했습니다.');
    }
  };

  return (
    <div className="mypage-account" data-node-id="511:2572">
      {/* Header */}
      <div className="mypage-account-header">
        <div className="mypage-acc-logo">
          <img src={logoImg} alt="멍빗어" />
        </div>
        <h1>마이 페이지</h1>
      </div>

      {/* Content */}
      <div className="mypage-account-container">
        <div className="account-section">
          <div className="section-header">
            <h2>계정 정보</h2>
            {isEditing ? (
              <button
                className="edit-btn"
                onClick={handleSaveProfile}
                disabled={loading}
              >
                {loading ? '저장중...' : '저장'}
              </button>
            ) : (
              <button
                className="edit-btn"
                onClick={() => setIsEditing(true)}
              >
                수정
              </button>
            )}
          </div>

          <div className="account-info-list">
            <div className="account-item">
              <label>이름</label>
              {isEditing ? (
                <input
                  type="text"
                  value={userInfo.name}
                  onChange={(e) => handleEditChange('name', e.target.value)}
                  className="account-input"
                  disabled={loading}
                />
              ) : (
                <p>{userInfo.name || '로드 중...'}</p>
              )}
            </div>

            <div className="account-item">
              <label>이메일</label>
              <p>{user?.email || ''}</p>
            </div>

            <div className="account-item">
              <label>전화번호</label>
              {isEditing ? (
                <input
                  type="tel"
                  value={userInfo.phone}
                  onChange={(e) => handleEditChange('phone', e.target.value)}
                  className="account-input"
                  disabled={loading}
                />
              ) : (
                <p>{userInfo.phone || '등록되지 않음'}</p>
              )}
            </div>

            <div className="account-item">
              <label>주소</label>
              {isEditing ? (
                <input
                  type="text"
                  value={userInfo.address}
                  onChange={(e) => handleEditChange('address', e.target.value)}
                  className="account-input"
                  disabled={loading}
                />
              ) : (
                <p>{userInfo.address || '등록되지 않음'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div style={{ padding: '10px', backgroundColor: error.includes('저장') ? '#eeffee' : '#ffeeee', color: error.includes('저장') ? '#00aa00' : '#cc0000', textAlign: 'center', marginBottom: '10px' }}>
            {error}
          </div>
        )}

        {/* Logout / Delete Buttons */}
        <button className="logout-btn" onClick={handleLogout}>
          로그아웃
        </button>
        <button className="account-delete-btn" disabled={loading}>
          회원 탈퇴하기
        </button>
      </div>

      {/* Bottom Navigation */}
      <div className="mypage-account-nav">
        <button className="nav-btn" onClick={() => navigate('/dashboard')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </button>
        <button className="nav-btn" onClick={() => navigate('/search')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
          </svg>
        </button>
        <button className="nav-btn" onClick={() => navigate('/chat')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </button>
        <button className="nav-btn" onClick={() => navigate('/mypage')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
          </svg>
        </button>
      </div>
    </div>
  );
}
