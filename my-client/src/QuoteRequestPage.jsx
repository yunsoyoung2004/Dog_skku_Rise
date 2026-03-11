import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './firebase';
import { createQuoteRequest, getUserDogs, sendMessage, createNotification } from './services';
import './QuoteRequestPage.css';

const logoImg = "/vite.svg";

export default function QuoteRequestPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user] = useAuthState(auth);
  const [step, setStep] = useState(0);
  const [dogs, setDogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDogId, setSelectedDogId] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');

  const { designerId, designerName, originalRequest, roomId, fromChat } = location.state || {};

  const [quoteData, setQuoteData] = useState({
    knowledge: '', // 미용 진행 장소 (집, 샵, 둘 다 상관 없어요)
    groomingStyle: '', // 미용 방식 (기계컷, 가위컷, 잘 모르겠어요)
    additionalGrooming: [], // 추가 미용 (다중 선택)
    additionalOptions: [], // 추가 사항 (다중 선택)
    dogTags: [], // 강아지 태그 (다중 선택)
    preferredDate: '', // 희망 일정 (날짜)
    preferredTime: '', // 희망 시간
    notes: '', // 추가 사항 텍스트
  });

  useEffect(() => {
    if (user) loadUserDogs();
  }, [user]);

  // 수정하기로 들어온 경우, 기존 견적 데이터를 초기값으로 세팅
  useEffect(() => {
    if (originalRequest) {
      setQuoteData((prev) => ({
        ...prev,
        knowledge: originalRequest.knowledge || '',
        groomingStyle: originalRequest.groomingStyle || '',
        additionalGrooming: originalRequest.additionalGrooming || [],
        additionalOptions: originalRequest.additionalOptions || [],
        dogTags: originalRequest.dogTags || [],
        preferredDate: originalRequest.preferredDate || '',
        preferredTime: originalRequest.preferredTime || '',
        notes: originalRequest.notes || '',
      }));
      if (originalRequest.dogId) {
        setSelectedDogId(originalRequest.dogId);
      }
    }
  }, [originalRequest]);

  const loadUserDogs = async () => {
    if (!user) return;
    try {
      const userDogs = await getUserDogs(user.uid);
      setDogs(userDogs);
    } catch (err) {
      console.error('강아지 로드 실패:', err);
    }
  };

  // Step 0: 미용 진행 장소
  const knowledgeOptions = ['집', '샵', '둘 다 상관 없어요'];

  // Step 1: 미용 방식
  const groomingStyles = [
    '기계컷 (짧고 깔끔)',
    '가위컷 (스타일 중심)',
    '잘 모르겠어요 (미용사와 상의하기)'
  ];

  // Step 2: 추가 미용
  const additionalGroomingOptions = [
    '스피',
    '밤나더/왕문미용',
    '귀청소',
    '암지/지석 관리',
    '밤을 끼기'
  ];

  // Step 3: 추가 사항
  const additionalOptionsChoices = [
    '입찰되 사용 가능',
    '주차 가능',
    '짧기 분여를 사용 가능',
    '미용시 보호조가 되번되지 않아요',
    '미용시 보호조가 되번해요'
  ];

  // Step 5: 강아지 태그
  const dogTagOptions = [
    '알러지', '우울증', '불안감', '예민함',
    '공격성', '낯선이', '높음', '낮음'
  ];

  // Step 6: 선호 시간
  const timeSlots = [
    '9시', '10시', '11시', '12시',
    '12시', '1시', '2시', '3시'
  ];

  const handleKnowledgeSelect = (knowledge) => {
    setQuoteData({ ...quoteData, knowledge });
  };

  const handleGroomingStyleSelect = (style) => {
    setQuoteData({ ...quoteData, groomingStyle: style });
  };

  const handleAdditionalGroomingToggle = (option) => {
    const updated = quoteData.additionalGrooming.includes(option)
      ? quoteData.additionalGrooming.filter(g => g !== option)
      : [...quoteData.additionalGrooming, option];
    setQuoteData({ ...quoteData, additionalGrooming: updated });
  };

  const handleAdditionalOptionsToggle = (option) => {
    const updated = quoteData.additionalOptions.includes(option)
      ? quoteData.additionalOptions.filter(o => o !== option)
      : [...quoteData.additionalOptions, option];
    setQuoteData({ ...quoteData, additionalOptions: updated });
  };

  const handleDogTagToggle = (tag) => {
    const updated = quoteData.dogTags.includes(tag)
      ? quoteData.dogTags.filter(t => t !== tag)
      : [...quoteData.dogTags, tag];
    setQuoteData({ ...quoteData, dogTags: updated });
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotoPreview(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNext = () => {
    setStep(step + 1);
  };

  const handleSubmit = async () => {
    if (!selectedDogId) {
      alert('강아지를 선택해주세요');
      return;
    }

    if (!designerId) {
      alert('견적서를 보낼 디자이너를 선택해 주세요.');
      navigate('/designers');
      return;
    }

    setLoading(true);
    try {
      console.log('\\n========== [상세 견적 요청 제출 - QuoteRequestPage] ==========');
      console.log('📝 [1] 제출 시작:', { 
        userId: user.uid,
        roomId, 
        designerId, 
        selectedDogId,
        stepInfo: quoteData
      });
      
      const selectedDog = dogs.find((d) => d.id === selectedDogId) || {};
      console.log('🐕 [2] 강아지 정보:', { 
        dogId: selectedDogId,
        name: selectedDog.name,
        breed: selectedDog.breed,
        weight: selectedDog.weight
      });

      console.log('📤 [3] createQuoteRequest 호출 중...');
      const result = await createQuoteRequest(user.uid, designerId, {
        designerName: designerName || '',
        dogId: selectedDogId,
        dogName: selectedDog.name || '',
        breed: selectedDog.breed || '',
        weight: selectedDog.weight,
        // 채팅에서 온 경우, 해당 채팅방 ID를 함께 저장해 이후 견적/예약과 연결
        roomId: roomId || '',
        quoteData: quoteData,
      });
      
      console.log('✅ [4] createQuoteRequest 완료:', { 
        success: result?.success,
        quoteRequestId: result?.quoteId,
        message: result?.message,
        timestamp: new Date().toISOString()
      });

      // 디자이너에게 견적 요청 알림 생성
      try {
        await createNotification(designerId, {
          title: '새 견적 요청이 도착했어요',
          message: `${selectedDog.name || '반려견'} 견적 요청이 도착했습니다.`,
          type: 'quote',
          chatRoomId: roomId || '',
          quoteRequestId: result?.quoteId || '',
        });
      } catch (e) {
        console.warn('견적 요청 알림 생성 실패(무시 가능):', e);
      }
      
      // 견적 요청이 성공하면, 전역 이벤트를 쏴서 헤더 배지(견적 카운트) 즉시 갱신
      try {
        console.log('📣 [QuoteRequestPage] quoteRequestCompleted 이벤트 디스패치:', {
          userId: user?.uid,
          designerId,
          quoteRequestId: result?.quoteId
        });
        window.dispatchEvent(
          new CustomEvent('quoteRequestCompleted', {
            detail: {
              userId: user?.uid,
              designerId,
              quoteRequestId: result?.quoteId,
            },
          })
        );
      } catch (e) {
        console.warn('⚠️  quoteRequestCompleted 이벤트 디스패치 실패(무시 가능):', e);
      }

      // 채팅방에서 온 견적 요청이라면, 채팅방에도 시스템 메시지로 확실히 남겨줌
      // (quoteId 유무와 상관없이 메시지는 항상 기록)
      if (roomId && result?.success && user) {
        console.log('\n💬 [5] 채팅방 메시지 전송 시작...');
        const systemMessage = {
          senderId: user.uid,
          senderType: 'user',
          text: '견적을 보냈습니다.',
          isSystemMessage: true,
          messageType: 'quoteRequest',
          quoteRequestId: result?.quoteId || null,
          timestamp: new Date().toISOString(),
        };

        try {
          console.log('📤 [6] sendMessage 호출:', { 
            roomId, 
            messageType: systemMessage.messageType,
            quoteRequestId: result.quoteId
          });
          await sendMessage(roomId, systemMessage);
          console.log('✅ [7] 채팅 메시지 Firestore 저장 완료');
          console.log('========== [✅ 상세 견적 요청 완료] ==========' );
        } catch (e) {
          console.warn('⚠️  견적 요청 채팅 메시지 기록 실패(무시 가능):', e);
        }
      } else {
        console.warn('⚠️  [8] 채팅 메시지 스킵:', { 
          hasRoomId: !!roomId,
          success: result?.success, 
          hasQuoteId: !!result?.quoteId,
          hasUser: !!user,
          skipReason: !roomId ? '채팅방 없음' : !result?.success ? '생성 실패' : !result?.quoteId ? '견적ID 없음' : '알려지지 않음'
        });
        console.log('========== [⚠️  견적 생성은 성공했으나 채팅 메시지는 스킵] ==========\n');
      }
      // 채팅에서 온 견적 요청이라면, 완료 후 바로 채팅방으로 돌아가서
      // "견적을 보냈습니다." 메시지와 변경된 배너를 바로 볼 수 있게 한다.
      if (fromChat && roomId) {
        navigate(`/chat/${roomId}`);
        return;
      }

      setStep(7); // 그 외의 경우에는 완료 단계로 이동
    } catch (err) {
      console.error('👹 견적 요청 실패:', err);
      alert('견적 요청에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
    else navigate(-1);
  };

  const goHome = () => {
    navigate('/dashboard');
  };

  return (
    <div className="quote-request-page">
      {/* Header */}
      <div className="quote-request-header">
        <div className="quote-request-logo">
          <img src={logoImg} alt="멍빗어" className="logo-img" />
          <span className="logo-text">멍빗어</span>
        </div>
        {designerName && (
          <div className="quote-request-designer-label">
            <span className="label">→</span>
            <span className="name">{designerName}</span>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="quote-request-content">
        {/* Step 0: 미용 진행 장소 */}
        {step === 0 && (
          <div className="quote-step">
            <div className="quote-step-header">
              <button className="back-btn" onClick={handleBack}>←</button>
              <h2 className="quote-step-title">견적서 요청하기</h2>
            </div>
            <div className="quote-step-question">어디서 미용을 진행할까요?</div>
            <div className="quote-options">
              {knowledgeOptions.map((option, idx) => (
                <button
                  key={idx}
                  className={`quote-option-btn ${quoteData.knowledge === option ? 'active' : ''}`}
                  onClick={() => handleKnowledgeSelect(option)}
                >
                  {option}
                </button>
              ))}
            </div>
            <div className="quote-step-subsection">
              <div className="quote-step-question" style={{ marginTop: '24px' }}>
                어떤 강아지에 대한 미용인가요?
              </div>
              {dogs && dogs.length > 0 ? (
                <div className="quote-options">
                  {dogs.map((dog) => (
                    <button
                      key={dog.id}
                      className={`quote-option-btn ${selectedDogId === dog.id ? 'active' : ''}`}
                      onClick={() => setSelectedDogId(dog.id)}
                    >
                      {dog.name || '이름 없음'}
                      {dog.breed ? ` · ${dog.breed}` : ''}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="quote-helper-text" style={{ marginTop: '8px' }}>
                  등록된 강아지가 없어요. 마이페이지에서 강아지를 먼저 등록해 주세요.
                </p>
              )}
            </div>
            <button className="quote-next-btn" onClick={handleNext}>
              다음
            </button>
          </div>
        )}

        {/* Step 1: 미용 방식 */}
        {step === 1 && (
          <div className="quote-step">
            <div className="quote-step-header">
              <button className="back-btn" onClick={handleBack}>←</button>
              <h2 className="quote-step-title">견적서 요청하기</h2>
            </div>
            <div className="quote-step-question">어떤 방식의 미용을 원하시나요?</div>
            <div className="quote-options">
              {groomingStyles.map((style, idx) => (
                <button
                  key={idx}
                  className={`quote-option-btn ${quoteData.groomingStyle === style ? 'active' : ''}`}
                  onClick={() => handleGroomingStyleSelect(style)}
                >
                  {style}
                </button>
              ))}
            </div>
            <button className="quote-next-btn" onClick={handleNext}>
              다음
            </button>
          </div>
        )}

        {/* Step 2: 추가 미용 */}
        {step === 2 && (
          <div className="quote-step">
            <div className="quote-step-header">
              <button className="back-btn" onClick={handleBack}>←</button>
              <h2 className="quote-step-title">견적서 요청하기</h2>
            </div>
            <div className="quote-step-question">
              추기로 원하는 미용이 있으세요?
              <span className="quote-subtitle">(복수 선택 가능)</span>
            </div>
            <div className="quote-options-list">
              {additionalGroomingOptions.map((option, idx) => (
                <label key={idx} className="quote-checkbox-item">
                  <input
                    type="checkbox"
                    checked={quoteData.additionalGrooming.includes(option)}
                    onChange={() => handleAdditionalGroomingToggle(option)}
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
            <button className="quote-next-btn" onClick={handleNext}>
              다음
            </button>
          </div>
        )}

        {/* Step 3: 추가 사항 */}
        {step === 3 && (
          <div className="quote-step">
            <div className="quote-step-header">
              <button className="back-btn" onClick={handleBack}>←</button>
              <h2 className="quote-step-title">견적서 요청하기</h2>
            </div>
            <div className="quote-step-question">
              좋찬 미용 확정됐 읍갖주세요.
              <span className="quote-subtitle">(복수 선택 가능)</span>
            </div>
            <div className="quote-options-list">
              {additionalOptionsChoices.map((option, idx) => (
                <label key={idx} className="quote-checkbox-item">
                  <input
                    type="checkbox"
                    checked={quoteData.additionalOptions.includes(option)}
                    onChange={() => handleAdditionalOptionsToggle(option)}
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
            <button className="quote-next-btn" onClick={handleNext}>
              다음
            </button>
          </div>
        )}

        {/* Step 4: 사진 등록 */}
        {step === 4 && (
          <div className="quote-step">
            <div className="quote-step-header">
              <button className="back-btn" onClick={handleBack}>←</button>
              <h2 className="quote-step-title">견적서 요청하기</h2>
            </div>
            <div className="quote-step-question">사진 등록하기</div>
            <div className="quote-photo-upload">
              <div className="photo-upload-area">
                <div className="photo-upload-icon">+</div>
                <p className="photo-upload-text">사진을 스크롤해 인증 수정</p>
                <p className="photo-upload-subtext">사진을 불렀하나요.</p>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoSelect}
                className="photo-input"
              />
              {photoPreview && (
                <div className="photo-preview">
                  <img src={photoPreview} alt="preview" />
                </div>
              )}
            </div>
            <textarea
              className="quote-notes-textarea"
              placeholder="ex) 넓정 사람 경제, 소이메 민감함"
              value={quoteData.notes}
              onChange={(e) => setQuoteData({ ...quoteData, notes: e.target.value })}
            />
            <button className="quote-next-btn" onClick={handleNext}>
              다음
            </button>
          </div>
        )}

        {/* Step 5: 강아지 태그 */}
        {step === 5 && (
          <div className="quote-step">
            <div className="quote-step-header">
              <button className="back-btn" onClick={handleBack}>←</button>
              <h2 className="quote-step-title">견적서 요청하기</h2>
            </div>
            <div className="quote-step-question">우리럴 강아지 태그를 설정해주세요.</div>
            <div className="quote-tags-grid">
              {dogTagOptions.map((tag, idx) => (
                <button
                  key={idx}
                  className={`quote-tag-btn ${quoteData.dogTags.includes(tag) ? 'active' : ''}`}
                  onClick={() => handleDogTagToggle(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
            <button className="quote-next-btn" onClick={handleNext}>
              다음
            </button>
          </div>
        )}

        {/* Step 6: 희망 일정 */}
        {step === 6 && (
          <div className="quote-step">
            <div className="quote-step-header">
              <button className="back-btn" onClick={handleBack}>←</button>
              <h2 className="quote-step-title">희망 일정</h2>
            </div>
            <div className="quote-calendar-section">
              <input
                type="date"
                value={quoteData.preferredDate}
                onChange={(e) => {
                  const updated = { ...quoteData, preferredDate: e.target.value };
                  setQuoteData(updated);
                }}
                className="quote-date-input"
              />
              <div className="quote-time-grid">
                {timeSlots.map((time, idx) => (
                  <button
                    key={idx}
                    className={`quote-time-btn ${quoteData.preferredTime === time ? 'active' : ''}`}
                    onClick={() => {
                      const updated = { ...quoteData, preferredTime: time };
                      setQuoteData(updated);
                    }}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>
            <button
              className="quote-next-btn"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? '보내는 중...' : '견적 제출하기'}
            </button>
          </div>
        )}

        {/* Step 7: 완료 */}
        {step === 7 && (
          <div className="quote-step completion">
            <div className="quote-step-header">
              <button className="back-btn" onClick={() => {
                console.log('🎯 [QuoteRequestPage] Step 7 뒤로가기 - quoteRequestCompleted 이벤트 발생');
                window.dispatchEvent(new CustomEvent('quoteRequestCompleted', { 
                  detail: { userId: user?.uid } 
                }));
                navigate(-1);
              }}>←</button>
            </div>
            <div className="quote-completion-content">
              <div className="completion-dog-icon">🐕</div>
              <h2 className="completion-message">견적사가 무사히 전송 되였습니다 :)</h2>
              <button className="completion-btn" onClick={() => {
                console.log('🎯 [QuoteRequestPage] Step 7 돌아가기 - quoteRequestCompleted 이벤트 발생');
                window.dispatchEvent(new CustomEvent('quoteRequestCompleted', { 
                  detail: { userId: user?.uid } 
                }));
                navigate(-1);
              }}>
                돌아가기
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="quote-request-bottom-nav">
        <button className="nav-btn" onClick={() => navigate('/dashboard')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </button>
        <button className="nav-btn" onClick={() => navigate('/search')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
          </svg>
        </button>
        <button className="nav-btn">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </button>
        <button className="nav-btn" onClick={() => navigate('/mypage')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
