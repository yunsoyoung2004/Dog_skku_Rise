import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './firebase';
import { getUserFavorites, removeFavorite } from './services';
import './FavoritesPage.css';

const logoImg = "/vite.svg";

export default function FavoritesPage() {
  const navigate = useNavigate();
  const [user] = useAuthState(auth);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadFavorites();
  }, [user]);

  const loadFavorites = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      const userFavorites = await getUserFavorites(user.uid);
      setFavorites(userFavorites);
    } catch (err) {
      console.error('즐겨찾기 로드 실패:', err);
      setError('즐겨찾기를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (designerId) => {
    if (!user) return;

    try {
      await removeFavorite(user.uid, designerId);
      setFavorites(favorites.filter(fav => fav.designerId !== designerId));
    } catch (err) {
      console.error('즐겨찾기 제거 실패:', err);
      setError('즐겨찾기 제거에 실패했습니다.');
    }
  };

  const handleGoToDesigner = (designerId) => {
    navigate(`/designer?id=${designerId}`);
  };

  return (
    <div className="favorites-page" data-node-id="favorites-page">
      {/* Header */}
      <div className="favorites-header">
        <button className="favorites-back-btn" onClick={() => navigate('/mypage')}>←</button>
        <h1>즐겨찾기</h1>
        <div style={{ width: '24px' }}></div>
      </div>

      {/* Favorites Container */}
      <div className="favorites-container">
        {error && (
          <div style={{ padding: '10px', backgroundColor: '#ffeeee', color: '#cc0000', textAlign: 'center', marginBottom: '10px' }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
            로딩 중...
          </div>
        ) : favorites.length === 0 ? (
          <div className="empty-favorites">
            <p className="empty-icon">🤍</p>
            <p>즐겨찾기한 미용사가 없습니다</p>
            <button className="find-btn" onClick={() => navigate('/designer')}>
              미용사 찾기
            </button>
          </div>
        ) : (
          <div className="favorites-list">
            {favorites.map((designer) => (
              <div key={designer.designerId} className="favorites-card">
                <div className="favorites-designer-info">
                  <div className="favorites-avatar">
                    <span className="favorites-avatar-icon">👤</span>
                  </div>
                  <div className="favorites-details">
                    <h3>{designer.name}</h3>
                    <p className="favorites-rating">⭐ {(designer.rating || 0).toFixed(1)} ({designer.reviews || 0})</p>
                    <p className="favorites-price">{designer.priceMin || '0'}~{designer.priceMax || '0'}원</p>
                    <p className="favorites-specialty">{designer.specialty || '전문가'}</p>
                  </div>
                </div>
                <div className="favorites-actions">
                  <button
                    className="contact-favorite-btn"
                    onClick={() => handleGoToDesigner(designer.designerId)}
                  >
                    보기
                  </button>
                  <button
                    className="remove-favorite-btn"
                    onClick={() => handleRemoveFavorite(designer.designerId)}
                    title="즐겨찾기 제거"
                  >
                    ❌
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="favorites-nav">
        <button className="nav-btn" onClick={() => navigate('/dashboard')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </button>
        <button className="nav-btn" onClick={() => navigate('/search')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
          </svg>
        </button>
        <button className="nav-btn">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </button>
        <button className="nav-btn" onClick={() => navigate('/mypage')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
