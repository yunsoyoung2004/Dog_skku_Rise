import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { auth, db } from './firebase';
import './DesignerPageNav.css';
import './DesignerQuoteCheckPage.css';

export default function DesignerQuoteCheckPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user] = useAuthState(auth);
  const [filter, setFilter] = useState('all');
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // 특정 고객의 견적만 보이는 모드
  const customerUserId = location.state?.customerUserId;
  // 채팅방에서 넘어온 경우, 해당 채팅방(roomId)에 연결된 견적만 보기
  const fromRoomId = location.state?.roomId || '';

  useEffect(() => {
    if (!user) {
      navigate('/designer-login');
      return;
    }

    const loadQuotes = async () => {
      try {
        setLoading(true);
        setError('');

        // Firestore 인덱스 없이도 동작하도록 orderBy는 제거하고,
        // 클라이언트에서 createdAt 기준 내림차순 정렬
        const q = query(
          collection(db, 'quoteRequests'),
          where('designerId', '==', user.uid)
        );
        const snap = await getDocs(q);
        const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

        let list = all;

        // 1순위: 같은 채팅방(roomId)에 연결된 견적 요청
        if (fromRoomId) {
          const byRoom = all.filter((item) => item.roomId === fromRoomId);
          if (byRoom.length > 0) {
            list = byRoom;
          } else if (customerUserId) {
            // 같은 roomId가 없으면, 같은 고객(userId) 기준으로 fallback
            list = all.filter((item) => item.userId === customerUserId);
          }
        } else if (customerUserId) {
          // 채팅방 정보가 없을 때는 고객 기준 필터링
          list = all.filter((item) => item.userId === customerUserId);
        }

        list = list.sort((a, b) => {
          const aTs = a.createdAt?.toMillis?.() ?? 0;
          const bTs = b.createdAt?.toMillis?.() ?? 0;
          return bTs - aTs;
        });

        // 특정 고객/채팅방에서 진입한 경우에는 최신 1개만 노출
        if ((fromRoomId || customerUserId) && list.length > 0) {
          list = [list[0]];
        }

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
  }, [user, customerUserId, fromRoomId, navigate]);

  // 채팅 배너에서 진입한 경우: 목록 대신 바로 해당 견적 작성/수정 페이지로 이동
  useEffect(() => {
    if (!fromRoomId) return;
    if (loading || error) return;
    if (!quotes || quotes.length === 0) return;

    const target = quotes[0];
    // 채팅 → 견적 수정으로 올 때는 중간 페이지를 history에서 교체해서
    // 뒤로가기가 다시 채팅으로 바로 돌아가도록 처리
    navigate(`/designer-send-quote/${target.id}`, {
      replace: true,
      state: { quote: target, roomId: fromRoomId },
    });
  }, [fromRoomId, loading, error, quotes, navigate]);

  const filteredCards = quotes; // 필터 로직은 추후 확장

  return (
    <div className="designer-page">
      <div className="designer-page-header">
        <button onClick={() => navigate(-1)}>←</button>
        <h1>{customerUserId ? '고객 견적 요청' : '견적서 확인하기'}</h1>
      </div>

      <div className="designer-content">
        <div className="dq-filter-row">
          {!customerUserId && (
            <button
              type="button"
              className={`dq-filter-pill ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              전체
            </button>
          )}
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
            <p>{customerUserId ? '이 고객의 견적 요청이 없습니다.' : '아직 도착한 견적 요청이 없습니다.'}</p>
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
                    onClick={() => navigate(`/designer-send-quote/${card.id}`, { state: { quote: card } })}
                  >
                    {card.status === 'responded' ? '견적 수정하기' : '견적서 보내기'}
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
