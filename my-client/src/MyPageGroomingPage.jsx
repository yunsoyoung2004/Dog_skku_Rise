import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './firebase';
import { getLatestGroomingHistory } from './services';
import './MyPageGroomingPage.css';

export default function MyPageGroomingPage() {
  const navigate = useNavigate();
  const [user] = useAuthState(auth);
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadGroomingHistory();
  }, [user]);

  const loadGroomingHistory = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      const latest = await getLatestGroomingHistory(user.uid);
      setHistory(latest);
    } catch (err) {
      console.error('미용 내역 로드 실패:', err);
      setError('미용 내역을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };
  
  const displayDate = history?.date || '2026. 02. 02.';
  const displayDesigner = history?.designerName || '김민지 디자이너';

  return (
    <div className="mypage-grooming" data-node-id="511:2993">
      {/* Header */}
      <div className="mypage-grooming-header">
        <button className="back-btn" onClick={() => navigate(-1)}>←</button>
        <h1 className="title">우리집 강아지 미용 내역</h1>
      </div>

      {/* Content */}
      <div className="mypage-grooming-container">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
            로딩 중...
          </div>
        ) : error ? (
          <div style={{ padding: '10px', backgroundColor: '#ffeeee', color: '#cc0000', textAlign: 'center', marginBottom: '10px' }}>
            {error}
          </div>
        ) : (
          <>
            <div className="grooming-top-photo">
              <div className="arrow-left">&lt;</div>
              <div className="photo-card" />
              <div className="arrow-right">&gt;</div>
            </div>
            <p className="grooming-photo-meta">{displayDate} {displayDesigner}</p>

            <div className="grooming-radar-section">
              <p className="small-label">{history?.title || '뽀또의 미용 상태 분석'}</p>
              <div className="grooming-metrics">
                <div className="metric-row">
                  <span className="metric-label">털 엉킴</span>
                  <span className="metric-value">{history?.metrics?.matting ?? 70.34}</span>
                </div>
                <div className="metric-row">
                  <span className="metric-label">환경 적응도</span>
                  <span className="metric-value">{history?.metrics?.environmentAdaptation ?? 84.45}</span>
                </div>
                <div className="metric-row">
                  <span className="metric-label">털 빠짐</span>
                  <span className="metric-value">{history?.metrics?.shedding ?? 30.7}</span>
                </div>
                <div className="metric-row">
                  <span className="metric-label">모질</span>
                  <span className="metric-value">{history?.metrics?.coatQuality ?? 63.17}</span>
                </div>
                <div className="metric-row">
                  <span className="metric-label">피부 민감도</span>
                  <span className="metric-value">{history?.metrics?.skinSensitivity ?? 97.84}</span>
                </div>
              </div>
            </div>

            <div className="designer-comment-section">
              <p className="small-label">디자이너 코멘트</p>
              <div className="comment-box">
                <p>
                  {history?.comment || '오늘 미용 전반적으로 아이 컨디션을 보면서 천천히 진행했어요. 처음엔 조금 긴장했지만 중간부터는 많이 편안해진 게 보여서 다행이었어요. 특히 얼굴 쪽은 예민해 보여서 가위 사용 위주로 부드럽게 정리했습니다. 집에서는 오늘 하루만큼은 충분히 쉬게 해주세요. 다음 미용 때도 이 성향 참고해서 더 편안하게 진행해드릴게요 😊'}
                </p>
              </div>
            </div>

            <button
              className="review-btn"
              type="button"
              onClick={() => navigate('/write-review')}
            >
              리뷰 쓰기
            </button>
          </>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="mypage-grooming-nav">
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
