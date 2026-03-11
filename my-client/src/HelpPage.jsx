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
              <span className="contact-label">📞 전화</span>
              <p>1588-1234 (평일 10:00-18:00)</p>
            </div>
            <div className="contact-item">
              <span className="contact-label">✉️ 이메일</span>
              <p>support@meongbiter.com</p>
            </div>
            <div className="contact-item">
              <span className="contact-label">💬 카카오톡</span>
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
        <button onClick={() => navigate('/dashboard')}>🏠</button>
        <button onClick={() => navigate('/search')}>💼</button>
        <button onClick={() => navigate('/chat')}>💬</button>
        <button onClick={() => navigate('/mypage')}>👤</button>
      </div>
    </div>
  );
}
