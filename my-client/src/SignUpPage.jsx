import './SignUpPage.css';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import { auth, db } from './firebase';

const img2 = "https://www.figma.com/api/mcp/asset/79118139-4029-4aea-b28d-90db843c35d7";

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    nickname: '',
    email: '',
    password: '',
    passwordConfirm: '',
    phone: '',
    termsAgreed: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showTermsModal, setShowTermsModal] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setError('');
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');

    // 유효성 검사
    if (!formData.termsAgreed) {
      setError('이용약관에 동의해주세요.');
      return;
    }

    if (!formData.nickname || !formData.email || !formData.password || !formData.passwordConfirm || !formData.phone) {
      setError('모든 필드를 입력해주세요.');
      return;
    }

    if (formData.password !== formData.passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (formData.password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('유효한 이메일 주소를 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      // Firebase 계정 생성
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      const user = userCredential.user;

      // 사용자 프로필 업데이트
      await updateProfile(user, {
        displayName: formData.nickname
      });

      // Firestore에 추가 사용자 정보 저장 (일반 사용자)
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        nickname: formData.nickname,
        email: formData.email,
        phone: formData.phone,
        role: 'user',
        createdAt: new Date(),
      });

      console.log('✅ 회원가입 성공:', user.email);
      alert('회원가입이 완료되었습니다!');
      navigate('/');
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

  return (
    <div className="signup-page" data-name="회원가입" data-node-id="405:3339">
      {/* 로고 */}
      <button 
        className="signup-logo-container signup-logo-button"
        onClick={() => navigate('/')}
        title="로그인페이지로 돌아가기"
        data-node-id="405:3396"
      >
        <img alt="멍빗어 로고" className="signup-logo-img" src={img2} />
      </button>

      {/* 인사말 */}
      <div className="signup-greeting" data-node-id="405:3421">
        <p>안녕하세요,</p>
        <p>멍빗어 입니다.</p>
      </div>

      {/* 에러 메시지 */}
      {error && <p className="signup-error">{error}</p>}

      {/* 닉네임 입력 */}
      <div className="signup-input-box" data-node-id="405:3393">
        <label className="signup-label" data-node-id="405:3398">닉네임</label>
        <input 
          type="text" 
          className="signup-input"
          name="nickname"
          placeholder="닉네임을 입력해주세요"
          value={formData.nickname}
          onChange={handleInputChange}
          disabled={loading}
        />
      </div>

      {/* 이메일 입력 */}
      <div className="signup-input-box" data-node-id="405:3400">
        <label className="signup-label" data-node-id="405:3402">이메일</label>
        <input 
          type="email" 
          className="signup-input"
          name="email"
          placeholder="example@email.com"
          value={formData.email}
          onChange={handleInputChange}
          disabled={loading}
        />
      </div>

      {/* 비밀번호 입력 */}
      <div className="signup-input-box" data-node-id="405:3403">
        <label className="signup-label" data-node-id="405:3405">비밀번호</label>
        <input 
          type="password" 
          className="signup-input"
          name="password"
          placeholder="6자 이상 입력해주세요"
          value={formData.password}
          onChange={handleInputChange}
          disabled={loading}
        />
      </div>

      {/* 비밀번호 재확인 */}
      <div className="signup-input-box" data-node-id="405:3406">
        <label className="signup-label" data-node-id="405:3408">비밀번호 재확인</label>
        <input 
          type="password" 
          className="signup-input"
          name="passwordConfirm"
          placeholder="비밀번호를 다시 입력해주세요"
          value={formData.passwordConfirm}
          onChange={handleInputChange}
          disabled={loading}
        />
      </div>

      {/* 전화번호 입력 */}
      <div className="signup-input-box" data-node-id="405:3409">
        <label className="signup-label" data-node-id="405:3411">전화번호</label>
        <input 
          type="tel" 
          className="signup-input"
          name="phone"
          placeholder="010-1234-5678"
          value={formData.phone}
          onChange={handleInputChange}
          disabled={loading}
        />
      </div>

      {/* 약관 동의 */}
      <label className="signup-terms-label">
        <input 
          type="checkbox" 
          id="terms-agree"
          className="signup-terms-input"
          name="termsAgreed"
          checked={formData.termsAgreed}
          onChange={handleInputChange}
        />
        <div className="signup-terms-checkbox"></div>
        <span>
          <button 
            type="button"
            className="signup-terms-link"
            onClick={() => setShowTermsModal(true)}
          >
            이용약관
          </button>
          에 모두 동의합니다.
        </span>
      </label>

      {/* 다음 버튼 */}
      <div className="signup-button-container" data-node-id="405:3395">
        <button 
          className="signup-button" 
          onClick={handleSignUp} 
          disabled={loading}
          data-node-id="405:3386"
        >
          <p className="signup-button-text" data-node-id="405:3388">
            {loading ? '가입 중...' : '가입'}
          </p>
        </button>
      </div>

      {/* 이용약관 모달 */}
      {showTermsModal && (
        <div className="signup-terms-modal-overlay" onClick={() => setShowTermsModal(false)}>
          <div className="signup-terms-modal" onClick={(e) => e.stopPropagation()}>
            <button 
              className="signup-terms-modal-close"
              onClick={() => setShowTermsModal(false)}
            >
              ✕
            </button>
            <h2 className="signup-terms-modal-title">이용약관</h2>
            <div className="signup-terms-modal-content">
              <h3>제1조 (목적)</h3>
              <p>본 약관은 멍빗어(이하 "회사")가 제공하는 애완견 미용 서비스 및 관련 플랫폼(이하 "서비스")의 이용과 관련하여 회사와 이용자의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.</p>

              <h3>제2조 (용어의 정의)</h3>
              <p>① 이용자: 본 약관에 따라 회사가 제공하는 서비스를 이용하는 개인 또는 단체</p>
              <p>② 디자이너: 회사의 플랫폼을 통해 애완견 미용 서비스를 제공하는 전문가</p>
              <p>③ 예약: 이용자가 디자이너를 선택하여 미용 서비스를 신청하는 행위</p>
              <p>④ 견종: 애완견의 종류 및 특성</p>

              <h3>제3조 (서비스 제공)</h3>
              <p>회사는 다음과 같은 서비스를 제공합니다:</p>
              <p>- 미용 디자이너 검색 및 정보 제공</p>
              <p>- 예약 및 결제 시스템</p>
              <p>- 채팅 및 상담 기능</p>
              <p>- 리뷰 및 평가 시스템</p>
              <p>- 고객 지원 및 기술 지원</p>

              <h3>제4조 (이용자의 의무)</h3>
              <p>이용자는 다음을 준수해야 합니다:</p>
              <p>① 타인의 개인정보를 도용하거나 유포하는 행위</p>
              <p>② 불법적인 목적으로 서비스를 이용하는 행위</p>
              <p>③ 서비스 운영을 방해하는 행위</p>
              <p>④ 저작권, 초상권, 명예권 등을 침해하는 행위</p>

              <h3>제5조 (개인정보보호)</h3>
              <p>회사는 『개인정보보호법』 및 『정보통신망 이용 촉진 및 정보보호 등에 관한 법률』에 따라 이용자의 개인정보를 보호합니다. 자세한 내용은 개인정보처리방침을 참고하시기 바랍니다.</p>

              <h3>제6조 (약관의 변경)</h3>
              <p>회사는 필요한 경우 약관을 변경할 수 있으며, 변경된 약관은 공지 후 효력이 발생합니다. 이용자가 변경된 약관에 동의하지 않으면 서비스 이용을 중단할 수 있습니다.</p>

              <h3>제7조 (회사의 책임 제한)</h3>
              <p>회사는 다음의 경우 서비스 제공의 책임을 지지 않습니다:</p>
              <p>① 천재지변 또는 불가항력적인 사유로 인한 서비스 중단</p>
              <p>② 이용자의 귀책사유로 인한 손해</p>
              <p>③ 이용자 간 거래에서의 분쟁</p>

              <h3>제8조 (분쟁해결)</h3>
              <p>본 약관과 관련된 분쟁은 대한민국 법을 적용하며, 관할 법원은 회사의 본사 소재지를 관할하는 법원으로 합의합니다.</p>

              <h3>제9조 (기타)</h3>
              <p>본 약관에 규정하지 않은 사항은 관계 법령에 따릅니다. 본 약관의 일부 조항이 무효인 경우, 나머지 조항의 효력은 영향을 받지 않습니다.</p>

              <p className="signup-terms-modal-footer">시행일: 2024년 1월 1일</p>
            </div>
            <button 
              className="signup-terms-modal-confirm"
              onClick={() => setShowTermsModal(false)}
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
