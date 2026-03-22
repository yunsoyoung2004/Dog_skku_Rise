import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from './firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { uploadDesignerProfileImage, upsertDesignerPublicProfile } from './services';
import './DesignerPageNav.css';
import './DesignerPortfolioPage.css';
import DesignerNotificationButton from './components/DesignerNotificationButton';
import DesignerHeaderBrand from './components/DesignerHeaderBrand';

export default function DesignerPortfolioPage() {
  const navigate = useNavigate();
  const [user] = useAuthState(auth);
  const [values, setValues] = useState({
    name: '',
    photoURL: '',
    location: '',
    priceMin: '',
    priceMax: '',
    bio: '',
    portfolioIntro: '',
    announcements: '',
    paymentInfo: '',
    supportInfo: '',
  });
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/designer-login');
      return;
    }
    const load = async () => {
      try {
        const userRef = doc(db, 'users', user.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          const data = snap.data();
          setValues((prev) => ({
            ...prev,
            name: data.name || prev.name,
            photoURL: data.photoURL || prev.photoURL,
            location: data.location || prev.location,
            priceMin: data.priceMin?.toString() || prev.priceMin,
            priceMax: data.priceMax?.toString() || prev.priceMax,
            bio: data.bio || prev.bio,
            portfolioIntro: data.portfolioIntro || prev.portfolioIntro,
            announcements: data.announcements || prev.announcements,
            paymentInfo: data.paymentInfo || prev.paymentInfo,
            supportInfo: data.supportInfo || prev.supportInfo,
          }));
          if (data.photoURL) {
            setProfileImagePreview(data.photoURL);
          }
        }
      } catch (e) {
        console.error('포트폴리오 설정 로드 실패:', e);
      }
    };
    load();
  }, [user, navigate]);

  const handleImageChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setProfileImageFile(file);
    setProfileImagePreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setSavedMessage('');
    try {
      if (!values.location.trim()) {
        setSavedMessage('지역을 선택해 주세요. 설정하지 않으면 고객 화면에 위치가 비어 있게 표시됩니다.');
        setSaving(false);
        return;
      }
      if (!values.priceMin || !values.priceMax) {
        setSavedMessage('가격대를 선택해 주세요. 설정하지 않으면 고객 화면에 0원으로 표시됩니다.');
        setSaving(false);
        return;
      }

      const userRef = doc(db, 'users', user.uid);
      let photoURL = values.photoURL;

      if (profileImageFile) {
        try {
          const result = await uploadDesignerProfileImage(user.uid, profileImageFile);
          if (result && result.success) {
            photoURL = result.url;
          } else {
            throw new Error('프로필 사진 업로드 실패');
          }
        } catch (uploadError) {
          console.error('사진 업로드 오류:', uploadError);
          setSavedMessage(`사진 업로드 실패: ${uploadError.message}`);
          setSaving(false);
          setTimeout(() => setSavedMessage(''), 3000);
          return;
        }
      }

      const payload = {
        photoURL,
        location: values.location,
        priceMin: Number(values.priceMin),
        priceMax: Number(values.priceMax),
        bio: values.bio,
        portfolioIntro: values.portfolioIntro,
        announcements: values.announcements,
        paymentInfo: values.paymentInfo,
        supportInfo: values.supportInfo,
      };
      await updateDoc(userRef, payload);
      await upsertDesignerPublicProfile(user.uid, {
        name: values.name || user.displayName || '',
        location: values.location,
        priceMin: Number(values.priceMin),
        priceMax: Number(values.priceMax),
        photoURL,
        bio: values.bio,
        portfolioIntro: values.portfolioIntro,
        announcements: values.announcements,
        paymentInfo: values.paymentInfo,
        supportInfo: values.supportInfo,
      });
      setValues((prev) => ({ ...prev, photoURL }));
      setProfileImageFile(null);
      setSavedMessage('저장되었습니다.');
    } catch (e) {
      console.error('포트폴리오 설정 저장 실패:', e);
      setSavedMessage(`저장 중 오류가 발생했습니다: ${e.message}`);
    } finally {
      setSaving(false);
      setTimeout(() => setSavedMessage(''), 3000);
    }
  };

  return (
    <div className="designer-page">
      <div className="designer-page-header">
        <DesignerHeaderBrand />
        <h1>포트폴리오</h1>
        <div className="designer-header-right">
          <DesignerNotificationButton />
        </div>
      </div>

      <div className="designer-content designer-portfolio-page">
        <section className="portfolio-editor">
          <h2 className="portfolio-editor-title">프로필 사진 (선택)</h2>
          <p className="portfolio-editor-sub">프로필 상단에 노출될 디자이너 사진을 등록해 주세요. 등록하지 않아도 이용은 가능합니다.</p>
          <div className="portfolio-photo-upload">
            <div className="portfolio-photo-preview">
              {profileImagePreview || values.photoURL ? (
                <img
                  src={profileImagePreview || values.photoURL}
                  alt="프로필 미리보기"
                />
              ) : (
                <span className="portfolio-photo-placeholder">🐶</span>
              )}
            </div>
            <label className="portfolio-photo-button">
              사진 선택
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: 'none' }}
              />
            </label>
          </div>

          <h2 className="portfolio-editor-title">위치</h2>
          <p className="portfolio-editor-sub">고객에게 보여줄 작업 위치(동네, 시/구 등)를 입력해 주세요.</p>
            <select
              className="portfolio-editor-input"
              value={values.location}
              onChange={(e) => setValues({ ...values, location: e.target.value })}
            >
              <option value="">지역을 선택하세요</option>
              <option value="시도·전체">시도·전체</option>
              <option value="서울">서울</option>
              <option value="경기">경기</option>
              <option value="인천">인천</option>
              <option value="강원">강원</option>
              <option value="대전">대전</option>
              <option value="구/군·전체">구/군·전체</option>
              <option value="강남구">강남구</option>
              <option value="강북구">강북구</option>
              <option value="강서구">강서구</option>
              <option value="관악구">관악구</option>
              <option value="광진구">광진구</option>
              <option value="동·전체">동·전체</option>
              <option value="강남">강남</option>
              <option value="역삼동">역삼동</option>
              <option value="삼성동">삼성동</option>
              <option value="논현동">논현동</option>
              <option value="청담동">청담동</option>
            </select>
            <p className="portfolio-editor-hint">※ 지역을 선택하지 않으면 고객 화면에서 위치가 비어 보일 수 있어요.</p>

            <h2 className="portfolio-editor-title" style={{ marginTop: '16px' }}>가격대</h2>
            <p className="portfolio-editor-sub">대표 시술(미용) 기준 대략적인 가격대를 선택해 주세요.</p>
            <select
              className="portfolio-editor-input"
              value={values.priceMin}
              onChange={(e) => setValues({ ...values, priceMin: e.target.value })}
            >
              <option value="">최소 금액</option>
              <option value="30000">30,000원</option>
              <option value="40000">40,000원</option>
              <option value="50000">50,000원</option>
              <option value="60000">60,000원</option>
              <option value="70000">70,000원</option>
            </select>
            <select
              className="portfolio-editor-input"
              style={{ marginTop: '8px' }}
              value={values.priceMax}
              onChange={(e) => setValues({ ...values, priceMax: e.target.value })}
            >
              <option value="">최대 금액</option>
              <option value="60000">60,000원</option>
              <option value="70000">70,000원</option>
              <option value="80000">80,000원</option>
              <option value="90000">90,000원</option>
              <option value="100000">100,000원</option>
              <option value="120000">120,000원</option>
            </select>
            <p className="portfolio-editor-hint">※ 가격대를 입력하지 않으면 고객에게 0원으로 표시됩니다.</p>

          <h2 className="portfolio-editor-title" style={{ marginTop: '16px' }}>소개</h2>
          <p className="portfolio-editor-sub">디자이너님을 한눈에 알 수 있는 짧은 소개를 작성해 주세요.</p>
          <textarea
            className="portfolio-editor-textarea"
            value={values.bio}
            onChange={(e) => setValues({ ...values, bio: e.target.value })}
            placeholder="예) 5년 경력의 반려견 전문 미용사입니다. 아이 컨디션을 최우선으로 생각하며 천천히 작업합니다."
          />

          <h2 className="portfolio-editor-title" style={{ marginTop: '20px' }}>포트폴리오 소개 문구</h2>
          <p className="portfolio-editor-sub">프로필 상단에 노출될 포트폴리오 소개를 작성해 주세요.</p>
          <textarea
            className="portfolio-editor-textarea"
            value={values.portfolioIntro}
            onChange={(e) => setValues({ ...values, portfolioIntro: e.target.value })}
            placeholder="예) 우리 아이가 가장 편안한 순간을 담은 포트폴리오를 관리해 보세요."
          />

          <h2 className="portfolio-editor-title" style={{ marginTop: '20px' }}>공지사항 및 이벤트</h2>
          <p className="portfolio-editor-sub">진행 중인 공지 또는 이벤트 내용을 작성해 주세요.</p>
          <textarea
            className="portfolio-editor-textarea"
            value={values.announcements}
            onChange={(e) => setValues({ ...values, announcements: e.target.value })}
            placeholder="예) 3월 예약 고객 대상 발톱 관리 무료 제공"
          />

          <h2 className="portfolio-editor-title" style={{ marginTop: '20px' }}>결제수단 안내</h2>
          <p className="portfolio-editor-sub">사용 가능한 결제수단과 입금 계좌 정보를 남겨주세요.</p>
          <textarea
            className="portfolio-editor-textarea"
            value={values.paymentInfo}
            onChange={(e) => setValues({ ...values, paymentInfo: e.target.value })}
            placeholder="예) 계좌이체 / 카드결제 가능, 국민 000000-00-000000"
          />

          <h2 className="portfolio-editor-title" style={{ marginTop: '20px' }}>문의 및 고객센터</h2>
          <p className="portfolio-editor-sub">문의 가능한 연락처와 응답 가능 시간을 안내해 주세요.</p>
          <textarea
            className="portfolio-editor-textarea"
            value={values.supportInfo}
            onChange={(e) => setValues({ ...values, supportInfo: e.target.value })}
            placeholder="예) 카카오톡 채널 @멍빗어 / 평일 10:00–18:00"
          />

          <div className="portfolio-editor-actions">
            <button
              type="button"
              className="portfolio-save-button"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? '저장 중...' : '저장하기'}
            </button>
          </div>
          {savedMessage && (
            <div className="portfolio-save-message">{savedMessage}</div>
          )}
        </section>
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
