import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './HelpPage.css';

const logoImg = "/vite.svg";

export default function HelpPage() {
  const navigate = useNavigate();
  const [expandedFaq, setExpandedFaq] = useState(null);

  const toggleFaq = (id) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  const faqs = [
    {
      id: 1,
      question: '미용사는 어떻게 찾나요?',
      answer: '검색 페이지에서 위치, 가격, 평점으로 필터링할 수 있습니다. 위시리스트에 추가한 미용사는 즐겨찾기에서 확인할 수 있습니다.'
    },
    {
      id: 2,
      question: '강아지 정보는 어떻게 등록하나요?',
      answer: '내 정보 > 강아지 관리에서 강아지 정보를 등록할 수 있습니다. 사진, 견종, 나이, 몸무게 등을 입력할 수 있습니다.'
    },
    {
      id: 3,
      question: '미용 예약은 어떻게 하나요?',
      answer: '원하는 미용사를 선택한 후 캘린더에서 날짜와 시간을 선택하면 예약이 완료됩니다.'
    },
    {
      id: 4,
      question: '결제는 어떻게 이루어지나요?',
      answer: '예약 완료 후 결제 페이지에서 신용카드 또는 모바일 페이로 결제할 수 있습니다.'
    },
    {
      id: 5,
      question: '예약을 취소하려면?',
      answer: '마이페이지 > 미용 이력에서 예약을 취소할 수 있습니다. 예약 24시간 전까지 취소 시 전액 환불됩니다.'
    },
    {
      id: 6,
      question: '후기는 어떻게 작성하나요?',
      answer: '미용이 완료된 후 별점과 함께 후기를 작성할 수 있습니다. 사진도 첨부할 수 있습니다.'
    }
  ];

  return (
    <div className="help-page" data-node-id="help-page">
      {/* Header */}
      <div className="help-header">
        <button className="help-back-btn" onClick={() => navigate('/mypage')}>←</button>
        <h1>도움말</h1>
        <div style={{ width: '24px' }}></div>
      </div>

      {/* Help Container */}
      <div className="help-container">
        {/* Contact Section */}
        <div className="help-section">
          <h2>고객 지원</h2>
          <div className="contact-info">
            <div className="contact-item">
              <span className="contact-label">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                전화
              </span>
              <p>1588-1234 (평일 10:00-18:00)</p>
            </div>
            <div className="contact-item">
              <span className="contact-label">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                이메일
              </span>
              <p>support@meongbiter.com</p>
            </div>
            <div className="contact-item">
              <span className="contact-label">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                카카오톡
              </span>
              <p>@멍빗어 검색 후 추가</p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="help-section">
          <h2>자주 묻는 질문</h2>
          <div className="faq-list">
            {faqs.map((faq) => (
              <div key={faq.id} className="faq-item">
                <button
                  className="faq-question"
                  onClick={() => toggleFaq(faq.id)}
                >
                  <span>{faq.question}</span>
                  <span className={`faq-icon ${expandedFaq === faq.id ? 'open' : ''}`}>
                    ▼
                  </span>
                </button>
                {expandedFaq === faq.id && (
                  <div className="faq-answer">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Help Topics */}
        <div className="help-section">
          <h2>도움말 주제</h2>
          <div className="help-topics">
            <button className="help-topic-btn">예약하기</button>
            <button className="help-topic-btn">취소/환불</button>
            <button className="help-topic-btn">결제</button>
            <button className="help-topic-btn">계정 관리</button>
            <button className="help-topic-btn">강아지 정보</button>
            <button className="help-topic-btn">미용사 문의</button>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="help-nav">
        <button onClick={() => navigate('/dashboard')} title="대시보드">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </button>
        <button onClick={() => navigate('/search')} title="검색">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
          </svg>
        </button>
        <button onClick={() => navigate('/chat')} title="채팅">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </button>
        <button onClick={() => navigate('/mypage')} title="마이페이지">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
