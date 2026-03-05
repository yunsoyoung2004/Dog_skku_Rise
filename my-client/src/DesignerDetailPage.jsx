import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { createOrGetChatRoom } from './services';
import './DesignerDetailPage.css';

export default function DesignerDetailPage({ isOpen = true, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [user] = useAuthState(auth);
  const [designer, setDesigner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const searchParams = new URLSearchParams(location.search);
  const designerId = searchParams.get('id');

  useEffect(() => {
    if (!isOpen) return;
    if (!designerId) {
      setError('디자이너 정보를 찾을 수 없습니다.');
      setLoading(false);
      return;
    }

    const loadDesigner = async () => {
      try {
        setLoading(true);
        setError('');

        // 공개용 designers 컬렉션에서 정보 조회
        const designerRef = doc(db, 'designers', designerId);
        const designerSnap = await getDoc(designerRef);

        if (!designerSnap.exists()) {
          setError('등록된 디자이너 정보를 찾을 수 없습니다.');
          setDesigner(null);
          return;
        }

        const data = designerSnap.data();
        setDesigner({
          id: designerId,
          name: data.name || data.designerName || '이름 미등록',
          photoURL: data.image || data.photoURL || '',
          location: data.location || '위치 미등록',
          bio: data.bio || '',
          portfolioIntro: data.portfolioIntro || '',
          announcements: data.announcements || '',
          paymentInfo: data.paymentInfo || '',
          supportInfo: data.supportInfo || '',
        });
      } catch (e) {
        console.error('디자이너 정보 로드 실패:', e);
        setError('디자이너 정보를 불러오지 못했습니다.');
        setDesigner(null);
      } finally {
        setLoading(false);
      }
    };

    loadDesigner();
  }, [designerId, isOpen]);

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      navigate(-1);
    }
  };

  const handleStartChat = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!designerId || !designer) {
      alert('디자이너 정보를 찾을 수 없습니다.');
      return;
    }

    try {
      const room = await createOrGetChatRoom(user.uid, designerId, {
        designerName: designer.name,
        designerAvatar: designer.photoURL || '',
      });
      navigate(`/chat/${room.id}`);
    } catch (e) {
      console.error('채팅 시작 실패:', e);
      alert('채팅방을 생성하지 못했습니다. 잠시 후 다시 시도해 주세요.');
    }
  };

  const handleRequestQuote = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!designerId || !designer) {
      alert('견적서를 보낼 디자이너를 찾을 수 없습니다.');
      return;
    }

    navigate('/quote-request', {
      state: {
        designerId,
        designerName: designer.name,
        designerImage: designer.photoURL || '',
      },
    });
  };

  if (!isOpen) return null;

  return (
    <div className="designer-detail-overlay">
      <div className="designer-detail-container">
        {/* Header */}
        <div className="designer-detail-header">
          <button className="designer-detail-back" onClick={handleClose}>
            ←
          </button>
        </div>

        {/* Content */}
        <div className="designer-detail-scroll">
          {loading ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
              디자이너 정보를 불러오는 중입니다...
            </div>
          ) : error || !designer ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
              <p>🔒 {error || '디자이너 정보를 찾을 수 없습니다.'}</p>
            </div>
          ) : (
            <>
              {/* Top Section - 디자이너 기본 정보 */}
              <div className="designer-hero">
                <div className="designer-image-wrapper">
                  {designer.photoURL ? (
                    <img
                      src={designer.photoURL}
                      alt={designer.name}
                      className="designer-image"
                    />
                  ) : (
                    <div className="designer-image placeholder">🐶</div>
                  )}
                </div>

                <div className="designer-intro">
                  <h1 className="designer-name">{designer.name || '이름 없음'}</h1>
                  <div className="designer-location">
                    <span className="location-icon">📍</span>
                    <span className="location-text">{designer.location || '위치 없음'}</span>
                  </div>
                  <p className="designer-motto">
                    {designer.portfolioIntro || '포트폴리오 소개 없음'}
                  </p>
                </div>

                {/* 액션 버튼: 채팅 / 견적 요청 */}
                <div className="designer-action-buttons">
                  <button
                    type="button"
                    className="designer-action-chat"
                    onClick={handleStartChat}
                  >
                    💬 채팅하기
                  </button>
                  <button
                    type="button"
                    className="designer-action-quote"
                    onClick={handleRequestQuote}
                  >
                    📄 견적서 요청하기
                  </button>
                </div>
              </div>

              {/* 디자이너 소개 섹션 */}
              <section className="designer-section">
                <h2 className="section-title">디자이너 소개글</h2>
                <p className="section-text">{designer.bio || '없음'}</p>
              </section>

              {/* 공지 / 결제 / 문의 정보는 항상 같은 형식으로 노출하고, 없으면 '없음'으로 표시 */}
              <section className="designer-section">
                <h2 className="section-title">추가 정보</h2>
                <div className="section-content">
                  <h3 className="section-subtitle">공지사항 및 이벤트</h3>
                  <p className="section-text">{designer.announcements || '없음'}</p>
                </div>
                <div className="section-content">
                  <h3 className="section-subtitle">결제수단 안내</h3>
                  <p className="section-text">{designer.paymentInfo || '없음'}</p>
                </div>
                <div className="section-content">
                  <h3 className="section-subtitle">문의 및 고객센터</h3>
                  <p className="section-text">{designer.supportInfo || '없음'}</p>
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
