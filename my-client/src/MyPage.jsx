import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './firebase';
import { getUserProfile, getUserDogs, getUserBookings, getUserFavorites } from './services';
import PageLayout from './PageLayout';
import './MyPage.css';

export default function MyPage() {
  const navigate = useNavigate();
  const [user] = useAuthState(auth);
  const [userProfile, setUserProfile] = useState(null);
  const [dogs, setDogs] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDogModal, setShowDogModal] = useState(false);

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

      const userBookings = await getUserBookings(user.uid);
      setBookings(userBookings || []);

      const userFavorites = await getUserFavorites(user.uid);
      setFavorites(userFavorites || []);

      if (!userDogs || userDogs.length === 0) {
        setShowDogModal(true);
      }
    } catch (err) {
      console.error('사용자 데이터 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  const primaryDog = dogs && dogs.length > 0 ? dogs[0] : null;

  const toDate = (tsOrDate) => {
    if (!tsOrDate) return null;
    return tsOrDate.toDate ? tsOrDate.toDate() : new Date(tsOrDate);
  };

  const now = new Date();
  const validBookings = Array.isArray(bookings) ? bookings : [];

  const upcomingBooking = validBookings
    .filter((b) => {
      const d = toDate(b.bookingDate);
      return d && d >= now && b.status !== 'cancelled';
    })
    .sort((a, b) => {
      const da = toDate(a.bookingDate);
      const db = toDate(b.bookingDate);
      return da - db;
    })[0] || null;

  const pastBookings = validBookings
    .filter((b) => {
      const d = toDate(b.bookingDate);
      return d && d < now && b.status !== 'cancelled';
    })
    .sort((a, b) => {
      const da = toDate(a.bookingDate);
      const db = toDate(b.bookingDate);
      return db - da;
    })
    .slice(0, 3);

  return (
    <PageLayout title="마이 페이지">
      {/* Content */}
      <div className="mypage-main-container">
        {showDogModal && (
          <div className="mypage-dog-modal-overlay">
            <div className="mypage-dog-modal">
              <h2>우리집 강아지를 먼저 등록해 주세요</h2>
              <p>견적 요청, 예약 등 서비스를 이용하려면 강아지 정보를 등록해야 해요.</p>
              <div className="mypage-dog-modal-actions">
                <button
                  type="button"
                  className="primary"
                  onClick={() => {
                    setShowDogModal(false);
                    navigate('/dog-registration');
                  }}
                >
                  강아지 등록하러 가기
                </button>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => setShowDogModal(false)}
                >
                  나중에 할게요
                </button>
              </div>
            </div>
          </div>
        )}
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
              {primaryDog ? (
                <div
                  className="mypage-dog-info"
                  onClick={() => navigate('/dog-edit', { state: { dogId: primaryDog.id } })}
                >
                  <div className="dog-photo-circle">
                    <div className="dog-photo-inner">🐶</div>
                  </div>
                  <div className="dog-info-text">
                    <p className="dog-name">{primaryDog.name || '이름 미등록'}</p>
                    <p className="dog-meta-line">
                      품종 {primaryDog.breed || '-'} · 나이 {primaryDog.age || '-'} · 체중 {primaryDog.weight || '-'}
                    </p>
                    <p className="dog-meta-line">성별 / 중성화 / 접종 정보는 마이페이지에서 관리할 수 있어요.</p>
                    <p className="dog-meta-line small">최근 예약 횟수와 미용 이력은 아래에서 바로 확인해 보세요.</p>
                  </div>
                </div>
              ) : (
                <div className="mypage-dog-info-empty">
                  <p className="dog-meta-line">등록된 강아지 정보가 없습니다.</p>
                  <button
                    type="button"
                    className="link-text-btn"
                    onClick={() => navigate('/dog-registration')}
                  >
                    우리 집 강아지 등록하러 가기
                  </button>
                </div>
              )}
            </section>

            {/* 우리집 강아지 미용 상태 (프로필 기준) */}
            {primaryDog && (
              <section
                className="mypage-section mypage-section-clickable"
                onClick={() => navigate('/dog-groom-edit', { state: { dogId: primaryDog.id } })}
              >
                <h2 className="section-title">우리집 강아지 미용 상태</h2>
                <div className="section-divider" />
                <p className="dog-meta-line small">
                  털 엉킴 (0~100):{' '}
                  {primaryDog.matting !== '' && primaryDog.matting != null ? primaryDog.matting : '입력 없음'}
                </p>
                <p className="dog-meta-line small">
                  모질 (0~100):{' '}
                  {primaryDog.coatQuality !== '' && primaryDog.coatQuality != null ? primaryDog.coatQuality : '입력 없음'}
                </p>
                <p className="dog-meta-line small">
                  털 빠짐 (0~100):{' '}
                  {primaryDog.shedding !== '' && primaryDog.shedding != null ? primaryDog.shedding : '입력 없음'}
                </p>
                <p className="dog-meta-line small">
                  환경 적응도 (0~100):{' '}
                  {primaryDog.environmentAdaptation !== '' && primaryDog.environmentAdaptation != null
                    ? primaryDog.environmentAdaptation
                    : '입력 없음'}
                </p>
                <p className="dog-meta-line small">
                  피부 민감도 (0~100):{' '}
                  {primaryDog.skinSensitivity !== '' && primaryDog.skinSensitivity != null
                    ? primaryDog.skinSensitivity
                    : '입력 없음'}
                </p>
              </section>
            )}

            {/* 우리집 강아지 미용 내역 */}
            <section className="mypage-section">
              <h2 className="section-title">우리집 강아지 미용 내역</h2>
              <div className="section-divider" />
              {pastBookings.length === 0 ? (
                <p className="dog-meta-line small">아직 미용 내역이 없습니다.</p>
              ) : (
                <>
                  <div className="mypage-grooming-thumbs">
                    {pastBookings.map((item) => {
                      const d = toDate(item.bookingDate);
                      const dateLabel = d
                        ? d.toLocaleDateString('ko-KR')
                        : '-';
                      return (
                        <div className="groom-thumb-card" key={item.docId || item.id}>
                          <div className="groom-thumb-photo" />
                          <p className="groom-thumb-date">{dateLabel}</p>
                          <p className="groom-thumb-designer">미용 예약</p>
                        </div>
                      );
                    })}
                  </div>
                  <button
                    className="link-text-btn"
                    onClick={() => navigate('/mypage-grooming')}
                  >
                    디자이너가 작성한 미용 후기 보러가기
                  </button>
                </>
              )}
            </section>

            {/* 내가 좋아요 누른 샵 / 디자이너 */}
            <section className="mypage-section">
              <h2 className="section-title">내가 좋아요 누른 샵 / 디자이너</h2>
              <div className="section-divider" />
              {favorites.length === 0 ? (
                <p className="dog-meta-line small">즐겨찾기한 샵/디자이너가 없습니다.</p>
              ) : (
                <div className="mypage-favorites-row">
                  {favorites.slice(0, 3).map((fav) => (
                    <div
                      className="favorite-card"
                      key={fav.id || fav.designerId}
                      onClick={() => fav.designerId && navigate(`/designer?id=${fav.designerId}`)}
                    >
                      <div className="favorite-photo" />
                      <p className="favorite-name">{fav.name || '이름 미등록'}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* 다가오는 예약 */}
            {upcomingBooking ? (
              <button
                className="mypage-upcoming-btn"
                type="button"
                onClick={() => navigate('/calendar')}
              >
                {(() => {
                  const d = toDate(upcomingBooking.bookingDate);
                  const label = d
                    ? `${d.toLocaleDateString('ko-KR')} ${upcomingBooking.timeSlot || ''}`
                    : '';
                  return `다가오는 예약 | ${label}`;
                })()}
              </button>
            ) : (
              <button
                className="mypage-upcoming-btn"
                type="button"
                disabled
              >
                🔒 다가오는 예약이 없습니다.
              </button>
            )}

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
