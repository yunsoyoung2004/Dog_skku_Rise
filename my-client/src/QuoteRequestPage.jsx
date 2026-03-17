import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './firebase';
import { createQuoteRequest, getUserDogs, sendMessage, createNotification, createOrGetChatRoom, getAllDesigners } from './services';
import './QuoteRequestPage.css';

const logoImg = "/vite.svg";

export default function QuoteRequestPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user] = useAuthState(auth);
  const [step, setStep] = useState(0);
  const [dogs, setDogs] = useState([]);
  const [dogsLoading, setDogsLoading] = useState(true);
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
    if (user) {
      loadUserDogs();
    } else {
      setDogsLoading(false);
    }
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
      setDogsLoading(true);
      const userDogs = await getUserDogs(user.uid);
      setDogs(userDogs);
    } catch (err) {
      console.error('강아지 로드 실패:', err);
    } finally {
      setDogsLoading(false);
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
    '발톱 손질',
    '발바닥 털 정리',
    '귀 청소',
    '항문낭 관리',
    '눈 주변 털 정리',
  ];

  // Step 3: 추가 옵션
  const additionalOptionsChoices = [
    '입질이 있어요',
    '주차가 가능해요',
    '짧게 깎는 스타일을 선호해요',
    '미용할 때 보호자가 함께 있어도 괜찮아요',
    '미용할 때 보호자가 함께 있는 것을 원하지 않아요',
  ];

  // Step 5: 강아지 태그
  const dogTagOptions = [
    '알레르기 있음',
    '겁이 많음',
    '분리불안 있음',
    '예민함',
    '사람을 무서워함',
    '다른 강아지를 무서워함',
    '에너지 많음',
    '차분함',
  ];

  // Step 6: 선호 시간
  const timeSlots = [
    '9시',
    '10시',
    '11시',
    '12시',
    '1시',
    '2시',
    '3시',
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
    // 단계별 필수 값 검증
    if (step === 0) {
      if (!selectedDogId) {
        alert('어떤 강아지에 대한 미용인지 선택해 주세요.');
        return;
      }
    }

    if (step === 1) {
      if (!quoteData.knowledge) {
        alert('미용 진행 장소를 선택해 주세요.');
        return;
      }
    }

    if (step === 2) {
      if (!quoteData.groomingStyle) {
        alert('원하시는 미용 방식을 선택해 주세요.');
        return;
      }
    }

    // Step 3, 4, 5, 6은 선택 사항이라 필수 검증 없이 넘어갑니다.

    setStep(step + 1);
  };

  const handleSubmit = async () => {
    if (!user) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }

    if (!selectedDogId) {
      alert('강아지를 선택해주세요');
      return;
    }

    // 희망 일정 필수 입력 및 오늘 이후 날짜만 허용
    if (!quoteData.preferredDate) {
      alert('희망 일자를 선택해 주세요.');
      return;
    }

    if (!quoteData.preferredTime) {
      alert('희망 시간을 선택해 주세요.');
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(quoteData.preferredDate);
    if (selectedDate < today) {
      alert('오늘 이후 날짜만 선택할 수 있어요.');
      return;
    }

    const selectedDog = dogs.find((d) => d.id === selectedDogId) || {};

    setLoading(true);
    try {
      console.log('\n========== [상세 견적 요청 제출 - QuoteRequestPage] ==========');
      console.log('📝 [1] 제출 시작:', {
        userId: user.uid,
        roomId,
        designerId,
        selectedDogId,
        stepInfo: quoteData,
      });

      console.log('🐕 [2] 강아지 정보:', {
        dogId: selectedDogId,
        name: selectedDog.name,
        breed: selectedDog.breed,
        weight: selectedDog.weight,
      });

      // 공통 payload 구성
      const basePayload = {
        dogId: selectedDogId,
        dogName: selectedDog.name || '',
        breed: selectedDog.breed || '',
        weight: selectedDog.weight,
        // 채팅에서 온 경우, 해당 채팅방 ID를 함께 저장해 이후 견적/예약과 연결
        roomId: roomId || '',
        quoteData: quoteData,
      };

      if (designerId) {
        // 1:1 디자이너에게 보내는 기존 플로우
        console.log('📤 [3] createQuoteRequest 호출 중... (단일 디자이너 모드)');
        const result = await createQuoteRequest(user.uid, designerId, {
          ...basePayload,
          designerName: designerName || '',
        });

        console.log('✅ [4] createQuoteRequest 완료:', {
          success: result?.success,
          quoteRequestId: result?.quoteId,
          message: result?.message,
          timestamp: new Date().toISOString(),
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
            quoteRequestId: result?.quoteId,
          });
          window.dispatchEvent(
            new CustomEvent('quoteRequestCompleted', {
              detail: {
                userId: user?.uid,
                designerId,
                quoteRequestId: result?.quoteId,
              },
            }),
          );
        } catch (e) {
          console.warn('⚠️  quoteRequestCompleted 이벤트 디스패치 실패(무시 가능):', e);
        }

        // 채팅방에 시스템 메시지 기록 (채팅에서 온 경우든, 상세 페이지에서 온 경우든 동일하게 처리)
        let targetRoomId = roomId || '';

        // 채팅방이 아직 없다면 생성 또는 기존 방 재사용
        if (!targetRoomId && result?.success && user && designerId) {
          try {
            console.log('🔍 기존 채팅방 조회/생성:', { userId: user.uid, designerId });
            const room = await createOrGetChatRoom(user.uid, designerId, {
              designerName: designerName || '',
            });
            targetRoomId = room?.id || '';
            console.log('✅ 채팅방 확보 완료:', { targetRoomId });
          } catch (e) {
            console.warn('⚠️ 채팅방 조회/생성 실패(무시 가능):', e);
          }
        }

        // 채팅방이 확보되면 시스템 메시지(📝 견적 요청)를 남긴다
        if (targetRoomId && result?.success && user) {
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
              roomId: targetRoomId,
              messageType: systemMessage.messageType,
              quoteRequestId: result?.quoteId,
            });
            await sendMessage(targetRoomId, systemMessage);
            console.log('✅ [7] 채팅 메시지 Firestore 저장 완료');
            console.log('========== [✅ 상세 견적 요청 완료] ==========' );
          } catch (e) {
            console.warn('⚠️  견적 요청 채팅 메시지 기록 실패(무시 가능):', e);
          }
        } else {
          console.warn('⚠️  [8] 채팅 메시지 스킵:', {
            hasRoomId: !!targetRoomId,
            success: result?.success,
            hasQuoteId: !!result?.quoteId,
            hasUser: !!user,
            skipReason: !targetRoomId
              ? '채팅방 없음'
              : !result?.success
              ? '생성 실패'
              : !result?.quoteId
              ? '견적ID 없음'
              : '알려지지 않음',
          });
          console.log('========== [⚠️  견적 생성은 성공했으나 채팅 메시지는 스킵] ==========' );
        }

        // 채팅방이 확보된 경우에는 바로 채팅 화면으로 이동해서
        // "📝 견적 요청을 보냈습니다" 시스템 카드와 시간을 바로 볼 수 있게 한다.
        if (targetRoomId) {
          navigate(`/chat/${targetRoomId}`);
          return;
        }

        // 채팅방이 없으면 기존처럼 완료 단계로 이동
        setStep(7);
      } else {
        // 빠른 견적 요청: 모든 디자이너에게 브로드캐스트
        console.log('📤 [3] 빠른 견적 브로드캐스트 모드 - 모든 디자이너에게 전송');
        const designers = await getAllDesigners();

        if (!Array.isArray(designers) || designers.length === 0) {
          console.warn('⚠️ 견적을 보낼 디자이너가 없습니다.');
          alert('현재 견적을 받을 수 있는 디자이너가 없습니다.');
        } else {
          const nowIso = new Date().toISOString();
          const tasks = designers.map(async (d) => {
            const targetDesignerId = d.id;
            const targetDesignerName = d.name || '';

            const result = await createQuoteRequest(user.uid, targetDesignerId, {
              ...basePayload,
              designerName: targetDesignerName,
            });

            console.log('✅ [브로드캐스트] createQuoteRequest 완료:', {
              designerId: targetDesignerId,
              quoteRequestId: result?.quoteId,
              success: result?.success,
              at: nowIso,
            });

            try {
              await createNotification(targetDesignerId, {
                title: '새 견적 요청이 도착했어요',
                message: `${selectedDog.name || '반려견'} 견적 요청이 도착했습니다.`,
                type: 'quote',
                chatRoomId: '',
                quoteRequestId: result?.quoteId || '',
              });
            } catch (e) {
              console.warn('브로드캐스트 알림 생성 실패(무시 가능):', e);
            }
          });

          await Promise.allSettled(tasks);

          // 사용자 헤더 배지 갱신 이벤트 (요청 1건 기준으로 +1)
          try {
            console.log('📣 [QuoteRequestPage] quoteRequestCompleted 이벤트 디스패치 (브로드캐스트 모드):', {
              userId: user?.uid,
            });
            window.dispatchEvent(
              new CustomEvent('quoteRequestCompleted', {
                detail: {
                  userId: user?.uid,
                },
              }),
            );
          } catch (e) {
            console.warn('⚠️  quoteRequestCompleted 이벤트 디스패치 실패(무시 가능):', e);
          }

          // 빠른 견적은 채팅방 없이 완료 화면으로 이동
          setStep(7);
        }
      }
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
        {/* Step 0: 강아지 선택 */}
        {step === 0 && (
          <div className="quote-step">
            <div className="quote-step-header">
              <button className="back-btn" onClick={handleBack}>←</button>
              <h2 className="quote-step-title">견적서 요청하기</h2>
            </div>
            <div className="quote-step-question">
              어떤 강아지에 대한 미용인가요?
            </div>
            {dogsLoading ? (
              <p className="quote-helper-text" style={{ marginTop: '8px' }}>
                강아지 정보를 불러오는 중이에요...
              </p>
            ) : dogs && dogs.length > 0 ? (
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
            <button className="quote-next-btn" onClick={handleNext}>
              다음
            </button>
          </div>
        )}

        {/* Step 1: 미용 진행 장소 */}
        {step === 1 && (
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
            <button className="quote-next-btn" onClick={handleNext}>
              다음
            </button>
          </div>
        )}

        {/* Step 2: 미용 방식 */}
        {step === 2 && (
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

        {/* Step 3: 추가 미용 */}
        {step === 3 && (
          <div className="quote-step">
            <div className="quote-step-header">
              <button className="back-btn" onClick={handleBack}>←</button>
              <h2 className="quote-step-title">견적서 요청하기</h2>
            </div>
            <div className="quote-step-question">
              추가로 원하는 미용이 있으세요?
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

        {/* Step 4: 추가 옵션 */}
        {step === 4 && (
          <div className="quote-step">
            <div className="quote-step-header">
              <button className="back-btn" onClick={handleBack}>←</button>
              <h2 className="quote-step-title">견적서 요청하기</h2>
            </div>
            <div className="quote-step-question">
              추가로 알려주고 싶은 옵션이 있나요?
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

        {/* Step 5: 사진 등록 */}
        {step === 5 && (
          <div className="quote-step">
            <div className="quote-step-header">
              <button className="back-btn" onClick={handleBack}>←</button>
              <h2 className="quote-step-title">견적서 요청하기</h2>
            </div>
            <div className="quote-step-question">사진 등록하기</div>
            <div className="quote-photo-upload">
              <div className="photo-upload-area">
                <div className="photo-upload-icon">+</div>
                <p className="photo-upload-text">사진을 업로드해 강아지의 상태를 보여주세요.</p>
                <p className="photo-upload-subtext">※ 참고용 사진을 여러 장 등록하셔도 좋아요.</p>
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
              placeholder="예) 낯선 사람을 무서워해요. 소리에 예민해요."
              value={quoteData.notes}
              onChange={(e) => setQuoteData({ ...quoteData, notes: e.target.value })}
            />
            <button className="quote-next-btn" onClick={handleNext}>
              다음
            </button>
          </div>
        )}

        {/* Step 6: 강아지 태그 */}
        {step === 6 && (
          <div className="quote-step">
            <div className="quote-step-header">
              <button className="back-btn" onClick={handleBack}>←</button>
              <h2 className="quote-step-title">견적서 요청하기</h2>
            </div>
            <div className="quote-step-question">우리 집 강아지 특징을 선택해 주세요.</div>
            
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

        {/* Step 7: 희망 일정 */}
        {step === 7 && (
          <div className="quote-step">
            <div className="quote-step-header">
              <button className="back-btn" onClick={handleBack}>←</button>
              <h2 className="quote-step-title">희망 일정</h2>
            </div>
            <div className="quote-calendar-section">
              <input
                type="date"
                value={quoteData.preferredDate}
                min={new Date().toISOString().split('T')[0]}
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

        {/* Step 8: 완료 */}
        {step === 8 && (
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
              <h2 className="completion-message">견적서가 무사히 전송되었어요 :)</h2>
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
