import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './firebase';
import './PaymentPage.css';

export default function PaymentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user] = useAuthState(auth);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [cardInfo, setCardInfo] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardName: ''
  });

  const bookingPrice = 65000;
  const discount = 0;
  const finalPrice = bookingPrice - discount;

  const handleCardChange = (e) => {
    const { name, value } = e.target;
    setCardInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePayment = async () => {
    setError('');

    if (!user) {
      setError('로그인이 필요합니다');
      navigate('/login');
      return;
    }

    if (!agreeTerms) {
      setError('이용약관과 개인정보처리방침에 동의해주세요');
      return;
    }

    if (paymentMethod === 'card') {
      if (!cardInfo.cardNumber || !cardInfo.expiryDate || !cardInfo.cvv || !cardInfo.cardName) {
        setError('카드 정보를 모두 입력해주세요');
        return;
      }
      if (cardInfo.cardNumber.length !== 16) {
        setError('카드 번호는 16자리여야 합니다');
        return;
      }
      if (cardInfo.cvv.length !== 3) {
        setError('CVV는 3자리여야 합니다');
        return;
      }
    }

    setLoading(true);
    try {
      // 실제 결제 처리 (여기서는 시뮬레이션)
      // TODO: 결제 게이트웨이 API 호출 (Stripe, KG이니시스 등)
      
      // 임시로 성공 처리
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      navigate('/booking-confirmation', { 
        state: { 
          bookingId: location.state?.bookingId,
          paymentMethod: paymentMethod,
          amount: finalPrice 
        } 
      });
    } catch (err) {
      console.error('❌ 결제 실패:', err);
      setError('결제에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="payment-page" data-node-id="payment-page">
      {/* Header */}
      <div className="payment-header">
        <button className="payment-back-btn" onClick={() => navigate(-1)}>←</button>
        <h1>결제</h1>
        <div style={{ width: '24px' }}></div>
      </div>

      {/* Content */}
      <div className="payment-container">
        {error && (
          <div style={{ padding: '10px', backgroundColor: '#ffeeee', color: '#cc0000', textAlign: 'center', marginBottom: '10px' }}>
            {error}
          </div>
        )}
        {/* Booking Summary */}
        <div className="booking-summary">
          <h2>예약 정보</h2>
          <div className="summary-item">
            <span>디자이너</span>
            <strong>미용사 홍길동</strong>
          </div>
          <div className="summary-item">
            <span>날짜</span>
            <strong>2024년 2월 25일</strong>
          </div>
          <div className="summary-item">
            <span>시간</span>
            <strong>10:00 ~ 11:30</strong>
          </div>
          <div className="summary-item">
            <span>서비스</span>
            <strong>푸들 풀 미용</strong>
          </div>
        </div>

        {/* Price Summary */}
        <div className="price-summary">
          <h2>결제 정보</h2>
          <div className="price-row">
            <span>서비스 비용</span>
            <strong>{bookingPrice.toLocaleString()}원</strong>
          </div>
          {discount > 0 && (
            <div className="price-row discount">
              <span>할인</span>
              <strong>-{discount.toLocaleString()}원</strong>
            </div>
          )}
          <div className="price-row total">
            <span>총 결제 금액</span>
            <strong>{finalPrice.toLocaleString()}원</strong>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="payment-methods">
          <h2>결제 수단 선택</h2>
          
          <label className="payment-method-option">
            <input
              type="radio"
              name="paymentMethod"
              value="card"
              checked={paymentMethod === 'card'}
              onChange={(e) => setPaymentMethod(e.target.value)}
            />
            <span>신용카드</span>
          </label>

          {paymentMethod === 'card' && (
            <div className="card-form">
              <input
                type="text"
                name="cardNumber"
                placeholder="카드 번호 (16자리)"
                value={cardInfo.cardNumber}
                onChange={handleCardChange}
                maxLength="16"
              />
              <div className="card-row">
                <input
                  type="text"
                  name="expiryDate"
                  placeholder="MM/YY"
                  value={cardInfo.expiryDate}
                  onChange={handleCardChange}
                  maxLength="5"
                />
                <input
                  type="text"
                  name="cvv"
                  placeholder="CVV"
                  value={cardInfo.cvv}
                  onChange={handleCardChange}
                  maxLength="3"
                />
              </div>
              <input
                type="text"
                name="cardName"
                placeholder="카드 소유자 이름"
                value={cardInfo.cardName}
                onChange={handleCardChange}
              />
            </div>
          )}

          <label className="payment-method-option">
            <input
              type="radio"
              name="paymentMethod"
              value="mobile"
              checked={paymentMethod === 'mobile'}
              onChange={(e) => setPaymentMethod(e.target.value)}
            />
            <span>모바일 페이</span>
          </label>

          <label className="payment-method-option">
            <input
              type="radio"
              name="paymentMethod"
              value="bankTransfer"
              checked={paymentMethod === 'bankTransfer'}
              onChange={(e) => setPaymentMethod(e.target.value)}
            />
            <span>계좌이체</span>
          </label>
        </div>

        {/* Agree Terms */}
        <div className="agree-section">
          <label className="checkbox">
            <input 
              type="checkbox" 
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
            />
            <span>이용약관 및 개인정보처리방침에 동의합니다</span>
          </label>
        </div>

        {/* Payment Button */}
        <button 
          className="payment-btn" 
          onClick={handlePayment}
          disabled={loading || !agreeTerms}
        >
          {loading ? '처리중...' : `${finalPrice.toLocaleString()}원 결제하기`}
        </button>
      </div>
    </div>
  );
}
