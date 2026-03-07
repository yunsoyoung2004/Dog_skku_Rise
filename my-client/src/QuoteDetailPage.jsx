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
      const receivedQuotes = await getUserQuotes(user.uid);
      setQuotes(receivedQuotes);
      if (receivedQuotes.length > 0) {
        setSelectedDog(receivedQuotes[0].dogName);
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
        <h1>받은 견적</h1>
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

            {/* Sent Quote Requests List */}
            <div className="quotes-list">
              {quotes.length > 0 ? (
                quotes.map((quote) => (
                  <div key={quote.id} className="quote-card">
                    <div className="quote-header">
                      <div className="quote-designer">
                        <span className="quote-designer-avatar">👤</span>
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
                          {quote.status === 'responded' ? '응답 완료' : '대기 중'}
                        </span>
                      </div>
                    </div>

                    <p className="quote-message">{quote.notes || '요청 상세 정보가 없습니다.'}</p>

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

                    <div className="quote-actions">
                      <button
                        className="quote-accept-btn"
                        onClick={() => navigate('/quote-request', { state: { designerId: quote.designerId, designerName: quote.designerName, originalRequest: quote } })}
                      >
                        수정해서 다시 보내기
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
