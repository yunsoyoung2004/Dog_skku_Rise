import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { auth, db } from './firebase';
import './DesignerPageNav.css';
import './DesignerQuoteCheckPage.css';

export default function DesignerQuoteCheckPage() {
  const navigate = useNavigate();
  const [user] = useAuthState(auth);
  const [filter, setFilter] = useState('all');
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/designer-login');
      return;
    }

    const loadQuotes = async () => {
      try {
        setLoading(true);
        setError('');
        const q = query(
          collection(db, 'quoteRequests'),
          where('designerId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        const snap = await getDocs(q);
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setQuotes(list);
      } catch (e) {
        console.error('견적 요청 로드 실패:', e);
        setError('견적 요청을 불러오지 못했습니다.');
        setQuotes([]);
      } finally {
        setLoading(false);
      }
    };

    loadQuotes();
  }, [user, navigate]);

  const filteredCards = quotes; // 필터 로직은 추후 확장

  return (
    <div className="designer-page">
      <div className="designer-page-header">
        <button onClick={() => navigate(-1)}>←</button>
        <h1>견적서 확인하기</h1>
      </div>

      <div className="designer-content">
        <div className="dq-filter-row">
          <button
            type="button"
            className={`dq-filter-pill ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            전체
          </button>
        </div>

        {loading ? (
          <div className="dq-empty">
            <p>견적 요청을 불러오는 중입니다...</p>
          </div>
        ) : error ? (
          <div className="dq-empty">
            <p>🔒 {error}</p>
          </div>
        ) : filteredCards.length === 0 ? (
          <div className="dq-empty">
            <p>아직 도착한 견적 요청이 없습니다.</p>
          </div>
        ) : (
          <div className="dq-card-list">
            {filteredCards.map((card) => (
              <div key={card.id} className="dq-card">
                <p className="dq-card-title">
                  {card.dogName || '반려견'}
                  {card.breed ? ` | ${card.breed}` : ''}
                  {card.weight ? ` | ${card.weight}kg` : ''}
                </p>

                <div className="dq-card-main">
                  <div className="dq-card-text-group">
                    <p><span className="label">미용 진행 장소:</span> {card.knowledge || '-'}</p>
                    <p><span className="label">미용 방식:</span> {card.groomingStyle || '-'}</p>
                    <p><span className="label">희망 일정:</span> {card.preferredDate || '-'} {card.preferredTime || ''}</p>
                    <p><span className="label">강아지 태그:</span> {(card.dogTags || []).join(', ') || '-'}</p>
                    <p><span className="label">추가 사항:</span> {(card.additionalOptions || []).join(', ') || '-'}</p>
                  </div>
                </div>

                <div className="dq-send-row">
                  <button
                    type="button"
                    className="dq-send-btn"
                    onClick={() => navigate(`/designer-quote-send/${card.id}`, { state: { quote: card } })}
                  >
                    견적서 보내기
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
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
