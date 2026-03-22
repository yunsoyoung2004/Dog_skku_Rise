import './LoginPage.css';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';

const img1 = "/dog-logo.png";

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showFindModal, setShowFindModal] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('이메일과 비밀번호를 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ 로그인 성공:', userCredential.user.email);

      // Firestore에서 역할(role)을 조회해 라우팅 분리
      const uid = userCredential.user.uid;
      const userDocRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userDocRef);
      const role = userSnap.exists() ? userSnap.data().role : 'user';

      // 디자이너 계정은 사용자 로그인 페이지에서 로그인 불가
      if (role === 'designer') {
        await signOut(auth);
        setError('디자이너 계정은 디자이너 로그인 페이지에서 로그인해주세요.');
        return;
      }

      // 일반 사용자 계정만 대시보드로 이동
      navigate('/dashboard');
    } catch (err) {
      console.error('❌ 로그인 실패:', err.code, err.message);
      if (err.code === 'auth/user-not-found') {
        setError('가입되지 않은 이메일입니다.');
      } else if (err.code === 'auth/wrong-password') {
        setError('비밀번호가 일치하지 않습니다.');
      } else if (err.code === 'auth/invalid-email') {
        setError('유효한 이메일 주소를 입력해주세요.');
      } else {
        setError('로그인에 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = () => {
    navigate('/signup');
  };

  return (
    <div className="login-page">
      {/* 로고 */}
      <button 
        className="login-logo-container login-logo-button"
        onClick={() => navigate('/')}
        title="로그인페이지"
      >
        <img alt="멍빗어" className="login-logo-img" src={img1} />
      </button>

      {/* 인사말 */}
      <div className="login-greeting">
        <p>안녕하세요,</p>
        <p>멍빗어 입니다.</p>
      </div>

      {/* 입력 폼 배경 */}
      <div className="login-form-bg">
        {error && <p className="login-error">{error}</p>}
        
        {/* 아이디 입력 라벨 */}
        <label className="login-label">아이디를 입력해주세요.</label>
        <input 
          type="email"
          className="login-input"
          placeholder=""
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />

        {/* 비밀번호 입력 라벨 */}
        <label className="login-label">비밀번호를 입력해주세요.</label>
        <input 
          type="password"
          className="login-input"
          placeholder=""
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
        />
      </div>

      {/* 아이디/비밀번호 찾기 */}
      <div className="login-find-links">
        <button 
          className="login-find-btn"
          onClick={() => setShowFindModal('email')}
        >
          아이디 찾기
        </button>
        <span className="login-find-divider">ㅣ</span>
        <button 
          className="login-find-btn"
          onClick={() => setShowFindModal('password')}
        >
          비밀번호 찾기
        </button>
      </div>

      {/* 로그인 버튼 */}
      <div className="login-button-container">
        <button 
          className="login-button" 
          onClick={handleLogin}
          disabled={loading}
        >
          <p className="login-button-text">
            {loading ? '로그인 중...' : '로그인'}
          </p>
        </button>
      </div>

      {/* 회원가입 */}
      <button className="login-signup-link" onClick={handleSignUp}>
        회원가입
      </button>

      {/* 디자이너 로그인 전환 */}
      <button 
        className="login-designer-link" 
        onClick={() => navigate('/designer-login')}
      >
        디자이너이신가요? → 디자이너 로그인
      </button>

      {/* 이메일/비밀번호 찾기 모달 */}
      {showFindModal && (
        <FindModal 
          type={showFindModal}
          onClose={() => setShowFindModal(null)}
        />
      )}
    </div>
  );
}

function FindModal({ type, onClose }) {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [foundEmail, setFoundEmail] = useState('');

  const handleFindEmail = async () => {
    setLoading(true);
    setMessage('');
    try {
      if (!phone) {
        setMessage('전화번호를 입력해주세요.');
        return;
      }
      const response = await fetch('http://localhost:3000/api/find-id-by-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setMessage(data.message || '아이디를 찾을 수 없습니다.');
        setFoundEmail('');
        return;
      }

      if (data.emailMasked && data.email) {
        setFoundEmail(data.email);
        setMessage(`가입된 아이디는 ${data.emailMasked} 입니다.`);
      } else if (data.emailMasked) {
        setFoundEmail('');
        setMessage(`가입된 아이디는 ${data.emailMasked} 입니다.`);
      } else {
        setFoundEmail('');
        setMessage('해당 계정의 이메일 정보를 찾을 수 없습니다.');
      }
    } catch (err) {
      console.error('아이디 찾기 실패:', err);
      setMessage('아이디를 찾는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (targetEmail) => {
    setLoading(true);
    setMessage('');
    try {
      const { sendPasswordResetEmail } = await import('firebase/auth');
      const emailToUse = (targetEmail || email || '').trim();

      if (!emailToUse) {
        setMessage('이메일을 입력해주세요.');
        return;
      }

      await sendPasswordResetEmail(auth, emailToUse);
      setMessage('비밀번호 재설정 이메일이 발송되었습니다. 이메일을 확인해주세요.');
    } catch (err) {
      console.error('비밀번호 재설정 실패:', err);
      // Firebase 에러 코드에 따른 안내 분기
      if (err.code === 'auth/user-not-found') {
        setMessage('가입되지 않은 이메일입니다.');
      } else if (err.code === 'auth/invalid-email') {
        setMessage('유효한 이메일 주소를 입력해주세요.');
      } else {
        setMessage('비밀번호 재설정 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      }
    }
    setLoading(false);
  };

  return (
    <div className="login-modal-overlay" onClick={onClose}>
      <div className="login-modal" onClick={(e) => e.stopPropagation()}>
        <button className="login-modal-close" onClick={onClose}>×</button>
        <h2>{type === 'email' ? '아이디 찾기' : '비밀번호 찾기'}</h2>
        
        {type === 'email' ? (
          <div>
            <p className="login-modal-text">가입 시 사용한 전화번호를 입력해주세요.</p>
            <input
              type="tel"
              placeholder="010-1234-5678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="login-modal-input"
            />
            <button 
              className="login-modal-button"
              onClick={handleFindEmail}
              disabled={loading}
            >
              {loading ? '확인 중...' : '확인'}
            </button>
            <p className="login-modal-text" style={{ marginTop: '12px' }}>
              멍빗허 고객센터로 연락주세요. 고객센터 전화번호 010-8635-3984
            </p>
          </div>
        ) : (
          <div>
            <p className="login-modal-text">가입된 이메일을 입력해주세요.</p>
            <input
              type="email"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="login-modal-input"
            />
            <button 
              className="login-modal-button"
              onClick={() => handleResetPassword()}
              disabled={loading}
            >
              {loading ? '발송 중...' : '재설정 이메일 발송'}
            </button>
          </div>
        )}

        {message && <p className="login-modal-message">{message}</p>}
      </div>
    </div>
  );
}
