import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './DesignerDetailPage.css';

const designerImage = 'https://www.figma.com/api/mcp/asset/ee6fb520-45bd-4f25-bea3-0bd442880b9e';
const badge1 = 'https://www.figma.com/api/mcp/asset/cf5688d2-afa0-4a9f-b7f5-eb573bbbe308';
const badge2 = 'https://www.figma.com/api/mcp/asset/2b4bec9c-ca32-4cdc-9f71-4cd90593761e';
const badge3 = 'https://www.figma.com/api/mcp/asset/e952489a-bb1c-4151-aa6e-40aa23b67242';
const portfolio1 = 'https://www.figma.com/api/mcp/asset/eef3ccc1-8452-492a-b4fb-3a51c43f645e';
const portfolio2 = 'https://www.figma.com/api/mcp/asset/a1c0cca9-f135-480f-afc1-eaa183a12b32';
const portfolio3 = 'https://www.figma.com/api/mcp/asset/ff692a10-3bac-4fa0-b338-883aefc31861';
const portfolio4 = 'https://www.figma.com/api/mcp/asset/b50e541f-e360-4814-ad5f-7bc13782c294';
const reviewerImage = 'https://www.figma.com/api/mcp/asset/81d60902-a5be-40f1-84b5-39a8b3524020';

