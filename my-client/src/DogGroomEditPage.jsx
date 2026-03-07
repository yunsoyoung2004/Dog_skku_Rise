import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './firebase';
import { updateDog, getDog } from './services';
import './DogEditPage.css';

export default function DogGroomEditPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user] = useAuthState(auth);
  const [formData, setFormData] = useState({
    matting: '',
    coatQuality: '',
    shedding: '',
    environmentAdaptation: '',
    skinSensitivity: '',
    allergies: '',
    notes: ''
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
            matting: dog.matting ?? '',
            coatQuality: dog.coatQuality ?? '',
            shedding: dog.shedding ?? '',
            environmentAdaptation: dog.environmentAdaptation ?? '',
            skinSensitivity: dog.skinSensitivity ?? '',
            allergies: dog.allergies || '',
            notes: dog.notes || ''
          });
        }
      } catch (err) {
        console.error('강아지 미용 상태 로드 실패:', err);
        setError('강아지 미용 상태를 불러오지 못했습니다.');
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
      [name]: ['matting', 'coatQuality', 'shedding', 'environmentAdaptation', 'skinSensitivity'].includes(name)
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
    } catch (err) {
      console.error('미용 상태 저장 실패:', err);
      setError('저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dog-edit-page" data-node-id="dog-groom-edit">
      <div className="dog-edit-header">
        <button className="dog-edit-back-btn" onClick={() => navigate('/mypage')}>←</button>
        <h1>미용 상태 수정</h1>
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

      <div className="dog-edit-container">
        {error && (
          <div style={{ color: '#d32f2f', padding: '12px', margin: '12px 0', borderRadius: '6px', backgroundColor: '#ffebee' }}>
            {error}
          </div>
        )}

        <div className="dog-edit-form">
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
      </div>
    </div>
  );
}
