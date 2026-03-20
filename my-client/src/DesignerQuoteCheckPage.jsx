import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { auth, db } from './firebase';
import { getDog } from './services';
import DesignerNotificationButton from './components/DesignerNotificationButton';
import './DesignerPageNav.css';
import './DesignerQuoteCheckPage.css';
import DesignerHeaderBrand from './components/DesignerHeaderBrand';

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

        // 정렬: 최신순(createdAt 내림차순)으로만 정렬
        // 상태 관계없이 원래 요청된 순서대로 유지
        list = list.sort((a, b) => {
          const aTs = a.createdAt?.toMillis?.() ?? 0;
          const bTs = b.createdAt?.toMillis?.() ?? 0;
          return bTs - aTs;
        });

        // 각 견적 요청에 연결된 반려견 프로필/사진 정보를 함께 불러온다.
        const dogMap = {};
        await Promise.all(
          list.map(async (item) => {
            if (!item.userId || !item.dogId) return;
            const key = `${item.userId}_${item.dogId}`;
            if (dogMap[key]) return;
            try {
              const dog = await getDog(item.userId, item.dogId);
              if (dog) {
                dogMap[key] = dog;
              }
            } catch (dogErr) {
              console.warn('[DesignerQuoteCheckPage] 강아지 정보 로드 실패(무시 가능):', dogErr);
            }
          })
        );

        const enhancedList = list.map((item) => {
          const key = item.userId && item.dogId ? `${item.userId}_${item.dogId}` : null;
          const dogProfile = key ? dogMap[key] || null : null;
          return { ...item, dogProfile };
        });

        console.log('[DesignerQuoteCheckPage] 데이터 로드 완료 (상태별 정렬됨):', {
          totalCount: enhancedList.length,
          statuses: enhancedList.map(l => ({ id: l.id, status: l.status }))
        });

        setQuotes(enhancedList);
      } catch (e) {
        console.error('견적 요청 로드 실패:', e);
        setError('견적 요청을 불러오지 못했습니다.');
        setQuotes([]);
      } finally {
        setLoading(false);
      }
    };

    loadQuotes();

    // 페이지가 다시 포커스될 때마다 데이터를 새로 로드하도록 리스너 추가
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('[DesignerQuoteCheckPage] 페이지가 다시 포커스됨, 데이터 재로드');
        loadQuotes();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, customerUserId, fromRoomId, navigate]);

  const filteredCards = (() => {
    let list = [...quotes];

    if (filter === 'tag') {
      list.sort((a, b) => (b.dogTags?.length || 0) - (a.dogTags?.length || 0));
    } else if (filter === 'price') {
      list.sort((a, b) => {
        const aPrice = typeof a.price === 'number' ? a.price : Number.POSITIVE_INFINITY;
        const bPrice = typeof b.price === 'number' ? b.price : Number.POSITIVE_INFINITY;
        return aPrice - bPrice;
      });
    } else if (filter === 'location') {
      const order = { '샵': 0, '집': 1 };
      list.sort((a, b) => {
        const aKey = a.knowledge || '';
        const bKey = b.knowledge || '';
        const aRank = order[aKey] ?? 99;
        const bRank = order[bKey] ?? 99;
        if (aRank !== bRank) return aRank - bRank;
        return aKey.localeCompare(bKey);
      });
    }

    return list;
  })();

  return (
    <div className="designer-page">
      <div className="designer-page-header">
        <DesignerHeaderBrand />
        <h1>{customerUserId ? '고객 견적 요청' : '견적서 확인하기'}</h1>
        <div className="designer-header-right">
          <DesignerNotificationButton />
        </div>
      </div>

      <div className="designer-content">
        <div className="dq-filter-row">
          {!customerUserId && (
            <>
              <button
                type="button"
                className={`dq-filter-pill ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                전체
              </button>
              <button
                type="button"
                className={`dq-filter-pill ${filter === 'tag' ? 'active' : ''}`}
                onClick={() => setFilter('tag')}
              >
                태그순
              </button>
              <button
                type="button"
                className={`dq-filter-pill ${filter === 'price' ? 'active' : ''}`}
                onClick={() => setFilter('price')}
              >
                가격순
              </button>
              <button
                type="button"
                className={`dq-filter-pill ${filter === 'location' ? 'active' : ''}`}
                onClick={() => setFilter('location')}
              >
                위치순
              </button>
            </>
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
            {filteredCards.map((card) => {
              const isConfirmed = card.status === 'confirmed';
              const isResponded = card.status === 'responded';
              const dogProfile = card.dogProfile || {};

              const dogPhotoUrl =
                card.photoUrl ||
                dogProfile.imageUrl ||
                dogProfile.photoUrl ||
                '';

              const healthInfo = dogProfile.healthInfo || {};
              const vaccinationInfo = dogProfile.vaccinationInfo || {};

              const skinSensitivityLabel = healthInfo.skinSensitivity || '';
              const skinDiseaseLabel = healthInfo.skinDisease || '';
              const bitingLabel = healthInfo.biting || '';
              const healthNotesLabel = healthInfo.notes || '';

              const vaccinations = [];
              if (vaccinationInfo.combo) vaccinations.push('종합백신');
              if (vaccinationInfo.rabies) vaccinations.push('광견병');
              if (vaccinationInfo.kennelCough) vaccinations.push('켄넬코프');
              if (vaccinationInfo.influenza) vaccinations.push('신종인플루엔자');
              if (vaccinationInfo.corona) vaccinations.push('코로나');
              
              console.log(`[DesignerQuoteCheckPage] 카드 ${card.id}:`, {
                status: card.status,
                isConfirmed,
                isResponded,
                btnLabel: isConfirmed ? '응답 완료' : isResponded ? '견적 수정하기' : '견적서 보내기'
              });

              const btnClass = `dq-send-btn ${
                isConfirmed ? 'dq-send-btn-confirmed' : isResponded ? 'dq-send-btn-sent' : 'dq-send-btn-new'
              }`;

              const btnLabel = isConfirmed
                ? '응답 완료'
                : isResponded
                ? '견적 수정하기'
                : '견적서 보내기';

              return (
                <div 
                  key={card.id} 
                  className="dq-card"
                  style={{
                    backgroundColor: isConfirmed || isResponded ? '#f0f8f5' : '#fff'
                  }}
                >
                <p className="dq-card-title">
                  {card.dogName || '반려견'}
                  {(card.breed || dogProfile.breed) ? ` | ${card.breed || dogProfile.breed}` : ''}
                  {(card.weight || dogProfile.weight) ? ` | ${(card.weight || dogProfile.weight)}kg` : ''}
                  {dogProfile.age ? ` | ${dogProfile.age}살` : ''}
                </p>

                <div className="dq-card-main">
                  <div className="dq-card-images">
                    <div className="dq-dog-img main">
                      {dogPhotoUrl ? (
                        <img src={dogPhotoUrl} alt={card.dogName || '반려견 사진'} />
                      ) : (
                        <span role="img" aria-hidden="true">🐶</span>
                      )}
                    </div>
                    <div className="dq-dog-img sub">
                      {dogPhotoUrl ? (
                        <img src={dogPhotoUrl} alt={card.dogName || '반려견 사진'} />
                      ) : (
                        <span role="img" aria-hidden="true">🐶</span>
                      )}
                    </div>
                  </div>
                  <div className="dq-card-text-group">
                    <p><span className="label">피부 민감도:</span> {skinSensitivityLabel || '정보 없음'}</p>
                    <p><span className="label">피부 질환 :</span> {skinDiseaseLabel || '없음'}</p>
                    <p><span className="label">입질 여부:</span> {bitingLabel || '정보 없음'}</p>
                    <p><span className="label">기타 지병 및 주의사항:</span> {healthNotesLabel || '없음'}</p>
                    <p><span className="label">예방 접종:</span> {vaccinations.length > 0 ? vaccinations.join(', ') : '정보 없음'}</p>
                    <p><span className="label">미용 진행 장소:</span> {card.knowledge || '-'}</p>
                    <p><span className="label">미용 방식:</span> {card.groomingStyle || '-'}</p>
                    <p><span className="label">희망 일정:</span> {card.preferredDate || '-'} {card.preferredTime || ''}</p>
                    <p><span className="label">강아지 태그:</span> {(card.dogTags || []).join(', ') || '-'}</p>
                    <p><span className="label">추가 사항:</span> {(card.additionalOptions || []).join(', ') || '-'}</p>
                  </div>
                </div>

                {(card.dogTags && card.dogTags.length > 0) && (
                  <div className="dq-tag-row">
                    {card.dogTags.map((tag) => (
                      <span key={tag} className="dq-tag-pill">{tag}</span>
                    ))}
                  </div>
                )}

                <div className="dq-bottom-info">
                  <div className="dq-bottom-text">
                    {isResponded && card.lastQuotedAt && (
                      <p>
                        <span className="label">보낸 시간:</span> {new Date(card.lastQuotedAt.toMillis()).toLocaleString('ko-KR')}
                      </p>
                    )}
                    {card.price && (
                      <p>
                        <span className="label">제안 금액:</span> {card.price.toLocaleString('ko-KR')}원
                      </p>
                    )}
                  </div>
                </div>

                <div className="dq-send-row">
                  <button
                    type="button"
                    className={btnClass}
                    disabled={isConfirmed}
                    onClick={() => {
                      if (!isConfirmed) {
                        navigate(`/designer-send-quote/${card.id}`, { state: { quote: card } });
                      }
                    }}
                  >
                    {btnLabel}
                  </button>
                </div>
              </div>
              );
            })}
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