export default function DesignerDetailPage({ isOpen = true, onClose }) {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('info');
  const [scrolledSections, setScrolledSections] = useState({});

  useEffect(() => {
    if (!isOpen) return;

    const handleScroll = (e) => {
      const container = e.target;
      const infoSection = document.querySelector('#info-section');
      const portfolioSection = document.querySelector('#portfolio-section');
      const reviewSection = document.querySelector('#review-section');

      // 각 섹션의 위치를 확인해서 활성 섹션 결정
      const sections = [
        { element: infoSection, id: 'info', offset: 0 },
        { element: portfolioSection, id: 'portfolio', offset: 600 },
        { element: reviewSection, id: 'review', offset: 1200 },
      ];

      // 현재 스크롤 위치에 기반해 활성 섹션 업데이트
      for (let i = sections.length - 1; i >= 0; i--) {
        if (container.scrollTop >= sections[i].offset - 50) {
          setActiveSection(sections[i].id);
          // 해당 섹션의 텍스트를 진하게 만들기
          sections.forEach((sec) => {
            if (sec.element) {
              if (sec.id === sections[i].id) {
                sec.element.classList.add('active');
              } else {
                sec.element.classList.remove('active');
              }
            }
          });
          break;
        }
      }
    };

    const scrollContainer = document.querySelector('.designer-detail-scroll');
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
      return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }
  }, [isOpen]);

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      navigate(-1);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="designer-detail-overlay">
      <div className="designer-detail-container">
        {/* Header */}
        <div className="designer-detail-header">
          <button className="designer-detail-back" onClick={handleClose}>
            ←
          </button>
          <div className="designer-detail-actions">
            <button className="designer-detail-edit">✏</button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="designer-detail-scroll">
          {/* Top Section - 디자이너 기본 정보 */}
          <div className="designer-hero">
            <div className="designer-image-wrapper">
              <img
                src={designerImage}
                alt="김민지 디자이너"
                className="designer-image"
              />
            </div>

            {/* 뱃지 */}
            <div className="designer-badges">
              <img src={badge1} alt="badge1" className="designer-badge" />
              <img src={badge2} alt="badge2" className="designer-badge" />
              <img src={badge3} alt="badge3" className="designer-badge" />
            </div>

            {/* 디자이너 이름 및 소개 */}
            <div className="designer-intro">
              <h1 className="designer-name">김민지 디자이너</h1>
              <div className="designer-location">
                <span className="location-icon">📍</span>
                <span className="location-text">강남구 역삼동</span>
              </div>
              <p className="designer-motto">
                우리 아이가 가장 편안한 공간으로 찾아가는 맞춤 미용, 디자이너
                김민지 입니다.
              </p>
            </div>

            {/* 통계 카드 */}
            <div className="designer-stats">
              <div className="stat-box">
                <span className="stat-label">매칭 횟수</span>
                <span className="stat-value">3회</span>
              </div>
              <div className="stat-box">
                <span className="stat-label">디자이너 경력</span>
                <span className="stat-value">10년</span>
              </div>
              <div className="stat-box">
                <span className="stat-label">리뷰</span>
                <span className="stat-value">4.5</span>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="designer-tabs">
            <button
              className={`designer-tab ${activeSection === 'info' ? 'active' : ''}`}
              onClick={() => {
                const scrollContainer = document.querySelector(
                  '.designer-detail-scroll'
                );
                if (scrollContainer) scrollContainer.scrollTop = 0;
              }}
            >
              디자이너 정보
            </button>
            <button
              className={`designer-tab ${activeSection === 'portfolio' ? 'active' : ''}`}
              onClick={() => {
                const scrollContainer = document.querySelector(
                  '.designer-detail-scroll'
                );
                if (scrollContainer) scrollContainer.scrollTop = 800;
              }}
            >
              포트폴리오
            </button>
            <button
              className={`designer-tab ${activeSection === 'review' ? 'active' : ''}`}
              onClick={() => {
                const scrollContainer = document.querySelector(
                  '.designer-detail-scroll'
                );
                if (scrollContainer) scrollContainer.scrollTop = 1400;
              }}
            >
              리뷰
            </button>
          </div>

          {/* 디자이너 정보 섹션 */}
          <section className="designer-section" id="info-section">
            <div className="section-tags">
              <span className="tag">예민견 전문</span>
              <span className="tag">노령견 가능</span>
              <span className="tag">푸들</span>
              <span className="tag">곰돌이 컷</span>
              <span className="tag">소형견 전문</span>
            </div>

            <div className="section-content">
              <h2 className="section-title">주요 근무 경력 | 총 10년</h2>
              <p className="section-text">
                강남권 반려견 전문 미용샵 근무 (4년)<br />
                출장 및 샵 미용 병행 경험 (6년)<br />
                예민견·노령견 케어 중심 실무
              </p>
            </div>

            <div className="section-content">
              <h2 className="section-title">디자이너 소개글</h2>
              <p className="section-text">
                반려견 미용을 시작한 지 어느덧 10년이 되었습니다.
                <br />
                <br />
                그동안 강남권 반려견 전문 미용샵을 중심으로 다양한 환경에서
                근무하며 수많은 강아지와 보호자를 만나왔습니다.
                <br />
                <br />
                소형견 위주의 미용은 물론, 예민하거나 낯가림이 심한 아이들,
                노령견, 첫 미용을 경험하는 강아지까지
                <br />
                각기 다른 성향의 반려견을 케어해온 경험이 저의 가장 큰
                자산입니다.
                <br />
                <br />
                미용은 단순히 '예쁘게 만드는 일'이 아니라
                <br />
                강아지의 컨디션과 감정을 읽고 그에 맞춰 속도와 방식을 조절하는
                과정이라고 생각합니다.
                <br />
                <br />
                특히 출장 미용의 경우 낯선 공간과 도구로 인해 아이가 쉽게
                긴장할 수 있기 때문에
                <br />
                저는 항상 아이가 안정감을 느낄 수 있도록 충분한 교감과 관찰을
                우선합니다.
                <br />
                <br />
                필요하다면 미용을 나누어 진행하거나, 아이의 상태에 따라 과감히
                중단하는 선택도 합니다.
              </p>
            </div>
          </section>

          {/* 포트폴리오 섹션 */}
          <section className="designer-section" id="portfolio-section">
            <h2 className="section-title">포트폴리오</h2>
            <div className="portfolio-grid">
              <div className="portfolio-item">
                <img src={portfolio1} alt="토이 푸들" className="portfolio-img" />
                <p className="portfolio-label">토이 푸들 (출장 미용)</p>
              </div>
              <div className="portfolio-item">
                <img src={portfolio2} alt="비숑비숑" className="portfolio-img" />
                <p className="portfolio-label">비숑비숑 (샵 미용)</p>
              </div>
              <div className="portfolio-item">
                <img src={portfolio3} alt="푸들푸들" className="portfolio-img" />
                <p className="portfolio-label">푸들푸들 (출장 미용)</p>
              </div>
              <div className="portfolio-item">
                <img src={portfolio4} alt="푸들푸들" className="portfolio-img" />
                <p className="portfolio-label">푸들푸들 (출장 미용)</p>
              </div>
            </div>
          </section>

          {/* 리뷰 섹션 */}
          <section className="designer-section" id="review-section">
            <h2 className="section-title">리뷰</h2>
            <div className="review-header">
              <div className="review-rating">
                <span className="rating-stars">⭐⭐⭐⭐⭐</span>
                <span className="rating-score">5.0 (3)</span>
              </div>
            </div>

            <div className="review-item">
              <div className="review-header-content">
                <img src={reviewerImage} alt="뽀또 맘" className="reviewer-avatar" />
                <div className="reviewer-info">
                  <p className="reviewer-name">뽀또 맘</p>
                  <p className="review-date">2일전</p>
                </div>
                <div className="review-stars">⭐⭐⭐⭐⭐</div>
              </div>
              <p className="review-text">
                평소에 저희 강아지가 워낙 겁이 많아서 미용실만 가면 며칠씩
                밥도 안 먹고 우울해했어요.
                <br />
                매번 미안한 마음에 이번에 처음으로 출장 미용을 예약해 봤는데,
                정말 대만족입니다!
                <br />
                디자이너님이 아이가 적응할 때까지 충분히 기다려 주시고
                <br />
                무엇보다 아이가 익숙한 거실에서 미용을 받으니까 훨씬 안정적으로
                있더라고요.
                <br />
                털 깎는 내내 다정하게 말 걸어주시는 모습에 신뢰가 갔습니다.
                <br />
                미용 끝나고 나서도 평소처럼 바로 꼬리 치며 뛰어노는 걸 보니
                진작 부를 걸 그랬다 싶어요.
                <br />
                아이 스트레스 때문에 고민하시는 분들께 강력 추천합니다!
              </p>
            </div>
          </section>

          {/* Bottom Spacing */}
          <div style={{ height: '80px' }}></div>
        </div>

        {/* Bottom Actions */}
        <div className="designer-detail-footer">
          <button
            className="designer-footer-btn chat"
            type="button"
            onClick={() => navigate('/chat')}
          >
            채팅하기
          </button>
          <button
            className="designer-footer-btn quote"
            type="button"
            onClick={() => navigate('/quote-request')}
          >
            견적서 보내기
          </button>
        </div>
      </div>
    </div>
  );
}
