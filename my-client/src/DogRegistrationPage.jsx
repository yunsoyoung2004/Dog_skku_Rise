import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './firebase';
import { addDog, uploadDogImage } from './services';
import PageLayout from './PageLayout';
import './DogRegistrationPage.css';

export default function DogRegistrationPage() {
  const [user] = useAuthState(auth);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [dogData, setDogData] = useState({
    name: '',
    breed: '',
    weight: '',
    sex: '',
    notes: '',
    // 미용 관련 기본 성향(강아지 프로필 기준)
    matting: '',                // 털 엉킴 (0~100, 게이지)
    coatQuality: '',            // 모질 (0~100, 게이지)
    shedding: '',               // 털 빠짐 (0~100, 게이지)
    environmentAdaptation: '',  // 환경 적응도 (0~100, 게이지)
    skinSensitivity: ''         // 피부 민감도 (0~100, 게이지)
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [showBreedModal, setShowBreedModal] = useState(false);
  const [error, setError] = useState('');
  const [healthInfo, setHealthInfo] = useState({
    skinSensitivity: '',
    skinDisease: '',
    skinDiseaseDetail: '',
    biting: '',
    notes: ''
  });
  const [vaccinationInfo, setVaccinationInfo] = useState({
    combo: false,
    corona: false,
    kennelCough: false,
    influenza: false,
    rabies: false,
    other: ''
  });
  const navigate = useNavigate();

  const dogBreeds = ['스피츠', '말티즈', '풍산개', '진돗개', '포메라니안', '요크셔테리어', '시즈우'];
  const sexOptions = ['수컷', '암컷'];

  const handleBreedSelect = (breed) => {
    setDogData({ ...dogData, breed });
    setShowBreedModal(false);
  };

  const handleSexSelect = (sex) => {
    setDogData({ ...dogData, sex });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setDogData({ ...dogData, [name]: value });
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('이미지 파일만 선택 가능합니다');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('파일 크기는 5MB 이하여야 합니다');
        return;
      }
      setImageFile(file);
      setError('');
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleHealthChange = (field, value) => {
    setHealthInfo((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleVaccineToggle = (field) => {
    setVaccinationInfo((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleVaccineOtherChange = (e) => {
    const { value } = e.target;
    setVaccinationInfo((prev) => ({
      ...prev,
      other: value,
    }));
  };

  const handleNext = async () => {
    if (loading) return;
    setError('');
    
    if (step === 1) {
      if (!dogData.name || !dogData.breed || !dogData.weight || !dogData.sex) {
        setError('모든 필드를 입력해주세요');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      // 미용 성향(게이지) 5개는 필수 입력
      const metricKeys = ['matting', 'coatQuality', 'shedding', 'environmentAdaptation', 'skinSensitivity'];
      const missing = metricKeys.some((k) => dogData[k] === '' || dogData[k] === null);
      if (missing) {
        setError('털 상태 / 환경 적응도 게이지를 모두 설정해주세요');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (!user) {
        setError('로그인이 필요합니다');
        navigate('/login');
        return;
      }

      setLoading(true);
      try {
        let imageUrl = '';
        
        const result = await addDog(user.uid, {
          name: dogData.name,
          breed: dogData.breed,
          weight: parseFloat(dogData.weight),
          sex: dogData.sex,
          // 강아지 기본 미용 성향 (0~100 스코어)
          matting: dogData.matting !== '' ? parseFloat(dogData.matting) : null,
          coatQuality: dogData.coatQuality !== '' ? parseFloat(dogData.coatQuality) : null,
          shedding: dogData.shedding !== '' ? parseFloat(dogData.shedding) : null,
          environmentAdaptation:
            dogData.environmentAdaptation !== '' ? parseFloat(dogData.environmentAdaptation) : null,
          skinSensitivity: dogData.skinSensitivity !== '' ? parseFloat(dogData.skinSensitivity) : null,
          notes: healthInfo.notes || '',
          healthInfo,
          vaccinationInfo,
          registeredAt: new Date().toISOString()
        });

        if (!result.success) {
          throw new Error('강아지 등록 실패');
        }

        if (imageFile) {
          try {
            const uploadResult = await uploadDogImage(user.uid, result.dogId, imageFile);
            if (uploadResult.success) {
              imageUrl = uploadResult.url;
            }
          } catch (imgErr) {
            console.warn('이미지 업로드 실패:', imgErr);
          }
        }

        console.log('✅ 강아지 등록 완료:', result.dogId);
        navigate('/dog-registration-complete');
      } catch (err) {
        console.error('❌ 강아지 등록 실패:', err);
        const message = err && err.message ? err.message : '강아지 등록에 실패했습니다. 다시 시도해주세요.';
        setError(message);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <PageLayout title="멍빗어">
      {/* Greeting */}
      <div className="dog-registration-greeting">
        <p>우리집 강아지 등록하기</p>
      </div>

      {/* Content */}
      <div className="dog-registration-container">
        {step === 1 && (
          <div className="dog-registration-form">
            <div className="photo-upload-box">
              <input
                type="file"
                id="photo-input"
                className="photo-input"
                accept="image/*"
                onChange={handleImageSelect}
              />
              <label htmlFor="photo-input" className="photo-upload-label">
                <div className="photo-upload-icon">+</div>
                <p>사진 등록하기</p>
                <span>(최근 한 달 사진으로 등록해주세요)</span>
              </label>
            </div>

            <div className="dog-form-group">
              <label>강아지 이름</label>
              <input
                type="text"
                name="name"
                value={dogData.name}
                onChange={handleInputChange}
                placeholder="강아지 이름을 입력하세요"
                className="dog-form-input"
              />
            </div>

            <div className="dog-form-group">
              <label>견종</label>
              <button
                type="button"
                className="dog-form-select"
                onClick={() => setShowBreedModal(true)}
              >
                {dogData.breed || '품종을 선택하세요'}
                <span>›</span>
              </button>
            </div>

            <div className="dog-form-group">
              <label>나이</label>
              <input
                type="text"
                name="weight"
                value={dogData.weight}
                onChange={handleInputChange}
                placeholder="나이를 입력하세요"
                className="dog-form-input"
              />
            </div>

            <div className="dog-form-group">
              <label>성별</label>
              <div className="dog-sex-options">
                {sexOptions.map((sex) => (
                  <button
                    key={sex}
                    type="button"
                    className={`dog-sex-btn ${dogData.sex === sex ? 'active' : ''}`}
                    onClick={() => handleSexSelect(sex)}
                  >
                    {sex}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="dog-health-card">
            {/* 미용 성향 (강아지 기본값) */}
            <div className="dog-health-group">
              <p className="dog-health-label">털 상태 / 환경 적응도 (0~100)</p>
              <div className="dog-health-options vertical">
                <div className="dog-health-metric-row">
                  <span>털 엉킴</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    name="matting"
                    value={dogData.matting === '' ? 50 : dogData.matting}
                    onChange={handleInputChange}
                    className="dog-health-slider"
                  />
                  <span className="dog-health-slider-value">{dogData.matting === '' ? 50 : dogData.matting}</span>
                </div>
                <div className="dog-health-metric-row">
                  <span>모질</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    name="coatQuality"
                    value={dogData.coatQuality === '' ? 50 : dogData.coatQuality}
                    onChange={handleInputChange}
                    className="dog-health-slider"
                  />
                  <span className="dog-health-slider-value">{dogData.coatQuality === '' ? 50 : dogData.coatQuality}</span>
                </div>
                <div className="dog-health-metric-row">
                  <span>털 빠짐</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    name="shedding"
                    value={dogData.shedding === '' ? 50 : dogData.shedding}
                    onChange={handleInputChange}
                    className="dog-health-slider"
                  />
                  <span className="dog-health-slider-value">{dogData.shedding === '' ? 50 : dogData.shedding}</span>
                </div>
                <div className="dog-health-metric-row">
                  <span>환경 적응도</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    name="environmentAdaptation"
                    value={dogData.environmentAdaptation === '' ? 50 : dogData.environmentAdaptation}
                    onChange={handleInputChange}
                    className="dog-health-slider"
                  />
                  <span className="dog-health-slider-value">{dogData.environmentAdaptation === '' ? 50 : dogData.environmentAdaptation}</span>
                </div>
                <div className="dog-health-metric-row">
                  <span>피부 민감도</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    name="skinSensitivity"
                    value={dogData.skinSensitivity === '' ? 50 : dogData.skinSensitivity}
                    onChange={handleInputChange}
                    className="dog-health-slider"
                  />
                  <span className="dog-health-slider-value">{dogData.skinSensitivity === '' ? 50 : dogData.skinSensitivity}</span>
                </div>
              </div>
            </div>

            <div className="dog-health-group">
              <p className="dog-health-label">피부 민감도 (설명)</p>
              <div className="dog-health-options">
                {['보통', '약간 민감', '매우 민감'].map((label) => (
                  <button
                    key={label}
                    type="button"
                    className={`dog-health-option ${healthInfo.skinSensitivity === label ? 'active' : ''}`}
                    onClick={() => handleHealthChange('skinSensitivity', label)}
                  >
                    <span className="dog-health-radio" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="dog-health-group">
              <p className="dog-health-label">피부 질환 여부</p>
              <div className="dog-health-options vertical">
                <button
                  type="button"
                  className={`dog-health-option ${healthInfo.skinDisease === '있음' ? 'active' : ''}`}
                  onClick={() => handleHealthChange('skinDisease', '있음')}
                >
                  <span className="dog-health-radio" />
                  <span>
                    있음 (피부 질환명: {healthInfo.skinDiseaseDetail || '__________'})
                  </span>
                </button>
                {healthInfo.skinDisease === '있음' && (
                  <input
                    type="text"
                    className="dog-health-input-inline"
                    placeholder="피부 질환명을 입력해주세요"
                    value={healthInfo.skinDiseaseDetail}
                    onChange={(e) => handleHealthChange('skinDiseaseDetail', e.target.value)}
                  />
                )}
                <button
                  type="button"
                  className={`dog-health-option ${healthInfo.skinDisease === '없음' ? 'active' : ''}`}
                  onClick={() => handleHealthChange('skinDisease', '없음')}
                >
                  <span className="dog-health-radio" />
                  <span>없음</span>
                </button>
              </div>
            </div>

            <div className="dog-health-group">
              <p className="dog-health-label">입질 여부</p>
              <div className="dog-health-options">
                {['없음', '가끔 있음', '심함'].map((label) => (
                  <button
                    key={label}
                    type="button"
                    className={`dog-health-option ${healthInfo.biting === label ? 'active' : ''}`}
                    onClick={() => handleHealthChange('biting', label)}
                  >
                    <span className="dog-health-radio" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="dog-health-group">
              <p className="dog-health-label">기타 지병 및 주의사항</p>
              <textarea
                className="dog-health-textarea"
                placeholder="특이 사항이 있다면 적어주세요"
                value={healthInfo.notes}
                onChange={(e) => handleHealthChange('notes', e.target.value)}
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="dog-vaccine-card">
            <p className="dog-health-label">예방 접종</p>
            <p className="dog-vaccine-sub">1년 내 접종한 백신을 모두 선택해주세요.</p>
            <div className="dog-vaccine-list">
              <label className="dog-vaccine-item">
                <input
                  type="checkbox"
                  checked={vaccinationInfo.combo}
                  onChange={() => handleVaccineToggle('combo')}
                />
                <span>종합 백신</span>
              </label>
              <label className="dog-vaccine-item">
                <input
                  type="checkbox"
                  checked={vaccinationInfo.corona}
                  onChange={() => handleVaccineToggle('corona')}
                />
                <span>코로나 장염 백신</span>
              </label>
              <label className="dog-vaccine-item">
                <input
                  type="checkbox"
                  checked={vaccinationInfo.kennelCough}
                  onChange={() => handleVaccineToggle('kennelCough')}
                />
                <span>켄넬코프</span>
              </label>
              <label className="dog-vaccine-item">
                <input
                  type="checkbox"
                  checked={vaccinationInfo.influenza}
                  onChange={() => handleVaccineToggle('influenza')}
                />
                <span>신종인플루엔자</span>
              </label>
              <label className="dog-vaccine-item">
                <input
                  type="checkbox"
                  checked={vaccinationInfo.rabies}
                  onChange={() => handleVaccineToggle('rabies')}
                />
                <span>광견병</span>
              </label>
              <div className="dog-vaccine-item other">
                <span>기타:</span>
                <input
                  type="text"
                  className="dog-health-input-inline"
                  placeholder="기타 접종명을 입력해주세요"
                  value={vaccinationInfo.other}
                  onChange={handleVaccineOtherChange}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Next Button */}
      {error && (
        <div className="dog-registration-error">
          {error}
        </div>
      )}
      <div className="dog-registration-footer">
        <button className="dog-registration-next-btn" onClick={handleNext} disabled={loading}>
          {step < 3 ? `다음 (${step}/3)` : '완료'}
        </button>
      </div>

      {/* Breed Modal */}
      {showBreedModal && (
        <div className="breed-modal-overlay" onClick={() => setShowBreedModal(false)}>
          <div className="breed-modal" onClick={(e) => e.stopPropagation()}>
            <h3>견종 선택</h3>
            <div className="breed-list">
              {dogBreeds.map((breed) => (
                <button
                  key={breed}
                  className="breed-item"
                  onClick={() => handleBreedSelect(breed)}
                >
                  {breed}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
