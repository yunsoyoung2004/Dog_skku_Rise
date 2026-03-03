import { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import './DesignerPageNav.css';
import './DesignerSendQuotePage.css';

export default function DesignerSendQuotePage() {
  const navigate = useNavigate();
  const { quoteId } = useParams();
  const location = useLocation();
  const quote = location.state?.quote || {};

  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // 여기서는 실제 전송 대신 UI 상의 성공 상태만 처리합니다.
    setSent(true);
    // 필요하면 일정 시간 후 목록으로 이동하도록 할 수 있습니다.
    // setTimeout(() => navigate('/designer-quotes'), 1200);
  };

  return (
    <div className="designer-page">
      <div className="designer-page-header">
        <button onClick={() => navigate(-1)}>←</button>
        <h1>견적서 보내기</h1>
      </div>

      <div className="designer-content send-quote-content">
        {sent && (
          <div className="send-quote-toast">
            제안서가 전송되었습니다.
          </div>
        )}

        <section className="send-quote-summary">
          <h2>요청 정보</h2>
          <p><span className="label">반려견:</span> {quote.dogName || quote.title || '반려견'}</p>
          <p><span className="label">고객명:</span> {quote.ownerName || '고객'}</p>
          <p><span className="label">서비스:</span> {quote.serviceType || '미정'}</p>
          <p><span className="label">예정 날짜:</span> {quote.preferredDate || quote.time || '미정'}</p>
        </section>

        <form className="send-quote-form" onSubmit={handleSubmit}>
          <label className="field">
            <span className="field-label">제안 금액</span>
            <div className="field-inline">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="예: 70,000"
                required
              />
              <span className="unit">원</span>
            </div>
          </label>

          <label className="field">
            <span className="field-label">추가 메모</span>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="반려견 상태나 미용 방식에 대한 안내를 작성해 주세요."
              rows={4}
            />
          </label>

          <button
            type="submit"
            className="send-quote-submit"
            disabled={sent}
          >
            {sent ? '전송 완료' : '견적서 보내기'}
          </button>
        </form>
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
