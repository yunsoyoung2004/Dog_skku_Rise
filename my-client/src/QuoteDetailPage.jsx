import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, updateDoc, Timestamp, collection, getDocs, query, where } from 'firebase/firestore';
import { auth, db } from './firebase';
import { getUserQuotes, getUserBookings, createBooking, sendMessage, createNotification } from './services';
import './QuoteDetailPage.css';

export default function QuoteDetailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const fromChatRoomId = location.state?.roomId || '';
  const [user] = useAuthState(auth);
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDog, setSelectedDog] = useState(null);

  useEffect(() => {
    loadQuotes();
  }, [user]);

  const loadQuotes = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      const receivedQuotes = await getUserQuotes(user.uid);

      // 이미 생성된 예약(booking)과 매칭되는 견적은
      // status가 sent로 남아 있어도 화면에서는 confirmed로 취급
      let enhancedQuotes = receivedQuotes;
      try {
        const userBookings = await getUserBookings(user.uid);
        const activeBookings = (userBookings || []).filter(
          (b) => b.status !== 'cancelled'
        );

        enhancedQuotes = receivedQuotes.map((q) => {
          const hasBooking = activeBookings.some(
            (b) => b.quoteId === q.id
          );
          if (hasBooking && q.status !== 'confirmed') {
            return { ...q, status: 'confirmed' };
          }
          return q;
        });
      } catch (bookingErr) {
        console.warn('사용자 예약 데이터 로드 실패(무시 가능):', bookingErr);
      }

      let finalQuotes = enhancedQuotes;

      // 아직 디자이너가 응답하지 않은 사용자 견적 요청(quoteRequests)도 함께 노출
      try {
        const requestsRef = collection(db, 'quoteRequests');
        const rq = query(
          requestsRef,
          where('userId', '==', user.uid)
        );
        const rqSnap = await getDocs(rq);

        if (!rqSnap.empty) {
          // 이 사용자의 quoteRequests 중, 아직 디자이너 견적(quotes)이 없는 것들만 골라 카드로 추가
          const pendingRequests = [];

          rqSnap.forEach((docSnap) => {
            const reqData = docSnap.data();
            const reqId = docSnap.id;

            const alreadyHasQuote = enhancedQuotes.some(
              (q) => q.requestId === reqId
            );

            if (!alreadyHasQuote) {
              pendingRequests.push({ id: reqId, data: reqData });
            }
          });

          if (pendingRequests.length > 0) {
            // 최신 생성일(createdAt) 순으로 정렬해 위에 쌓이도록
            pendingRequests.sort((a, b) => {
              const ta = a.data.createdAt?.toDate
                ? a.data.createdAt.toDate().getTime()
                : 0;
              const tb = b.data.createdAt?.toDate
                ? b.data.createdAt.toDate().getTime()
                : 0;
              return tb - ta;
            });

            const pendingQuotes = pendingRequests.map(({ id, data }) => ({
              id,
              userId: user.uid,
              designerId: data.designerId,
              designerName: data.designerName || '',
              dogId: data.dogId || '',
              dogName: data.dogName || '',
              knowledge: data.knowledge || '',
              groomingStyle: data.groomingStyle || '',
              additionalGrooming: Array.isArray(data.additionalGrooming)
                ? data.additionalGrooming
                : [],
              additionalOptions: Array.isArray(data.additionalOptions)
                ? data.additionalOptions
                : [],
              dogTags: Array.isArray(data.dogTags)
                ? data.dogTags
                : [],
              preferredDate: data.preferredDate || '',
              preferredTime: data.preferredTime || '',
              requestNotes: data.notes || '',
              createdAt: data.createdAt,
              status: data.status || 'pending',
            }));

            finalQuotes = [...pendingQuotes, ...enhancedQuotes];
          }
        }
      } catch (e) {
        console.warn('사용자 견적 요청(quoteRequests) 로드 실패(무시 가능):', e);
      }

      setQuotes(finalQuotes);

      // 최종 노출 목록 기준으로 상단 강아지 정보/에러 메시지 설정
      if (finalQuotes.length > 0) {
        setSelectedDog(finalQuotes[0].dogName || '');
        setError('');
      } else {
        setError('아직 받은 견적이 없습니다');
      }
    } catch (err) {
      console.error('견적 조회 실패:', err);
      setError('견적을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (quote) => {
    // confirmed 상태에서만 "응답 완료" 표시, pending 은 요청 전송 상태로 표기
    if (quote.status === 'confirmed') return '응답 완료';
    if (quote.status === 'pending') return '요청 전송됨';
    return '';
  };

  const handleConfirmQuote = async (quote) => {
    if (!user) {
      navigate('/login');
      return;
    }

    // 이미 확정된 견적에 대해 다시 수락을 시도하는 경우 방어
    if (quote.status === 'confirmed') {
      alert('이미 수락된 견적입니다.');
      alert('수락은 완료된 후 취소할 수 없습니다.');
      return;
    }

    try {
      // 1) 예약 생성
      // 견적에서 선택한 희망 일정/시간을 실제 예약 날짜/타임슬롯으로 매핑
      let bookingDate = null;
      if (quote.preferredDate) {
        try {
          bookingDate = new Date(quote.preferredDate);
          // 하루 동안 "다가오는 예약"으로 보이도록, 날짜의 끝 시간으로 설정
          bookingDate.setHours(23, 59, 59, 999);
        } catch (e) {
          console.warn('예약 날짜 파싱 실패(무시 가능):', e);
          bookingDate = null;
        }
      }

      const effectiveChatRoomId = quote.chatRoomId || fromChatRoomId || '';

      const bookingPayload = {
        designerId: quote.designerId,
        designerName: quote.designerName || '',
        dogId: quote.dogId || '',
        dogName: quote.dogName || '',
        quoteId: quote.id,
        price: quote.price || 0,
        // 채팅방과 예약을 연결해서 마이페이지/채팅 이동에 함께 활용
        chatRoomId: effectiveChatRoomId,
        preferredDate: quote.preferredDate || '',
        preferredTime: quote.preferredTime || '',
        // MyPage의 "다가오는 예약" 카드에서 사용되는 필드
        bookingDate: bookingDate,
        timeSlot: quote.preferredTime || '',
      };
      const bookingResult = await createBooking(user.uid, bookingPayload);

      // 예약/수락 성공 팝업
      alert('견적이 수락되었습니다!');
      alert('수락은 완료된 후 취소할 수 없습니다.');

      // 디자이너/사용자 모두에게 예약 확정 알림 생성
      try {
        if (quote.designerId) {
          await createNotification(quote.designerId, {
            title: '예약이 확정되었어요',
            message: `${quote.dogName || '반려견'} 예약이 확정되었습니다.`,
            type: 'booking',
            chatRoomId: effectiveChatRoomId || quote.chatRoomId || '',
            bookingId: bookingResult?.bookingId || '',
          });
        }

        await createNotification(user.uid, {
          title: '예약이 확정되었어요',
          message: `${quote.designerName || '디자이너'}와의 예약이 확정되었습니다.`,
          type: 'booking',
          chatRoomId: effectiveChatRoomId || quote.chatRoomId || '',
          bookingId: bookingResult?.bookingId || '',
        });
      } catch (e) {
        console.warn('예약 알림 생성 실패(무시 가능):', e);
      }

      // 2) 채팅방에 시스템 메시지 남기기 (있다면)
      if (effectiveChatRoomId) {
        await sendMessage(effectiveChatRoomId, {
          senderId: user.uid,
          senderType: 'user',
          text: '견적을 확정하고 예약을 완료했어요.',
          isSystemMessage: true,
          messageType: 'bookingConfirmed',
          timestamp: new Date().toISOString(),
        });

        // 채팅방 상태를 "매칭 완료"로 업데이트해서 채팅 리스트 필터와 맞춰줌
        try {
          const roomRef = doc(db, 'chatRooms', effectiveChatRoomId);
          await updateDoc(roomRef, {
            status: 'completed',
            updatedAt: Timestamp.now(),
          });
        } catch (e) {
          console.warn('채팅방 상태 업데이트 실패(무시 가능):', e);
        }

        // 확정 후 바로 해당 채팅방으로 이동해 변경된 배너/메시지를 보여줌
        navigate(`/chat/${effectiveChatRoomId}`);
      } else {
        alert('예약이 생성되었습니다. 예약 내역은 마이페이지에서 확인할 수 있습니다.');
      }

      // 로컬 상태에서도 해당 견적을 확정 상태로 표시해, 재수락을 막고 UI를 일관되게 유지
      setQuotes((prev) =>
        prev.map((q) =>
          q.id === quote.id
            ? { ...q, status: 'confirmed' }
            : q
        )
      );

      // Firestore 상에서도 해당 견적 상태를 확정으로 반영
      try {
        const quoteRef = doc(db, 'quotes', quote.id);
        await updateDoc(quoteRef, { status: 'confirmed' });
      } catch (e) {
        console.warn('견적 상태 업데이트 실패(무시 가능):', e);
      }
    } catch (err) {
      console.error('견적 확정/예약 생성 실패:', err);
      alert('견적을 확정하는 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.');
    }
  };

  return (
    <div className="quote-detail-page" data-node-id="quote-detail">
      {/* Header */}
      <div className="quote-detail-header">
        <button className="quote-detail-back-btn" onClick={() => navigate(-1)}>←</button>
        <h1>
          {fromChatRoomId && quotes.length > 0 && quotes[0].status === 'pending'
            ? '보낸 견적 요약'
            : '받은 견적'}
        </h1>
        <div style={{ width: '24px' }}></div>
      </div>

      {/* Content */}
      <div className="quote-detail-container">
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
          <>
            {/* Dog Info */}
            {selectedDog && (
              <div className="quote-dog-info">
                <div className="quote-dog-avatar">
                  <svg
                    className="quote-dog-avatar-icon"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <rect
                      x="3"
                      y="5"
                      width="18"
                      height="14"
                      rx="2"
                      ry="2"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                    <circle
                      cx="10"
                      cy="11"
                      r="2.3"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M21 16.2 16.2 11.5 11 17"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div className="quote-dog-details">
                  <h2>{selectedDog}</h2>
                  <p>견종 · 나이 · 성별</p>
                </div>
              </div>
            )}

            {/* Sent Quote Requests List */}
            <div className="quotes-list">
              {quotes.length > 0 ? (
                quotes.map((quote) => {
                  const hasDesignerReply = !!quote.message;
                  const cardClassNames = [
                    'quote-card',
                    quote.status === 'confirmed' ? 'confirmed' : '',
                    hasDesignerReply ? 'has-designer-reply' : '',
                  ]
                    .filter(Boolean)
                    .join(' ');

                  return (
                  <div key={quote.id} className={cardClassNames}>
                    <div className="quote-header">
                      <div className="quote-designer">
                        <span className="quote-designer-avatar">
                          <svg
                            className="quote-avatar-icon"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                          </svg>
                        </span>
                        <div className="quote-designer-info">
                          <h3>{quote.designerName || '디자이너'}</h3>
                          <p className="quote-date">
                            {quote.createdAt?.toDate
                              ? quote.createdAt.toDate().toLocaleDateString('ko-KR')
                              : ''}
                          </p>
                        </div>
                      </div>
                      <div className="quote-price">
                        <span className="price-value status-pill">
                          {getStatusLabel(quote)}
                        </span>
                      </div>
                    </div>

                    {/* 사용자가 폼에서 입력했던 내용을 요약으로 표시 */}
                    <div className="quote-summary">
                      <h4>요청 요약</h4>
                      <p><span className="summary-label">미용 진행 장소:</span> {quote.knowledge || '-'}</p>
                      <p><span className="summary-label">희망 일정:</span> {quote.preferredDate || '-'} {quote.preferredTime || ''}</p>
                      <p><span className="summary-label">요청 메모:</span> {quote.requestNotes || '요청 메모가 없습니다.'}</p>
                    </div>

                    <div className="quote-services">
                      <h4>요청한 서비스 / 옵션</h4>
                      <div className="services-list">
                        {quote.groomingStyle && (
                          <span className="service-tag">{quote.groomingStyle}</span>
                        )}
                        {Array.isArray(quote.additionalGrooming) &&
                          quote.additionalGrooming.map((g, idx) => (
                            <span key={`g-${idx}`} className="service-tag">
                              {g}
                            </span>
                          ))}
                        {Array.isArray(quote.additionalOptions) &&
                          quote.additionalOptions.map((opt, idx) => (
                            <span key={`o-${idx}`} className="service-tag">
                              {opt}
                            </span>
                          ))}
                        {Array.isArray(quote.dogTags) &&
                          quote.dogTags.map((tag, idx) => (
                            <span key={`t-${idx}`} className="service-tag">
                              {tag}
                            </span>
                          ))}
                        {!quote.groomingStyle &&
                          (!quote.additionalGrooming || quote.additionalGrooming.length === 0) &&
                          (!quote.additionalOptions || quote.additionalOptions.length === 0) &&
                          (!quote.dogTags || quote.dogTags.length === 0) && (
                            <span className="service-tag">선택한 옵션이 없습니다</span>
                          )}
                      </div>
                    </div>

                    {/* 디자이너가 견적 작성 시 남긴 메모 + 금액을 댓글 형태로 강조 */}
                    {quote.message && (
                      <div className="quote-designer-note">
                        <span className="designer-note-label">디자이너 의견</span>
                        {typeof quote.price === 'number' && quote.price > 0 && (
                          <div className="designer-note-price-row">
                            <span className="designer-note-price">{quote.price.toLocaleString('ko-KR')}원</span>
                          </div>
                        )}
                        <div className="designer-note-body">
                          <p className="designer-note-text">{quote.message}</p>
                        </div>
                      </div>
                    )}

                    <div className="quote-actions">
                      {quote.status === 'pending' ? (
                        <button
                          className="quote-accept-btn"
                          onClick={() =>
                            navigate('/quote-request', {
                              state: {
                                designerId: quote.designerId,
                                designerName: quote.designerName,
                                originalRequest: quote,
                              },
                            })
                          }
                        >
                          수정하여 다시 보내기
                        </button>
                      ) : (
                        quote.status !== 'confirmed' && (
                          <>
                            <button
                              className="quote-accept-btn"
                              onClick={() =>
                                navigate('/quote-request', {
                                  state: {
                                    designerId: quote.designerId,
                                    designerName: quote.designerName,
                                    originalRequest: quote,
                                  },
                                })
                              }
                            >
                              수정하여 다시 보내기
                            </button>
                            <button
                              className="quote-contact-btn"
                              onClick={() => handleConfirmQuote(quote)}
                            >
                              견적 확정하기
                            </button>
                          </>
                        )
                      )}
                    </div>
                  </div>
                );
                })
              ) : (
                <div className="no-quotes">
                  <p>아직 받은 견적이 없습니다</p>
                  <button onClick={() => navigate('/quote-request')}>
                    새 견적 신청하기
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Bottom Navigation (match global nav icons) */}
      <div className="quote-detail-nav">
        <button onClick={() => navigate('/dashboard')} title="대시보드">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </button>
        <button onClick={() => navigate('/search')} title="검색">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
          </svg>
        </button>
        <button onClick={() => navigate('/chat')} title="채팅">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </button>
        <button onClick={() => navigate('/mypage')} title="마이페이지">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
          </svg>
        </button>
      </div>
    </div>
  );
}
