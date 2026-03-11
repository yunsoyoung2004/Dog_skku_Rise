import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './firebase';
import { updateDog, deleteDog, getDog } from './services';
import './DogEditPage.css';

export default function DogEditPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user] = useAuthState(auth);
  const [formData, setFormData] = useState({
    name: '',
    breed: '',
    age: '',
    gender: '',
    weight: '',
    notes: '',
    allergies: '',
    // 미용 관련 기본 성향 (프로필 기준 0~100)
    matting: '',                // 털 엉킴
    coatQuality: '',            // 모질
    shedding: '',               // 털 빠짐
    environmentAdaptation: '',  // 환경 적응도
    skinSensitivity: ''         // 피부 민감도
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const dogId = location.state?.dogId || 'default';

  useEffect(() => {
    const loadDogData = async () => {
      if (!user || !dogId) return;
      setLoading(true);
      try {
        const dog = await getDog(user.uid, dogId);
        if (dog) {
          setFormData({
            name: dog.name || '',
            breed: dog.breed || '',
            age: dog.age ?? '',
            gender: dog.gender || '',
            weight: dog.weight ?? '',
            notes: dog.notes || '',
            allergies: dog.allergies || '',
            matting: dog.matting ?? '',
            coatQuality: dog.coatQuality ?? '',
            shedding: dog.shedding ?? '',
            environmentAdaptation: dog.environmentAdaptation ?? '',
            skinSensitivity: dog.skinSensitivity ?? ''
          });
        }
      } catch (err) {
        console.error('강아지 데이터 로드 실패:', err);
        setError('강아지 정보를 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    };
    loadDogData();
  }, [user, dogId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ['weight', 'age', 'matting', 'coatQuality', 'shedding', 'environmentAdaptation', 'skinSensitivity']
        .includes(name)
        ? (value === '' ? '' : parseFloat(value))
        : value
    }));
  };

  const handleSave = async () => {
    setError('');
    if (!user) {
      setError('로그인이 필요합니다');
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      await updateDog(user.uid, dogId, formData);
      setIsEditing(false);
      console.log('✅ 강아지 정보 저장 완료');
    } catch (err) {
      console.error('❌ 강아지 정보 저장 실패:', err);
      setError('저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('강아지를 삭제하면 다시 등록해야 합니다. 그래도 삭제하시겠습니까?')) return;

    if (!user) {
      setError('로그인이 필요합니다');
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      console.log('🐶 강아지 삭제 시도:', { userId: user.uid, dogId });
      await deleteDog(user.uid, dogId);
      console.log('✅ 강아지 삭제 완료');
      navigate('/mypage');
    } catch (err) {
      console.error('❌ 강아지 삭제 실패:', err);
      setError('삭제에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dog-edit-page" data-node-id="dog-edit">
      {/* Header */}
      <div className="dog-edit-header">
        <button className="dog-edit-back-btn" onClick={() => navigate('/mypage')}>←</button>
        <h1>강아지 정보 수정</h1>
        {!isEditing && (
          <button className="dog-edit-toggle-btn" onClick={() => setIsEditing(true)}>
            수정
          </button>
        )}
        {isEditing && (
          <button className="dog-edit-save-btn" onClick={handleSave} style={{ color: '#222' }}>
            완료
          </button>
        )}
      </div>

      {/* Content */}
      <div className="dog-edit-container">
        {error && <div style={{ color: '#d32f2f', padding: '12px', margin: '12px 0', borderRadius: '6px', backgroundColor: '#ffebee' }}>{error}</div>}
        
        {/* Profile Picture */}
        <div className="dog-edit-profile">
          <div className="dog-edit-avatar">🐕</div>
          {isEditing && (
            <button className="dog-edit-photo-btn">
              📷 사진 변경
            </button>
          )}
        </div>

        {/* Form Fields */}
        <div className="dog-edit-form">
          {/* Name */}
          <div className="form-group">
            <label>이름</label>
            {isEditing ? (
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
              />
            ) : (
              <div className="form-value">{formData.name}</div>
            )}
          </div>

          {/* Breed */}
          <div className="form-group">
            <label>견종</label>
            {isEditing ? (
              <select name="breed" value={formData.breed} onChange={handleChange}>
                <option>푸들</option>
                <option>말티즈</option>
                <option>시추</option>
                <option>포메라니안</option>
                <option>요크셔테리어</option>
                <option>비숑</option>
                <option>골든리트리버</option>
                <option>라브라도</option>
              </select>
            ) : (
              <div className="form-value">{formData.breed}</div>
            )}
          </div>

          {/* Age */}
          <div className="form-group">
            <label>나이 (살)</label>
            {isEditing ? (
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
              />
            ) : (
              <div className="form-value">{formData.age}살</div>
            )}
          </div>

          {/* Gender */}
          <div className="form-group">
            <label>성별</label>
            {isEditing ? (
              <div className="radio-group">
                <label>
                  <input
                    type="radio"
                    name="gender"
                    value="male"
                    checked={formData.gender === 'male'}
                    onChange={handleChange}
                  />
                  수컷
                </label>
                <label>
                  <input
                    type="radio"
                    name="gender"
                    value="female"
                    checked={formData.gender === 'female'}
                    onChange={handleChange}
                  />
                  암컷
                </label>
              </div>
            ) : (
              <div className="form-value">{formData.gender === 'male' ? '수컷' : '암컷'}</div>
            )}
          </div>

          {/* Weight */}
          <div className="form-group">
            <label>체중 (kg)</label>
            {isEditing ? (
              <input
                type="number"
                step="0.1"
                name="weight"
                value={formData.weight}
                onChange={handleChange}
              />
            ) : (
              <div className="form-value">{formData.weight}kg</div>
            )}
          </div>

          {/* Grooming profile: 털 엉킴 */}
          <div className="form-group">
            <label>털 엉킴 (0~100)</label>
            {isEditing ? (
              <input
                type="number"
                name="matting"
                value={formData.matting}
                onChange={handleChange}
                placeholder="0 ~ 100"
              />
            ) : (
              <div className="form-value">
                {formData.matting !== '' && formData.matting != null ? `${formData.matting}` : '입력 없음'}
              </div>
            )}
          </div>

          {/* Grooming profile: 모질 */}
          <div className="form-group">
            <label>모질 (0~100)</label>
            {isEditing ? (
              <input
                type="number"
                name="coatQuality"
                value={formData.coatQuality}
                onChange={handleChange}
                placeholder="0 ~ 100"
              />
            ) : (
              <div className="form-value">
                {formData.coatQuality !== '' && formData.coatQuality != null ? `${formData.coatQuality}` : '입력 없음'}
              </div>
            )}
          </div>

          {/* Grooming profile: 털 빠짐 */}
          <div className="form-group">
            <label>털 빠짐 (0~100)</label>
            {isEditing ? (
              <input
                type="number"
                name="shedding"
                value={formData.shedding}
                onChange={handleChange}
                placeholder="0 ~ 100"
              />
            ) : (
              <div className="form-value">
                {formData.shedding !== '' && formData.shedding != null ? `${formData.shedding}` : '입력 없음'}
              </div>
            )}
          </div>

          {/* Grooming profile: 환경 적응도 */}
          <div className="form-group">
            <label>환경 적응도 (0~100)</label>
            {isEditing ? (
              <input
                type="number"
                name="environmentAdaptation"
                value={formData.environmentAdaptation}
                onChange={handleChange}
                placeholder="0 ~ 100"
              />
            ) : (
              <div className="form-value">
                {formData.environmentAdaptation !== '' && formData.environmentAdaptation != null
                  ? `${formData.environmentAdaptation}`
                  : '입력 없음'}
              </div>
            )}
          </div>

          {/* Grooming profile: 피부 민감도 */}
          <div className="form-group">
            <label>피부 민감도 (0~100)</label>
            {isEditing ? (
              <input
                type="number"
                name="skinSensitivity"
                value={formData.skinSensitivity}
                onChange={handleChange}
                placeholder="0 ~ 100"
              />
            ) : (
              <div className="form-value">
                {formData.skinSensitivity !== '' && formData.skinSensitivity != null
                  ? `${formData.skinSensitivity}`
                  : '입력 없음'}
              </div>
            )}
          </div>

          {/* Allergies */}
          <div className="form-group">
            <label>음식 알레르기</label>
            {isEditing ? (
              <input
                type="text"
                name="allergies"
                value={formData.allergies}
                onChange={handleChange}
                placeholder="예: 닭고기, 소금"
              />
            ) : (
              <div className="form-value">{formData.allergies || '없음'}</div>
            )}
          </div>

          {/* Notes */}
          <div className="form-group">
            <label>특이사항</label>
            {isEditing ? (
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="4"
              />
            ) : (
              <div className="form-value textarea-value">{formData.notes}</div>
            )}
          </div>
        </div>

        {/* Delete Button */}
        {!isEditing && (
          <button className="dog-delete-btn" onClick={handleDelete} disabled={loading}>
            {loading ? '삭제 중...' : '강아지 삭제'}
          </button>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="dog-edit-nav">
        <button onClick={() => navigate('/dashboard')}>🏠</button>
        <button onClick={() => navigate('/search')}>💼</button>
        <button onClick={() => navigate('/chat')}>💬</button>
        <button onClick={() => navigate('/mypage')}>👤</button>
      </div>
    </div>
  );
}
