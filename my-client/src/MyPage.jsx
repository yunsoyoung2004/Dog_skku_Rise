import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './firebase';
import { getUserProfile, getUserDogs } from './services';
import PageLayout from './PageLayout';
import './MyPage.css';

export default function MyPage() {
  const navigate = useNavigate();
  const [user] = useAuthState(auth);
  const [userProfile, setUserProfile] = useState(null);
  const [dogs, setDogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      const profile = await getUserProfile(user.uid);
      setUserProfile(profile);

      const userDogs = await getUserDogs(user.uid);
      setDogs(userDogs);
    } catch (err) {
      console.error('사용자 데이터 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  const primaryDog = dogs && dogs.length > 0 ? dogs[0] : null;

  return (
    <PageLayout title="마이 페이지">
      {/* Content */}
      <div className="mypage-main-container">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
            로딩 중...
          </div>
        ) : (
          <>
            {/* 우리집 강아지 정보 */}
            <section className="mypage-section">
              <h2 className="section-title">우리집 강아지 정보</h2>
              <div className="section-divider" />
              <div className="mypage-dog-info">
                <div className="dog-photo-circle">
                  <div className="dog-photo-inner">🐶</div>
                </div>
                <div className="dog-info-text">
                  <p className="dog-name">{primaryDog?.name || '뽀또'}</p>
                  <p className="dog-meta-line">
                    품종 {primaryDog?.breed || '푸들'} · 나이 {primaryDog?.age || '5살'} · 체중 {primaryDog?.weight || '5kg'}
                  </p>
                  <p className="dog-meta-line">성별 / 중성화 / 접종 정보는 마이페이지에서 관리할 수 있어요.</p>
                  <p className="dog-meta-line small">최근 예약 횟수와 미용 이력은 아래에서 바로 확인해 보세요.</p>
                </div>
              </div>
            </section>

            {/* 우리집 강아지 미용 내역 */}
            <section className="mypage-section">
              <h2 className="section-title">우리집 강아지 미용 내역</h2>
              <div className="section-divider" />
              <div className="mypage-grooming-thumbs">
                <div className="groom-thumb-card">
                  <div className="groom-thumb-photo" />
                  <p className="groom-thumb-date">2026. 02. 02.</p>
                  <p className="groom-thumb-designer">김민지 디자이너</p>
                </div>
                <div className="groom-thumb-card">
                  <div className="groom-thumb-photo" />
                  <p className="groom-thumb-date">2026. 01. 10.</p>
                  <p className="groom-thumb-designer">린지 디자이너</p>
                </div>
                <div className="groom-thumb-card">
                  <div className="groom-thumb-photo" />
                  <p className="groom-thumb-date">2025. 12. 06.</p>
                  <p className="groom-thumb-designer">양명뷰티</p>
                </div>
              </div>
              <button
                className="link-text-btn"
                onClick={() => navigate('/mypage-grooming')}
              >
                디자이너가 작성한 미용 후기 보러가기
              </button>
            </section>

            {/* 내가 좋아요 누른 샵 / 디자이너 */}
            <section className="mypage-section">
              <h2 className="section-title">내가 좋아요 누른 샵 / 디자이너</h2>
              <div className="section-divider" />
              <div className="mypage-favorites-row">
                <div className="favorite-card">
                  <div className="favorite-photo" />
                  <p className="favorite-name">김민지 디자이너</p>
                </div>
                <div className="favorite-card">
                  <div className="favorite-photo" />
                  <p className="favorite-name">뽀또뷰티 미용</p>
                </div>
                <div className="favorite-card">
                  <div className="favorite-photo" />
                  <p className="favorite-name">양명뷰티</p>
                </div>
              </div>
            </section>

            {/* 다가오는 예약 */}
            <button
              className="mypage-upcoming-btn"
              type="button"
            >
              다가오는 예약 | 2026. 02. 02. 11:00
            </button>

            {/* 하단 버튼들 */}
            <div className="mypage-bottom-buttons">
              <button
                type="button"
                className="bottom-action-btn"
                onClick={() => navigate('/mypage-account')}
              >
                계정 정보 확인하기
              </button>
              <button
                type="button"
                className="bottom-action-btn"
                onClick={() => navigate('/help')}
              >
                FAQ | 고객 센터
              </button>
            </div>
          </>
        )}
      </div>
    </PageLayout>
  );
}
