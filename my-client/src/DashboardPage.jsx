import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, getDocs } from 'firebase/firestore';
import { auth, db } from './firebase';
import { getGroomingStats, getAllDesigners, getUserQuotes } from './services';
import PageLayout from './PageLayout';
import './DashboardPage.css';

// Figma에서 사용하던 원래 TOP 카드 이미지
const topCardImage = 'https://www.figma.com/api/mcp/asset/6ff4a18f-d433-401b-8c09-280194b24689';

// 지역/구/동 정보 (LocationSelectModal과 동일 구조)
const locations = {
  서울: {
    zones: ['강남구', '강북구', '강서구', '관악구', '광진구'],
    districts: {
      강남구: ['강남', '역삼동', '삼성동', '논현동', '청담동'],
      강북구: ['수유동', '미아동', '번동', '우이동'],
      강서구: ['화곡동', '목동', '등촌동', '염창동'],
      관악구: ['신림동', '봉천동', '낙성대동'],
      광진구: ['자양동', '중곡동', '능동'],
    },
  },
  경기: {
    zones: ['수원', '성남', '고양', '용인', '부천'],
    districts: {
      수원: ['장안구', '권선구', '팔달구', '영통구'],
      성남: ['분당구', '수정구', '중원구'],
      고양: ['덕양구', '일산동구', '일산서구'],
      용인: ['기흥구', '수지구', '처인구'],
      부천: ['원미구', '소사구', '오정구'],
    },
  },
  인천: {
    zones: ['남동구', '연수구', '남서구', '중구'],
    districts: {
      남동구: ['간석동', '만수동', '남촌동'],
      연수구: ['송도동', '연수동', '옥련동'],
      남서구: ['검단동', '신천동'],
      중구: ['운서동', '영종동'],
    },
  },
  강원: {
    zones: ['춘천', '원주', '강릉', '속초'],
    districts: {
      춘천: ['중앙로', '약사동'],
      원주: ['일산동', '귀래'],
      강릉: ['교동', '창동'],
      속초: ['도심', '노학동'],
    },
  },
  대전: {
    zones: ['동구', '중구', '서구', '유성구'],
    districts: {
      동구: ['전동', '가양동', '대별동'],
      중구: ['중앙동', '대흥동'],
      서구: ['둔산동', '정동'],
      유성구: ['봉명동', '노은동'],
    },
  },
};

// 레이더 차트에 사용할 5개 지표
const RADAR_METRICS = [
  { key: 'matting', label: '털 엉킴' },
  { key: 'coatQuality', label: '모질' },
  { key: 'shedding', label: '털 빠짐' },
  { key: 'environmentAdaptation', label: '환경 적응도' },
  { key: 'skinSensitivity', label: '피부 민감도' },
];

const clamp = (value, min, max) => {
  const v = typeof value === 'number' ? value : Number(value ?? 0);
  if (Number.isNaN(v)) return min;
  return Math.min(max, Math.max(min, v));
};

function getRegularPolygonPoints(sides, radius, cx, cy) {
  const points = [];
  for (let i = 0; i < sides; i += 1) {
    const angle = (Math.PI * 2 * i) / sides - Math.PI / 2; // 12시 방향부터 시작
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    points.push(`${x},${y}`);
  }
  return points.join(' ');
}

