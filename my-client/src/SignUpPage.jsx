import './SignUpPage.css';
import { useState } from 'react';

const logoImg = "https://www.figma.com/api/mcp/asset/f7fb226f-1979-4229-aaa8-836624899466";

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    nickname: '',
    userId: '',
    password: '',
    passwordConfirm: '',
    phone: '',
    termsAgreed: false,
  });

  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSignUp = (e) => {
    e.preventDefault();
    setError('');

    if (!formData.termsAgreed) {
      setError('이용약관에 동의해주세요.');
      return;
    }
    if (!formData.nickname || !formData.userId || !formData.password || !formData.passwordConfirm || !formData.phone) {
      setError('모든 필드를 입력해주세요.');
      return;
    }
    if (formData.password !== formData.passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    console.log('회원가입 데이터:', formData);
  };

  return (
    <div className="signup-page">
      {/* 로고 */}
      <div className="signup-logo-container">
        <img alt="멍빗어 로고" src={logoImg} className="signup-logo-img" />
      </div>

      {/* 인사말 */}
      <div className="signup-greeting">
        <p>안녕하세요,</p>
        <p>멍빗어 입니다.</p>
      </div>

      {/* 폼 컨테이너 */}
      <form className="signup-form-container" onSubmit={handleSignUp}>
        {/* 닉네임 입력 */}
        <div className="signup-input-wrapper">
          <label className="signup-input-label">닉네임</label>
          <input 
            type="text" 
            className="signup-form-input"
            name="nickname"
            value={formData.nickname}
            onChange={handleInputChange}
          />
          <div className="signup-divider"></div>
        </div>

        {/* 아이디 입력 */}
        <div className="signup-input-wrapper">
          <label className="signup-input-label">아이디</label>
          <input 
            type="text" 
            className="signup-form-input"
            name="userId"
            value={formData.userId}
            onChange={handleInputChange}
          />
          <div className="signup-divider"></div>
        </div>

        {/* 비밀번호 입력 */}
        <div className="signup-input-wrapper">
          <label className="signup-input-label">비밀번호</label>
          <input 
            type="password" 
            className="signup-form-input"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
          />
          <div className="signup-divider"></div>
        </div>

        {/* 비밀번호 재확인 */}
        <div className="signup-input-wrapper">
          <label className="signup-input-label">비밀번호 재확인</label>
          <input 
            type="password" 
            className="signup-form-input"
            name="passwordConfirm"
            value={formData.passwordConfirm}
            onChange={handleInputChange}
          />
          <div className="signup-divider"></div>
        </div>

        {/* 전화번호 입력 */}
        <div className="signup-input-wrapper">
          <label className="signup-input-label">전화번호</label>
          <input 
            type="tel" 
            className="signup-form-input"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
          />
          <div className="signup-divider"></div>
        </div>

        {/* 에러 메시지 */}
        {error && <div className="signup-error-message">{error}</div>}

        {/* 약관 동의 */}
        <div className="signup-terms-section">
          <input 
            type="checkbox" 
            id="terms-agree"
            className="signup-terms-input"
            name="termsAgreed"
            checked={formData.termsAgreed}
            onChange={handleInputChange}
          />
          <label htmlFor="terms-agree" className="signup-terms-label">
            이용약관에 모두 동의합니다.
          </label>
        </div>

        {/* 다음 버튼 */}
        <button className="signup-button" type="submit">
          다음
        </button>
      </form>
    </div>
  );
}
