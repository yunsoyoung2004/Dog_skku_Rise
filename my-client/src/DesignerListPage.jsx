import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './firebase';
import { getAllDesigners, addFavorite, removeFavorite, getUserFavorites } from './services';
import PageLayout from './PageLayout';
import './DesignerListPage.css';

export default function DesignerListPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user] = useAuthState(auth);
  const [designers, setDesigners] = useState([]);
  const [filteredDesigners, setFilteredDesigners] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState('all');
  const [mode, setMode] = useState('all');
  const [districtLabel, setDistrictLabel] = useState('');

  useEffect(() => {
    loadDesigners();
    if (user) {
      loadFavorites();
    }
  }, [user, location.search]);

  const loadDesigners = async () => {
    setLoading(true);
    try {
      const allDesigners = await getAllDesigners();
      setDesigners(allDesigners);

      const searchParams = new URLSearchParams(location.search);
      const urlMode = searchParams.get('mode') || 'all';
      const district = searchParams.get('district') || '';

      setMode(urlMode);
      setDistrictLabel(district);

      let baseList = [...allDesigners];

      if (urlMode === 'region' && district) {
        baseList = baseList.filter((d) => (d.location || '').includes(district));
      } else if (urlMode === 'custom') {
        // 맞춤별: 평점 높은 순으로 상위 3개 추천
        baseList.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        baseList = baseList.slice(0, 3);
      }

      setFilteredDesigners(baseList);
    } catch (err) {
      console.error('디자이너 목록 로드 실패:', err);
      setError('디자이너 목록을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const loadFavorites = async () => {
    if (!user) return;
    try {
      const userFavorites = await getUserFavorites(user.uid);
      setFavorites(userFavorites.map(f => f.designerId));
    } catch (err) {
      console.error('즐겨찾기 로드 실패:', err);
    }
  };

  const handleSort = (sortType) => {
    // 지역별 모드에서는 정렬 기능 비활성화
    if (mode === 'region') return;

    setSortBy(sortType);
    let sorted = [...filteredDesigners.length ? filteredDesigners : designers];

    if (sortType === 'rating') {
      sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortType === 'price') {
      sorted.sort((a, b) => {
        const priceA = parseInt(a.priceMin || 0);
        const priceB = parseInt(b.priceMin || 0);
        return priceA - priceB;
      });
    }

    setFilteredDesigners(sorted);
  };

  const handleToggleFavorite = async (designerId, designer) => {
    if (!user) {
      setError('로그인이 필요합니다');
      navigate('/login');
      return;
    }

    try {
      if (favorites.includes(designerId)) {
        await removeFavorite(user.uid, designerId);
        setFavorites(favorites.filter(f => f !== designerId));
      } else {
        await addFavorite(user.uid, designerId, {
          name: designer.name,
          image: designer.image,
          rating: designer.rating,
          reviews: designer.reviews,
          priceMin: designer.priceMin,
          priceMax: designer.priceMax,
          specialty: designer.specialty,
        });
        setFavorites([...favorites, designerId]);
      }
    } catch (err) {
      console.error('즐겨찾기 변경 실패:', err);
      setError('즐겨찾기 변경에 실패했습니다.');
    }
  };

  return (
    <PageLayout title="멍빗어" homePath="/designer-dashboard">
      <div className="designer-list-page" data-node-id="designer-list">
        {mode === 'custom' && (
          <div style={{ fontSize: '12px', color: '#777', margin: '8px 4px 4px' }}>
            맞춤별은 태그가 같은 디자이너만 표시됩니다.
          </div>
        )}
        {/* Filter Bar (지역별 모드에서는 정렬 숨김) */}
        {mode !== 'region' && (
          <div className="designer-list-filters">
            <button 
              className={`filter-btn ${sortBy === 'all' ? 'active' : ''}`}
              onClick={() => handleSort('all')}
            >
              전체
            </button>
            <button 
              className={`filter-btn ${sortBy === 'rating' ? 'active' : ''}`}
              onClick={() => handleSort('rating')}
            >
              평가 높음
            </button>
            <button 
              className={`filter-btn ${sortBy === 'price' ? 'active' : ''}`}
              onClick={() => handleSort('price')}
            >
              가격 낮음
            </button>
          </div>
        )}

        {/* Designer List */}
        <div className="designer-list-container">
        {error && (
          <div style={{ padding: '10px', backgroundColor: '#ffeeee', color: '#cc0000', textAlign: 'center', marginBottom: '10px' }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
            로딩 중...
          </div>
        ) : (
          <div className="designer-list-items">
            {filteredDesigners.length > 0 ? (
              filteredDesigners.map((designer) => (
                <div
                  key={designer.id}
                  className="designer-list-item"
                >
                  <div 
                    onClick={() => navigate(`/designer?id=${designer.id}`)}
                    style={{ flex: 1, cursor: 'pointer' }}
                  >
                    <div className="designer-list-avatar">
                      {designer.image ? (
                        <img
                          src={designer.image}
                          alt={designer.name || '디자이너 프로필'}
                          className="designer-list-avatar-img"
                        />
                      ) : (
                        <span className="designer-list-avatar-placeholder">💼</span>
                      )}
                    </div>
                    <div className="designer-list-info">
                      <h3>{designer.name}</h3>
                      <div className="designer-list-rating">
                        <span className="stars">⭐ {(designer.rating || 0).toFixed(1)}</span>
                        <span className="review-count">({designer.reviews || 0})</span>
                      </div>
                      <p className="designer-list-price">{designer.priceMin || '0'}~{designer.priceMax || '0'}원</p>
                    </div>
                  </div>
                  <button 
                    className="designer-list-favorite"
                    onClick={() => handleToggleFavorite(designer.id, designer)}
                  >
                    {favorites.includes(designer.id) ? '♥' : '♡'}
                  </button>
                </div>
              ))
            ) : (
              <>
                {mode === 'region' ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#999', lineHeight: 1.5 }}>
                    <p style={{ marginBottom: '4px' }}>지역별은 현재 가까이에 있는 디자이너만 표시됩니다.</p>
                    {districtLabel && (
                      <p style={{ fontSize: '12px' }}>선택한 지역: {districtLabel}</p>
                    )}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                    🔒 현재 등록된 디자이너가 없습니다.
                  </div>
                )}
              </>
            )}
          </div>
        )}
        </div>
      </div>
    </PageLayout>
  );
}