function getRadarPolygonPoints(values, maxRadius, cx, cy) {
  const sides = values.length;
  const points = [];

  for (let i = 0; i < sides; i += 1) {
    const ratio = clamp(values[i], 0, 100) / 100;
    const radius = maxRadius * ratio;
    const angle = (Math.PI * 2 * i) / sides - Math.PI / 2;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    points.push(`${x},${y}`);
  }

  return points.join(' ');
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [hasDogData, setHasDogData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [groomingCount, setGroomingCount] = useState(0);
  const [primaryDog, setPrimaryDog] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState({
    zone: '강남구',
    district: '역삼동',
  });
  const [bannerIndex, setBannerIndex] = useState(0); // 0: 프로모션 배너, 1: 지역 선택 배너
  const [currentRegion, setCurrentRegion] = useState('서울');
  const [currentZone, setCurrentZone] = useState('강남구');
  const [currentDistrict, setCurrentDistrict] = useState('강남');
  const [nearbyDesignerCount, setNearbyDesignerCount] = useState(0);
  const [receivedQuoteCount, setReceivedQuoteCount] = useState(0);

  // 레이더 차트용 값 (0~100, 없으면 0)
  const radarValues = RADAR_METRICS.map((m) => {
    const raw = primaryDog ? primaryDog[m.key] : null;
    if (raw === '' || raw == null) return 0;
    return clamp(raw, 0, 100);
  });
  const hasRadarData = radarValues.some((v) => v > 0);

  // Firebase에서 강아지 데이터 및 미용 통계 확인
  useEffect(() => {
    const checkDogData = async () => {
      try {
        setLoading(true);
        const currentUser = auth.currentUser;

        if (!currentUser) {
          setHasDogData(false);
          setGroomingCount(0);
          setNearbyDesignerCount(0);
          setReceivedQuoteCount(0);
          return;
        }

        // Firestore에서 사용자의 강아지 정보 확인
        const dogsRef = collection(db, 'users', currentUser.uid, 'dogs');
        const q = query(dogsRef);
        const snapshot = await getDocs(q);

        const hasDog = snapshot.size > 0;
        setHasDogData(hasDog);

        if (hasDog) {
          const firstDoc = snapshot.docs[0];
          const data = firstDoc.data();
          setPrimaryDog({ id: firstDoc.id, ...data });

          try {
            const stats = await getGroomingStats(currentUser.uid);
            setGroomingCount(stats?.totalGroomings || 0);
          } catch (e) {
            console.error('미용 통계 조회 실패:', e);
            setGroomingCount(0);
          }
        } else {
          setGroomingCount(0);
        }

        // 주변 디자이너 수 (designers 컬렉션 개수 기준, 없으면 0)
        try {
          const designers = await getAllDesigners();
          setNearbyDesignerCount(Array.isArray(designers) ? designers.length : 0);
        } catch (e) {
          console.error('디자이너 조회 실패:', e);
          setNearbyDesignerCount(0);
        }

        // 사용자가 디자이너에게 받은 견적 수
        try {
          const receivedQuotes = await getUserQuotes(currentUser.uid);
          setReceivedQuoteCount(receivedQuotes.length || 0);
        } catch (e) {
          console.warn('받은 견적 수를 불러오지 못했습니다:', e);
          setReceivedQuoteCount(0);
        }
      } catch (error) {
        console.error('강아지 데이터 확인 오류:', error);
        setHasDogData(false);
        setPrimaryDog(null);
        setGroomingCount(0);
        setNearbyDesignerCount(0);
        setReceivedQuoteCount(0);
      } finally {
        setLoading(false);
      }
    };

    checkDogData();
  }, []);

  const handleRegionChange = (region) => {
    setCurrentRegion(region);
    const firstZone = locations[region].zones[0];
    setCurrentZone(firstZone);
    const firstDistrict = locations[region].districts[firstZone][0];
    setCurrentDistrict(firstDistrict);
  };

  const handleZoneSelect = (zone) => {
    setCurrentZone(zone);
    const districts = locations[currentRegion].districts[zone];
    setCurrentDistrict(districts[0]);
  };

  const handleDistrictSelect = (district) => {
    setCurrentDistrict(district);
    // 동(동리) 선택 시 자동으로 위치 업데이트 후 배너 닫기
    setSelectedLocation({
      zone: currentZone,
      district,
    });
    setBannerIndex(0);
  };

  return (
    <PageLayout title="멍빗어">
      {/* Location Section */}
      <div className="dashboard-location-section">
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M8 1C4.7 1 2 3.7 2 7c0 3.5 6 8 6 8s6-4.5 6-8c0-3.3-2.7-6-6-6z" />
          <circle cx="8" cy="7" r="2" fill="currentColor" />
        </svg>
        <span className="dashboard-location-text">
          {selectedLocation.zone} {selectedLocation.district}
        </span>
      </div>

      {/* TOP 5 / 지역 선택 배너 (슬라이드 전환) */}
      <div
        className="dashboard-top-card"
        style={bannerIndex === 1 ? { height: 'auto', minHeight: '110px' } : {}}
        onClick={bannerIndex === 0 ? () => setBannerIndex(1) : undefined}
      >
        {bannerIndex === 0 ? (
          <>
            <img
              src={topCardImage}
              alt="예민견 미용샵 TOP 5"
              className="dashboard-top-card-image"
            />
            <div className="dashboard-top-card-content">
              <h2 className="dashboard-top-card-title">
                예민견 미용샵
                <br />
                TOP 5
              </h2>
              <p className="dashboard-top-card-subtitle">가장 전문적인 샵을 만나보세요</p>
            </div>
          </>
        ) : (
          <div
            className="dashboard-location-banner"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundImage: `url(${topCardImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'top left',
              backgroundAttachment: 'fixed',
            }}
          >
            <div className="location-grid">
              {/* Column 1: 시도 */}
              <div className="location-column">
                <div className="location-column-header">시도</div>
                <div className="location-column-items">
                  {Object.keys(locations).map((region) => (
                    <button
                      key={region}
                      type="button"
                      className={`location-item ${currentRegion === region ? 'active' : ''}`}
                      onClick={() => handleRegionChange(region)}
                    >
                      {region}
                    </button>
                  ))}
                </div>
              </div>

              {/* Column 2: 구/군 */}
              <div className="location-column">
                <div className="location-column-header">구/군</div>
                <div className="location-column-items">
                  {locations[currentRegion].zones.map((zone) => (
                    <button
                      key={zone}
                      type="button"
                      className={`location-item ${currentZone === zone ? 'active' : ''}`}
                      onClick={() => handleZoneSelect(zone)}
                    >
                      {zone}
                    </button>
                  ))}
                </div>
              </div>

              {/* Column 3: 동 */}
              <div className="location-column">
                <div className="location-column-header">동</div>
                <div className="location-column-items">
                  {locations[currentRegion].districts[currentZone].map((district) => (
                    <button
                      key={district}
                      type="button"
                      className={`location-item ${currentDistrict === district ? 'active' : ''}`}
                      onClick={() => handleDistrictSelect(district)}
                    >
                      {district}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Categories Navigation - 5 Items */}
      <div className="dashboard-categories">
        <button
          className="dashboard-category-btn"
          onClick={() => navigate('/designers?mode=all')}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <circle cx="6" cy="6" r="2" />
            <circle cx="14" cy="6" r="2" />
            <circle cx="10" cy="14" r="2" />
          </svg>
          <span>전체보기</span>
        </button>
        <button
          className="dashboard-category-btn"
          onClick={() =>
            navigate(`/designers?mode=region&district=${encodeURIComponent(currentDistrict || '')}`)
          }
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <circle cx="10" cy="10" r="8" />
            <path d="M10 6v8M6 10h8" strokeLinecap="round" />
          </svg>
          <span>지역별</span>
        </button>
        <button
          className="dashboard-category-btn"
          onClick={() => navigate('/designers?mode=custom')}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <rect x="3" y="4" width="14" height="12" rx="1" />
            <path d="M3 8h14" />
          </svg>
          <span>맞춤별</span>
        </button>
        <button className="dashboard-category-btn">
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <circle cx="10" cy="10" r="8" />
            <path d="M10 5v10M5 10h10" strokeLinecap="round" />
          </svg>
          <span>당일 예약</span>
        </button>
        <button
          className="dashboard-category-btn"
          onClick={() => navigate('/quote-request')}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path
              d="M18 9l-1.5-1.5L10 14.5 4.5 9 3 10.5 10 17l8-8z"
              stroke="none"
              fill="currentColor"
            />
          </svg>
          <span>빠른 견적 요청</span>
        </button>
      </div>

      {/* Divider */}
      <div className="dashboard-divider" />

      {/* Chart / Stats Section */}
      {loading ? (
        <div className="dashboard-loading">
          <div className="loading-spinner" />
        </div>
      ) : hasDogData ? (
        // ===== DATA AVAILABLE STATE (강아지 정보 있음) =====
        <>
          <section className="dashboard-section dashboard-section-spacing">
            <h2 className="dashboard-section-title">우리집 강아지 미용 상태</h2>
            {primaryDog && hasRadarData ? (
              <div className="dashboard-radar-wrapper">
                <svg
                  className="dashboard-radar-svg"
                  viewBox="0 0 220 220"
                  aria-label="우리집 강아지 미용 상태 레이더 차트"
                >
                  <defs>
                    <linearGradient id="dogRadarFill" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.24" />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.32" />
                    </linearGradient>
                  </defs>
                  {/* 그리드 다각형 */}
                  {[20, 40, 60, 80, 100].map((level) => (
                    <polygon
                      key={level}
                      className="dashboard-radar-grid"
                      points={getRegularPolygonPoints(
                        RADAR_METRICS.length,
                        (level / 100) * 80,
                        110,
                        110,
                      )}
                    />
                  ))}
                  {/* 축 선 */}
                  {RADAR_METRICS.map((_, idx) => {
                    const angle = (Math.PI * 2 * idx) / RADAR_METRICS.length - Math.PI / 2;
                    const x = 110 + 80 * Math.cos(angle);
                    const y = 110 + 80 * Math.sin(angle);
                    return (
                      <line
                        // eslint-disable-next-line react/no-array-index-key
                        key={idx}
                        x1={110}
                        y1={110}
                        x2={x}
                        y2={y}
                        className="dashboard-radar-axis"
                      />
                    );
                  })}
                  {/* 값 영역 */}
                  <polygon
                    className="dashboard-radar-value"
                    points={getRadarPolygonPoints(radarValues, 80, 110, 110)}
                  />
                  {/* 꼭짓점 레이블 */}
                  {RADAR_METRICS.map((metric, idx) => {
                    const angle = (Math.PI * 2 * idx) / RADAR_METRICS.length - Math.PI / 2;
                    const labelRadius = 88; // 살짝 안쪽으로 넣어서 글자 잘림 방지
                    const x = 110 + labelRadius * Math.cos(angle);
                    const y = 110 + labelRadius * Math.sin(angle);
                    let anchor = 'middle';
                    if (x < 90) anchor = 'end';
                    if (x > 130) anchor = 'start';
                    return (
                      <text
                        key={metric.key}
                        x={x}
                        y={y}
                        textAnchor={anchor}
                        className="dashboard-radar-label"
                      >
                        {metric.label}
                      </text>
                    );
                  })}
                </svg>
              </div>
            ) : (
              <p className="dashboard-empty-text">미용 상태 지표가 아직 입력되지 않았어요.</p>
            )}

          </section>

          {/* Statistics */}
          <div className="dashboard-stats-section">
            <div className="dashboard-stat-item">
              <p className="stat-label">미용 횟수</p>
              <p className="stat-value">{groomingCount}회</p>
            </div>
            <div className="dashboard-stat-item">
              <p className="stat-label">인정 근처</p>
              <p className="stat-value">{nearbyDesignerCount}번</p>
            </div>
          </div>

          {/* CTA Button */}
          <button
            type="button"
            className="dashboard-cta-button"
            onClick={() => navigate('/quote-detail')}
          >
            {receivedQuoteCount > 0
              ? `받은 견적 ${receivedQuoteCount}개 확인하기`
              : '받은 견적 확인하기'}
          </button>
        </>
      ) : (
        // ===== LOCKED STATE (강아지 정보 없음) =====
        <div className="dashboard-locked-section">
          <div className="dashboard-locked-content">
            <svg
              className="dashboard-lock-icon"
              viewBox="0 0 64 64"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M16 28v-8c0-8.8 7.2-16 16-16s16 7.2 16 16v8M12 28h40c2.2 0 4 1.8 4 4v28c0 2.2-1.8 4-4 4H12c-2.2 0-4-1.8-4-4V32c0-2.2 1.8-4 4-4z"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />
              <circle cx="32" cy="44" r="2" fill="currentColor" />
            </svg>

            <p className="dashboard-locked-message">
              강아지 정보를 등록하면
              <br />
              우리집 강아지 미용 상태를 볼 수 있어요.
            </p>
            <button
              type="button"
              className="dashboard-add-dog-btn"
              onClick={() => navigate('/dog-registration')}
            >
              강아지 등록하러 가기
            </button>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
