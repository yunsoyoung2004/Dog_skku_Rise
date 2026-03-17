import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, getDoc, collection, query, orderBy, onSnapshot, onSnapshot as onUserSnapshot, getDocs, where } from 'firebase/firestore';
import { auth, db } from './firebase';
import { sendMessage, createNotification } from './services';
import './DesignerChatConversationPage.css';

const logoImg = "/vite.svg";

export default function DesignerChatConversationPage() {
  const navigate = useNavigate();
  const { roomId } = useParams();
  const [user] = useAuthState(auth);
  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const messagesEndRef = useRef(null);
  // const [booking, setBooking] = useState(null);
  
  // 최근 예약 모달
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [latestReservation, setLatestReservation] = useState(null);

  // 견적 관련 시스템 메시지 여부 체크
  const hasDesignerQuoteMessage = messages.some(
    (msg) => msg.messageType === 'quoteReceived'
  );
  const hasQuoteRequestMessage = messages.some(
    (msg) => msg.messageType === 'quoteRequest'
  ) && !hasDesignerQuoteMessage;  // 이미 응답했으면 새 요청으로 표시하지 않음
  const hasBookingConfirmedMessage = messages.some(
    (msg) => msg.messageType === 'bookingConfirmed'
  );

  const hasBooking = hasBookingConfirmedMessage;

  // 채팅방 정보 로드
  useEffect(() => {
    const loadRoom = async () => {
      if (!roomId) return;
      if (!user) {
        navigate('/designer-login');
        return;
      }

      try {
        setLoading(true);
        setError('');

        const roomRef = doc(db, 'chatRooms', roomId);
        const snap = await getDoc(roomRef);

        if (!snap.exists()) {
          setError('채팅방을 찾을 수 없습니다.');
          setRoom(null);
          return;
        }

        const data = { id: snap.id, ...snap.data() };

        // 디자이너 본인 방인지 확인
        if (data.designerId && data.designerId !== user.uid) {
          setError('해당 채팅방에 접근할 수 없습니다.');
          setRoom(null);
          return;
        }

        setRoom(data);
      } catch (e) {
        console.error('채팅방 로드 실패:', e);
        setError('채팅을 불러오지 못했습니다.');
        setRoom(null);
      } finally {
        setLoading(false);
      }
    };

    loadRoom();
  }, [roomId, user, navigate]);

  // 메시지 실시간 구독
  useEffect(() => {
    if (!roomId || !user) return;

    const messagesRef = collection(db, `chatRooms/${roomId}/messages`);
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() });
        });
        setMessages(list);
      },
      (err) => {
        console.error('메시지 구독 실패:', err);
      }
    );

    return () => unsubscribe();
  }, [roomId, user]);

  // 알림 카운트 실시간 감시 (기존 UX 유지)
  useEffect(() => {
    if (!user) {
      setUnreadNotificationCount(0);
      return;
    }

    const userRef = doc(db, 'users', user.uid);
    const unsubscribe = onUserSnapshot(
      userRef,
      (docSnap) => {
        const count = docSnap.data()?.unreadNotificationCount || 0;
        setUnreadNotificationCount(count);
      },
      (err) => {
        console.warn('알림 수 로드 실패:', err);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // 새 메시지 도착 시 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 이 채팅방과 연결된 예약 정보 로드 (예약일/시간 배너 표시용)
  // ✋ 권한 에러로 비활성화 - hasBookingConfirmedMessage로도 충분함
  // useEffect(() => {
  //   const fetchBookingForRoom = async () => {
  //     if (!roomId || !user) return;

  //     try {
  //       const bookingsRef = collection(db, 'bookings');
  //       const q = query(bookingsRef, where('chatRoomId', '==', roomId));
  //       const snap = await getDocs(q);

  //       let best = null;
  //       snap.forEach((docSnap) => {
  //         const data = docSnap.data();
  //         best = { id: docSnap.id, ...data };
  //       });

  //       setBooking(best);
  //     } catch (e) {
  //       console.warn('디자이너 채팅 예약 정보 로드 실패(무시 가능):', e);
  //     }
  //   };

  //   fetchBookingForRoom();
  // }, [roomId, user]);

  const formatDate = (tsOrDate) => {
    if (!tsOrDate) return '';
    const d = tsOrDate.toDate ? tsOrDate.toDate() : new Date(tsOrDate);
    return d.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
  };

  const bookingDateLabel = '';

  const handleSend = async () => {
    if (!newMessage.trim() || !roomId || !user) return;

    const text = newMessage.trim();
    setNewMessage('');

    try {
      await sendMessage(roomId, {
        senderId: user.uid,
        senderType: 'designer',
        text,
      });

      // 사용자에게 알림 생성
      if (room?.userId) {
        try {
          await createNotification(room.userId, {
            title: room.userName || '새 메시지',
            message: text,
            type: 'message',
            chatRoomId: roomId,
          });
        } catch (e) {
          console.warn('채팅 알림 생성 실패(무시 가능):', e);
        }
      }
    } catch (e) {
      console.error('메시지 전송 실패:', e);
      alert('메시지 전송에 실패했습니다. 잠시 후 다시 시도해주세요.');
    }
  };

  if (loading) {
    return (
      <div className="designer-page">
        <div className="designer-page-header">
          <button onClick={() => navigate(-1)}>←</button>
          <h1>채팅</h1>
        </div>
        <div className="dc-content">
          <p style={{ textAlign: 'center', color: '#999', marginTop: '20px' }}>
            채팅을 불러오는 중입니다...
          </p>
        </div>
        <div className="dc-input-row" style={{ visibility: 'hidden' }}>
          <input type="text" className="dc-input" value={newMessage || ''} disabled />
          <button className="dc-send-btn" disabled>→</button>
        </div>
        <div className="designer-bottom-nav">
          <button className="designer-nav-btn" onClick={() => navigate('/designer-dashboard')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
            </svg>
          </button>
          <button className="designer-nav-btn" onClick={() => navigate('/designer-messages')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </button>
          <button className="designer-nav-btn" onClick={() => navigate('/designer-profile')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M20 21v-2a 4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
          </button>
        </div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="designer-page">
        <div className="designer-page-header">
          <button onClick={() => navigate(-1)}>←</button>
          <h1>채팅</h1>
        </div>
        <div className="dc-content">
          <p style={{ textAlign: 'center', color: '#999', marginTop: '20px' }}>
            🔒 {error || '채팅방 정보가 없습니다.'}
          </p>
        </div>
        <div className="dc-input-row" style={{ visibility: 'hidden' }}>
          <input type="text" className="dc-input" value={newMessage || ''} disabled />
          <button className="dc-send-btn" disabled>→</button>
        </div>
        <div className="designer-bottom-nav">
          <button className="designer-nav-btn" onClick={() => navigate('/designer-dashboard')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
            </svg>
          </button>
          <button className="designer-nav-btn" onClick={() => navigate('/designer-messages')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </button>
          <button className="designer-nav-btn" onClick={() => navigate('/designer-profile')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M20 21v-2a 4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="designer-page">
      <div className="designer-page-header">
        <button onClick={() => navigate(-1)}>←</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
          <img 
            src={logoImg} 
            alt="멍빗어" 
            style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} 
          />
          <h1>{room.userName || room.roomName || room.title || '채팅'}</h1>
        </div>
        <button 
          className="dc-notification-btn"
          onClick={() => {
            console.log('🔔 알림 페이지 열기', new Date().toLocaleString('ko-KR'));
            navigate('/notification');
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          {unreadNotificationCount > 0 && (
            <span className="dc-notification-badge">
              {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
            </span>
          )}
        </button>
      </div>

      <div className="dc-content">
        {/* 견적 진행 상태 배너 (디자이너 뷰) */}
        <div
          className={`quote-banner ${hasDesignerQuoteMessage ? 'quote-banner-sent' : ''}`}
          onClick={() => {
            // 배너 전체 클릭 시에도 현재 채팅방과 연결된 견적만 보이도록 roomId 전달
            navigate('/designer-quotes-check', {
              state: { customerUserId: room?.userId, roomId },
            });
          }}
        >
          <div className="quote-banner-left">
            <div className="quote-banner-icon">💌</div>
            <div>
              <div className="quote-banner-title">
                {hasBooking && bookingDateLabel
                  ? `${bookingDateLabel} 예약된 사용자입니다.`
                  : !hasQuoteRequestMessage && !hasDesignerQuoteMessage
                  ? '고객 견적 요청을 기다리는 중이에요'
                  : hasQuoteRequestMessage && !hasDesignerQuoteMessage
                  ? '고객이 견적을 보냈어요'
                  : '견적을 전송했습니다'}
              </div>
              <div className="quote-banner-desc">
                {hasBooking
                  ? '예약이 확정되었습니다. 예약 내역은 마이페이지에서 확인할 수 있어요.'
                  : !hasQuoteRequestMessage && !hasDesignerQuoteMessage
                  ? '고객이 견적 폼을 보내면 이 채팅에서 내용을 확인할 수 있어요.'
                  : hasQuoteRequestMessage && !hasDesignerQuoteMessage
                  ? '요청 내역을 확인하고 금액과 메모를 작성해 견적서를 보내주세요.'
                  : '고객이 견적을 검토 중입니다. 견적을 수락하기 전까지는 수정할 수 있어요.'}
              </div>
            </div>
          </div>
          <button
            type="button"
            className="quote-banner-cta"
            onClick={(e) => {
              e.stopPropagation();
              // CTA 버튼 클릭 시에도 현재 채팅방 기준으로 필터링되도록 roomId 전달
              navigate('/designer-quotes-check', {
                state: { customerUserId: room?.userId, roomId },
              });
            }}
          >
            보기
          </button>
        </div>

        <div className="dc-bubbles">
          {messages.length === 0 ? (
            <div className="dc-empty">아직 메시지가 없습니다. 첫 메시지를 보내보세요.</div>
          ) : (
            messages.map((msg) => {
              const isDesigner = msg.senderId === user.uid;
              const isQuoteSystem = msg.isSystemMessage && msg.messageType === 'quoteReceived';
              const isUserQuoteSystem = msg.isSystemMessage && msg.messageType === 'quoteRequest';
              const isBookingSystem = msg.isSystemMessage && msg.messageType === 'bookingConfirmed';

              let timeLabel = '';
              if (msg.timestamp) {
                const d = msg.timestamp.toDate ? msg.timestamp.toDate() : new Date(msg.timestamp);
                timeLabel = d.toLocaleTimeString('ko-KR', {
                  hour: '2-digit',
                  minute: '2-digit',
                });
              }

              if (isQuoteSystem) {
                return (
                  <div key={msg.id} className="dc-system-quote-wrapper">
                    <div className="dc-system-quote-card">
                      <div className="dc-system-quote-icon">✓</div>
                      <div className="dc-system-quote-body">
                        <div className="dc-system-quote-title">견적을 전송했습니다</div>
                        <div className="dc-system-quote-text">{msg.text}</div>
                        {timeLabel && <span className="dc-time dc-time-system">{timeLabel}</span>}
                      </div>
                    </div>
                  </div>
                );
              }

              if (isUserQuoteSystem) {
                return (
                  <div key={msg.id} className="dc-system-quote-wrapper">
                    <div className="dc-system-user-quote-card">
                      <div className="dc-system-user-quote-icon">📝</div>
                      <div className="dc-system-quote-body">
                        <div className="dc-system-user-quote-title">고객이 견적을 보냈어요</div>
                        <div className="dc-system-user-quote-text">{msg.text}</div>
                        {timeLabel && <span className="dc-time dc-time-system">{timeLabel}</span>}
                      </div>
                    </div>
                  </div>
                );
              }

              if (isBookingSystem) {
                return (
                  <div key={msg.id} className="dc-system-quote-wrapper">
                    <div className="dc-system-quote-card">
                      <div className="dc-system-quote-icon">📅</div>
                      <div className="dc-system-quote-body">
                        <div className="dc-system-quote-title">견적이 완료되었어요</div>
                        <div className="dc-system-quote-text">{msg.text}</div>
                        {timeLabel && <span className="dc-time dc-time-system">{timeLabel}</span>}
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={msg.id}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: isDesigner ? 'flex-end' : 'flex-start', gap: '8px' }}
                >
                  <div className={`dc-bubble ${isDesigner ? 'dc-bubble-me' : 'dc-bubble-other'}`}>
                    <p>{msg.text}</p>
                    {timeLabel && <span className="dc-time">{timeLabel}</span>}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="dc-input-row">
        <input
          type="text"
          className="dc-input"
          placeholder="메시지를 입력하세요..."
          value={newMessage || ''}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
        />
        <button className="dc-send-btn" onClick={handleSend}>→</button>
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
            <path d="M20 21v-2a 4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
