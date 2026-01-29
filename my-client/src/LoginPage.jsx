import './LoginPage.css';
import { useState } from 'react';
import Button from './components/Button';
import Input from './components/Input';

const logoImg = "https://www.figma.com/api/mcp/asset/d31f145f-3bad-4385-b80e-bfe5b275b938";

export default function LoginPage() {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('userId', userId);
        window.location.href = '/dashboard';
      } else {
        setError(data.message || '로그인에 실패했습니다.');
      }
    } catch (err) {
      setError('서버와 통신할 수 없습니다. 나중에 다시 시도해주세요.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Logo Container */}
      <div className="logo-container">
        <img alt="멍빗어 로고" src={logoImg} className="logo-img" />
      </div>

      {/* Greeting Section */}
      <div className="greeting">
        <p>안녕하세요,</p>
        <p>멍빗어 입니다.</p>
      </div>

      {/* Form Container */}
      <form className="form-container" onSubmit={handleLogin}>
        {/* ID Input Group */}
        <div className="input-wrapper">
          <label className="input-label">아이디를 입력해주세요.</label>
          <input
            type="text"
            className="form-input"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder=""
            disabled={isLoading}
          />
          <div className="divider"></div>
        </div>

        {/* Password Input Group */}
        <div className="input-wrapper">
          <label className="input-label">비밀번호를 입력해주세요.</label>
          <input
            type="password"
            className="form-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder=""
            disabled={isLoading}
          />
          <div className="divider"></div>
        </div>

        {/* Error Message */}
        {error && <div className="error-message">{error}</div>}

        {/* Links */}
        <div className="links-section">
          <a href="/find-id" className="link-text">아이디 찾기</a>
          <span className="link-divider"> ㅣ </span>
          <a href="/find-password" className="link-text">비밀번호 찾기</a>
        </div>

        {/* Login Button */}
        <button
          type="submit"
          className="login-btn"
          disabled={isLoading || !userId || !password}
        >
          {isLoading ? '로그인 중...' : '로그인'}
        </button>

        {/* Signup Link */}
        <div className="signup-section">
          <a href="/signup" className="signup-link">회원가입</a>
        </div>
      </form>
    </div>
  );
}
