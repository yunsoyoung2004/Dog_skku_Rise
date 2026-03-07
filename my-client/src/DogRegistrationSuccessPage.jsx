import { useNavigate } from 'react-router-dom';
import PageLayout from './PageLayout';
import './DogRegistrationSuccessPage.css';

export default function DogRegistrationSuccessPage() {
  const navigate = useNavigate();

  const handleNext = () => {
    navigate('/quote-request');
  };

  return (
    <PageLayout title="멍빗어">
      <div className="dog-registration-success-page" data-node-id="503:1293">
        {/* Content */}
        <div className="success-content">
          <div className="success-icon">✓</div>
          <h2>강아지 등록이 완료되었습니다!</h2>
          <p>이제 디자이너에게 견적서를 요청할 수 있습니다.</p>
        </div>

        {/* Action Button */}
        <div className="success-footer">
          <button className="success-btn" onClick={handleNext}>
            견적서 보내러 가기
          </button>
        </div>
      </div>
    </PageLayout>
  );
}
