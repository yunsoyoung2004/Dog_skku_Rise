import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './firebase';
import { getUserQuotes } from './services';
import './QuoteDetailPage.css';

export default function QuoteDetailPage() {
  const navigate = useNavigate();
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
      const userQuotes = await getUserQuotes(user.uid);
      setQuotes(userQuotes);
      if (userQuotes.length > 0) {
        setSelectedDog(userQuotes[0].dogName);
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

  return (
    <div className="quote-detail-page" data-node-id="quote-detail">
      {/* Header */}
      <div className="quote-detail-header">
        <button className="quote-detail-back-btn" onClick={() => navigate(-1)}>←</button>
        <h1>견적 조회</h1>
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
                <div className="quote-dog-avatar">🐕</div>
                <div className="quote-dog-details">
                  <h2>{selectedDog}</h2>
                  <p>견종 · 나이 · 성별</p>
                </div>
              </div>
            )}

            {/* Quotes List */}
            <div className="quotes-list">
              {quotes.length > 0 ? (
                quotes.map((quote) => (
                  <div key={quote.id} className="quote-card">
                    <div className="quote-header">
                      <div className="quote-designer">
                        <span className="quote-designer-avatar">{quote.designerImage || '👤'}</span>
                        <div className="quote-designer-info">
                          <h3>{quote.designerName}</h3>
                          <p className="quote-date">{new Date(quote.timestamp).toLocaleDateString('ko-KR')}</p>
                        </div>
                      </div>
                      <div className="quote-price">
                        <span className="price-value">{quote.price.toLocaleString()}원</span>
                      </div>
                    </div>

                    <p className="quote-message">{quote.message}</p>

                    <div className="quote-services">
                      <h4>서비스 내용</h4>
                      <div className="services-list">
                        {quote.services && quote.services.map((service, idx) => (
                          <span key={idx} className="service-tag">
                            {service}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="quote-actions">
                      <button
                        className="quote-accept-btn"
                        onClick={() => navigate('/calendar', { state: { designerId: quote.designerId } })}
                      >
                        이 견적으로 예약
                      </button>
                      <button 
                        className="quote-contact-btn"
                        onClick={() => navigate('/chat')}
                      >
                        미용사에게 문의
                      </button>
                    </div>
                  </div>
                ))
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

      {/* Bottom Navigation */}
      <div className="quote-detail-nav">
        <button onClick={() => navigate('/dashboard')}>🏠</button>
        <button onClick={() => navigate('/search')}>💼</button>
        <button onClick={() => navigate('/chat')}>💬</button>
        <button onClick={() => navigate('/mypage')}>👤</button>
      </div>
    </div>
  );
}
