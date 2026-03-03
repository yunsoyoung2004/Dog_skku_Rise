import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { auth, db } from './firebase';
import './DesignerPageNav.css';
import './DesignerQuotesPage.css';

export default function DesignerQuotesPage() {
  const navigate = useNavigate();
  const [user] = useAuthState(auth);
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/designer-login');
      return;
    }

    const fetchQuotes = async () => {
      try {
        const q = query(
          collection(db, 'quotes'),
          where('designerId', '==', user.uid)
        );
        const snapshot = await getDocs(q);
        const quotesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setQuotes(quotesData);
      } catch (error) {
        console.error('Error fetching quotes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuotes();
  }, [user, navigate]);

  const handleQuoteAction = async (quoteId, action) => {
    try {
      const quoteRef = doc(db, 'quotes', quoteId);
      await updateDoc(quoteRef, {
        status: action,
        updatedAt: new Date()
      });

      setQuotes(quotes.map(q =>
        q.id === quoteId ? { ...q, status: action } : q
      ));
    } catch (error) {
      console.error('Error updating quote:', error);
    }
  };

  return (
    <div className="designer-page">
      <div className="designer-page-header">
        <button onClick={() => navigate(-1)}>←</button>
        <h1>견적 요청</h1>
      </div>

      <div className="designer-content">
        {loading ? (
          <div className="loading-message">로딩 중...</div>
        ) : quotes.length === 0 ? (
          <div className="empty-message">견적 요청이 없습니다</div>
        ) : (
          <div className="quotes-list">
            {quotes.map(quote => (
              <div key={quote.id} className="quote-item">
                <div className="quote-header">
                  <div className="quote-info">
                    <h3>{quote.dogName || '반려견'}</h3>
                    <p className="quote-owner">{quote.ownerName || '고객명'}</p>
                    <p className="quote-date">
                      {quote.createdAt?.toDate?.()?.toLocaleDateString?.() || '날짜 미정'}
                    </p>
                  </div>
                  <div className={`quote-status ${quote.status || 'pending'}`}>
                    {quote.status === 'accepted' && '수락함'}
                    {quote.status === 'rejected' && '거절함'}
                    {!quote.status || quote.status === 'pending' ? '대기중' : ''}
                  </div>
                </div>

                <div className="quote-details">
                  <p><strong>서비스:</strong> {quote.serviceType || '미정'}</p>
                  <p><strong>예정 날짜:</strong> {quote.preferredDate || '미정'}</p>
                  <p><strong>요청사항:</strong> {quote.notes || '없음'}</p>
                </div>

                {(!quote.status || quote.status === 'pending') && (
                  <div className="quote-actions">
                    <button
                      className="btn-accept"
                      onClick={() => handleQuoteAction(quote.id, 'accepted')}
                    >
                      수락하기
                    </button>
                    <button
                      className="btn-reject"
                      onClick={() => handleQuoteAction(quote.id, 'rejected')}
                    >
                      거절하기
                    </button>
                    <button
                      className="btn-send"
                      onClick={() => navigate(`/designer-quote-send/${quote.id}`, { state: { quote } })}
                    >
                      견적서 보내기
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
