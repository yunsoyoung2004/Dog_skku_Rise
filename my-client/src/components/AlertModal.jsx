import '../styles/AlertModal.css';

/**
 * 공통 AlertModal 컴포넌트
 * @param {boolean} isOpen - 모달 표시 여부
 * @param {string} title - 모달 제목
 * @param {string} text - 모달 본문 텍스트
 * @param {string} primaryButtonText - 주요 버튼 텍스트 (기본값: '확인')
 * @param {function} onPrimaryClick - 주요 버튼 클릭 핸들러
 * @param {string} secondaryButtonText - 보조 버튼 텍스트 (선택사항)
 * @param {function} onSecondaryClick - 보조 버튼 클릭 핸들러 (선택사항)
 * @param {string} variant - 모달 스타일 'default' | 'quote' | 'profile' (기본값: 'default')
 */
export default function AlertModal({
  isOpen,
  title,
  text,
  primaryButtonText = '확인',
  onPrimaryClick,
  secondaryButtonText,
  onSecondaryClick,
  variant = 'default',
}) {
  if (!isOpen) return null;

  const overlayClass = `alert-modal-overlay alert-modal-${variant}`;
  const modalClass = `alert-modal-content alert-modal-${variant}`;
  const primaryBtnClass = `alert-modal-primary alert-modal-primary-${variant}`;
  const secondaryBtnClass = `alert-modal-secondary alert-modal-secondary-${variant}`;

  return (
    <div className={overlayClass}>
      <div className={modalClass}>
        <h2 className="alert-modal-title">{title}</h2>
        <p className="alert-modal-text">{text}</p>
        <div className="alert-modal-actions">
          <button
            type="button"
            className={primaryBtnClass}
            onClick={onPrimaryClick}
          >
            {primaryButtonText}
          </button>
          {secondaryButtonText && (
            <button
              type="button"
              className={secondaryBtnClass}
              onClick={onSecondaryClick}
            >
              {secondaryButtonText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
