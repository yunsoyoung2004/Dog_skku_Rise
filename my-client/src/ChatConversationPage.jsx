import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, doc, getDoc, getDocs, onSnapshot, orderBy, query, updateDoc, where } from 'firebase/firestore';
import { auth, db } from './firebase';
import { sendMessage, createNotification } from './services';
import AlertModal from './components/AlertModal';
import PageLayout from './PageLayout';
import './DesignerChatConversationPage.css';

export default function ChatConversationPage() {
  const navigate = useNavigate();
  const { roomId } = useParams();
  const [user] = useAuthState(auth);
  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [alert, setAlert] = useState(null);
  const lastQuoteReceivedIdRef = useRef(null);
  const messagesEndRef = useRef(null);
  const [booking, setBooking] = useState(null);

  // 채팅방 정보 로드 (고객용: userId 확인)
  useEffect(() => {
    const loadRoom = async () => {
      if (!roomId) return;
      if (!user) {
        navigate('/login');
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

        // 본인(userId)의 채팅방인지 확인
        if (data.userId && data.userId !== user.uid) {
          setError('해당 채팅방에 접근할 수 없습니다.');
          setRoom(null);
          return;
        }

        // 이 채팅방을 연 시점에, 고객 입장에서 미읽은 메시지를 모두 읽은 것으로 처리
        // (ChatPage에서 사용하는 unreadCount를 0으로 리셋)
        if (typeof data.unreadCount === 'number' && data.unreadCount > 0) {
          try {
            await updateDoc(roomRef, { unreadCount: 0 });
            data.unreadCount = 0;
          } catch (e) {
            console.warn('⚠️  채팅방 unreadCount 리셋 실패(무시 가능):', e.message || e);
          }
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

  // 새 메시지 도착 시 맨 아래로 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 견적 재요청 이벤트 리스닝 - 배너 상태 업데이트
  useEffect(() => {
    const handleQuoteRequestCompleted = (e) => {
      console.log('🎯 [ChatConversationPage] quoteRequestCompleted 이벤트 감지 - 배너가 업데이트됩니다:', e.detail);
      // onSnapshot 구독이 자동으로 새로운 메시지를 받아와서 배너 상태를 업데이트함
    };

    window.addEventListener('quoteRequestCompleted', handleQuoteRequestCompleted);
    return () => window.removeEventListener('quoteRequestCompleted', handleQuoteRequestCompleted);
  }, []);

  // 이 채팅방과 연결된 예약 정보 로드 (예약일/시간 배너 표시용)
  useEffect(() => {
    const fetchBookingForRoom = async () => {
      if (!roomId || !user) return;

      try {
        const bookingsRef = collection(db, 'bookings');
        const q = query(bookingsRef, where('chatRoomId', '==', roomId));
        const snap = await getDocs(q);

        let best = null;
        snap.forEach((docSnap) => {
          const data = docSnap.data();
          best = { id: docSnap.id, ...data };
        });

        setBooking(best);
      } catch (e) {
        console.warn('채팅 예약 정보 로드 실패(무시 가능):', e);
      }
    };

    fetchBookingForRoom();
  }, [roomId, user]);

  const handleSend = async () => {
    if (!newMessage.trim() || !roomId || !user) return;

    const text = newMessage.trim();
    setNewMessage('');

    try {
      await sendMessage(roomId, {
        senderId: user.uid,
        senderType: 'user',
        text,
      });

      // 디자이너에게 알림 생성 (채팅이 아닐 때도 알림 탭에서 볼 수 있도록)
      if (room?.designerId) {
        try {
          await createNotification(room.designerId, {
            title: room.designerName || '새 메시지',
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
      setAlert({
        title: '전송 실패',
        text: '메시지 전송에 실패했습니다.\n잠시 후 다시 시도해주세요.',
      });
    }
  };

  const renderMessages = () => {
    if (messages.length === 0) {
      return <div className="dc-empty">아직 메시지가 없습니다. 첫 메시지를 보내보세요.</div>;
    }

    return messages.map((msg) => {
      const isMe = msg.senderId === user?.uid;

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
                <div className="dc-system-user-quote-title">견적 요청을 보냈습니다</div>
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
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: isMe ? 'flex-end' : 'flex-start',
            gap: '8px',
          }}
        >
          <div className={`dc-bubble ${isMe ? 'dc-bubble-me' : 'dc-bubble-other'}`}>
            <p>{msg.text}</p>
            {timeLabel && <span className="dc-time">{timeLabel}</span>}
          </div>
        </div>
      );
    });
  };

  const title = room?.designerName || room?.roomName || room?.title || '채팅';

  // 채팅 내에 "견적 요청" 시스템 메시지가 있는지 여부
  const hasQuoteRequestMessage = messages.some(
    (msg) => msg.messageType === 'quoteRequest'
  );

  // 디자이너가 견적을 보냈는지 여부 (quoteReceived 시스템 메시지)
  const hasDesignerQuoteMessage = messages.some(
    (msg) => msg.messageType === 'quoteReceived'
  );

  // 사용자가 견적을 확정했는지 여부 (bookingConfirmed 시스템 메시지)
  const hasBookingConfirmedMessage = messages.some(
    (msg) => msg.messageType === 'bookingConfirmed'
  );

  const hasBooking = hasBookingConfirmedMessage || !!booking;

  const formatDate = (tsOrDate) => {
    if (!tsOrDate) return '';
    const d = tsOrDate.toDate ? tsOrDate.toDate() : new Date(tsOrDate);
    return d.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
  };

  const bookingDateLabel = booking ? formatDate(booking.bookingDate) : '';

  const designerNameForBanner = room?.designerName || booking?.designerName || '디자이너';

  // 가장 최근 시스템 상태(견적 요청 / 견적 도착 / 예약 완료)를 계산
  let latestStatus = null; // 'bookingConfirmed' | 'quoteReceived' | 'quoteRequest' | null

  for (let i = messages.length - 1; i >= 0; i--) {
    const t = messages[i].messageType;
    if (
      t === 'bookingConfirmed' ||
      t === 'quoteReceived' ||
      t === 'quoteRequest'
    ) {
      latestStatus = t;
      break;
    }
  }

  const latestIsBooking = latestStatus === 'bookingConfirmed';
  const latestIsDesignerQuote = latestStatus === 'quoteReceived';
  const latestIsQuoteRequest = latestStatus === 'quoteRequest';

  const handleOpenQuoteRequest = () => {
    // 마지막 상태가 예약 완료 / 디자이너 견적 / 내가 보낸 견적 요청이면, 견적 상세로 이동
    if (latestIsBooking || latestIsDesignerQuote || latestIsQuoteRequest) {
      navigate('/quote-detail', {
        state: {
          roomId: room?.id || roomId,
        },
      });
      return;
    }

    // 그 외에는 아직 아무 견적 흐름이 없으므로 견적 요청 화면으로 이동
    if (!user) {
      navigate('/login');
      return;
    }
    if (!room) return;

    navigate('/quote-request', {
      state: {
        designerId: room.designerId || '',
        designerName: room.designerName || room.title || room.roomName || '',
        roomId: room.id,
        fromChat: true,
      },
    });
  };

  if (loading) {
    return (
      <PageLayout title="채팅">
        <div className="dc-content">
          <p style={{ textAlign: 'center', color: '#999', marginTop: '20px' }}>
            채팅을 불러오는 중입니다...
          </p>
        </div>
        <div className="dc-input-row" style={{ visibility: 'hidden' }}>
          <input type="text" className="dc-input" disabled value={newMessage} />
          <button className="dc-send-btn" disabled>
            
            
            
          </button>
        </div>
      </PageLayout>
    );
  }

  if (error || !room) {
    return (
      <PageLayout title="채팅" homePath="/dashboard">
        <div className="dc-content">
          <p style={{ textAlign: 'center', color: '#999', marginTop: '20px' }}>
            🔒 {error || '채팅방 정보가 없습니다.'}
          </p>
        </div>
        <div className="dc-input-row" style={{ visibility: 'hidden' }}>
          <input type="text" className="dc-input" disabled value={newMessage} />
          <button className="dc-send-btn" disabled>
            
            
            
          </button>
        </div>
      </PageLayout>
    );
  }

  return (
    <>
      <AlertModal
        isOpen={!!alert}
        title={alert?.title || '알림'}
        text={alert?.text || ''}
        primaryButtonText="확인"
        onPrimaryClick={() => setAlert(null)}
        variant="default"
      />
      <PageLayout 
        title={title}
        homePath="/dashboard"
        customHeader={
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            padding: '16px',
            backgroundColor: 'white',
            borderBottom: '1px solid #e0e0e0',
            position: 'sticky',
            top: 0,
            zIndex: 10
          }}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              border: 'none',
              background: 'none',
              padding: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#666',
              fontSize: '20px'
            }}
          >
            ←
          </button>
          <h1 style={{
            margin: 0,
            fontSize: '18px',
            fontWeight: 600,
            color: '#222',
            flex: 1,
            textAlign: 'center'
          }}>{title}</h1>
          <button
            type="button"
            style={{
              position: 'relative',
              border: 'none',
              background: 'none',
              padding: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#666'
            }}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </button>
        </div>
      }
    >
      <div className="dc-content">
        <div
          className="quote-banner"
          onClick={handleOpenQuoteRequest}
        >
          <div className="quote-banner-left">
            <div className="quote-banner-icon">💌</div>
            <div>
              <div className="quote-banner-title">
                {latestIsBooking && bookingDateLabel
                  ? '견적이 완료되었어요'
                  : latestIsBooking
                  ? '견적이 완료되었어요'
                  : latestIsDesignerQuote
                  ? '견적이 도착했어요'
                  : latestIsQuoteRequest
                  ? '견적 요청을 보냈습니다'
                  : hasQuoteRequestMessage
                  ? '견적 요청이 전송되었습니다'
                  : hasDesignerQuoteMessage
                  ? '견적이 도착했어요'
                  : hasBooking && bookingDateLabel
                  ? '견적이 완료되었어요'
                  : '견적 요청하기'}
              </div>
              <div className="quote-banner-desc">
                {latestIsBooking
                  ? `${designerNameForBanner}와의 예약이 확정되었어요.\n마이페이지에서 다가오는 예약을 확인해 주세요.`
                  : latestIsDesignerQuote
                  ? '디자이너가 보낸 견적을 확인하세요.\n내용을 검토하고 금액과 조건을 확인해 주세요.'
                  : latestIsQuoteRequest
                  ? '견적 요청을 전송했어요.\n디자이너가 검토 중입니다. 답변을 기다려 주세요.'
                  : hasQuoteRequestMessage
                  ? '견적 요청이 전송되었어요.\n디자이너가 검토 중입니다. 답변을 기다려 주세요.'
                  : hasDesignerQuoteMessage
                  ? '디자이너가 보낸 견적을 확인하세요.\n내용을 검토하고 금액과 조건을 확인해 주세요.'
                  : hasBooking
                  ? `${designerNameForBanner}와의 예약이 확정되었어요.\n마이페이지에서 다가오는 예약을 확인해 주세요.`
                  : '강아지 정보와 희망 조건을 보내보세요.\n맞춤 견적을 받아볼 수 있어요.'}
              </div>
            </div>
          </div>
          <div className="quote-banner-cta">
            보기
          </div>
        </div>
        {/* 디자이너 견적 배너 하단 버튼 제거 (견적 재요청/수락은 견적 상세 화면에서 처리) */}
        <div className="dc-bubbles">
          {renderMessages()}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="dc-input-row">
        <input
          type="text"
          className="dc-input"
          placeholder="메시지를 입력하세요..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
        />
        <button className="dc-send-btn" onClick={handleSend}>
          →
        </button>
      </div>
    </PageLayout>
    </>
  );
}
