import './DesignerLoginPage.css';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, signOut } from 'firebase/auth';
import { auth, db } from './firebase';
import { setDoc, doc, getDoc } from 'firebase/firestore';

// 사용자 로그인 페이지와 동일한 로고 이미지 사용
const logoImg = "/dog-logo.png";

export default function DesignerLoginPage() {
  const [user] = useAuthState(auth);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [designerName, setDesignerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/designer-dashboard');
    }
  }, [user, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('이메일과 비밀번호를 입력해주세요.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('유효한 이메일 주소를 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ 디자이너 로그인 시도:', userCredential.user.email);

      // Firestore에서 역할(role) 확인
      const uid = userCredential.user.uid;
      const userDocRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userDocRef);
      const role = userSnap.exists() ? userSnap.data().role : 'user';

      // 일반 사용자 계정은 디자이너 로그인 페이지에서 로그인 불가
      if (role !== 'designer') {
        await signOut(auth);
        setError('일반 사용자 계정은 사용자 로그인 페이지에서 로그인해주세요.');
        return;
      }

      console.log('✅ 디자이너 로그인 성공 (role 확인 완료):', userCredential.user.email);
      navigate('/designer-dashboard');
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

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');

    if (!designerName || !email || !password || !passwordConfirm) {
      setError('모든 필드를 입력해주세요.');
      return;
    }

    if (password !== passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('유효한 이메일 주소를 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;

      await updateProfile(newUser, {
        displayName: designerName
      });

      await setDoc(doc(db, 'users', newUser.uid), {
        uid: newUser.uid,
        designerName: designerName,
        email: email,
        role: 'designer',
        createdAt: new Date(),
      });

      console.log('✅ 디자이너 회원가입 완료:', newUser.email);
      navigate('/designer-dashboard');
    } catch (err) {
      console.error('❌ 회원가입 실패:', err.code, err.message);
      if (err.code === 'auth/email-already-in-use') {
        setError('이미 가입된 이메일입니다.');
      } else if (err.code === 'auth/weak-password') {
        setError('비밀번호가 너무 약합니다.');
      } else if (err.code === 'auth/invalid-email') {
        setError('유효한 이메일을 입력해주세요.');
      } else {
        setError('회원가입에 실패했습니다. 다시 시도해주세요.');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setError('');
    setEmail('');
    setPassword('');
    setPasswordConfirm('');
    setDesignerName('');
  };

  return (
    <div className="designer-login-page">
      {/* 로고 */}
      <button 
        className="designer-login-logo-container designer-login-logo-button"
        onClick={() => navigate('/')}
        title="로그인페이지로 돌아가기"
      >
        <img alt="멍빗어" className="designer-login-logo-img" src={logoImg} />
      </button>

      {/* 인사말 */}
      <div className="designer-login-greeting">
        <p>안녕하세요,</p>
        <p>멍빗어 디자이너 입니다.</p>
      </div>

      {/* 에러 메시지 */}
      {error && <p className="designer-login-error">{error}</p>}

      {/* 입력 폼 배경 */}
      <div className="designer-login-form-bg">
        {!isSignUp ? (
          // 로그인 폼
          <>
            <label className="designer-login-label">이메일을 입력해주세요.</label>
            <input 
              type="email"
              className="designer-login-input"
              placeholder=""
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />

            <label className="designer-login-label">비밀번호를 입력해주세요.</label>
            <input 
              type="password"
              className="designer-login-input"
              placeholder=""
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </>
        ) : (
          // 회원가입 폼
          <>
            <label className="designer-login-label">미용사 이름</label>
            <input 
              type="text"
              className="designer-login-input"
              placeholder=""
              value={designerName}
              onChange={(e) => setDesignerName(e.target.value)}
              disabled={loading}
            />

            <label className="designer-login-label">이메일</label>
            <input 
              type="email"
              className="designer-login-input"
              placeholder=""
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />

            <label className="designer-login-label">비밀번호</label>
            <input 
              type="password"
              className="designer-login-input"
              placeholder=""
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />

            <label className="designer-login-label">비밀번호 재확인</label>
            <input 
              type="password"
              className="designer-login-input"
              placeholder=""
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              disabled={loading}
            />
          </>
        )}
      </div>

      {/* 로그인/회원가입 버튼 */}
      <div className="designer-login-button-container">
        <button 
          className="designer-login-button"
          onClick={isSignUp ? handleSignUp : handleLogin}
          disabled={loading}
        >
          <p className="designer-login-button-text">
            {loading ? '처리 중...' : (isSignUp ? '가입' : '로그인')}
          </p>
        </button>
      </div>

      {/* 로그인/회원가입 전환 링크 */}
      <div className="designer-login-toggle">
        <button 
          type="button"
          className="designer-login-toggle-btn"
          onClick={toggleMode}
        >
          {isSignUp ? '로그인' : '회원가입'}
        </button>
      </div>

      {/* 사용자 로그인 전환 */}
      <button 
        type="button"
        className="designer-login-user-btn"
        onClick={() => navigate('/login')}
      >
        사용자 로그인
      </button>
    </div>
  );
}
