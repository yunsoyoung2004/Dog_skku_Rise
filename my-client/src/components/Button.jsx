import '../styles/Button.css';

export default function Button({ 
  children, 
  onClick, 
  type = 'button',
  disabled = false,
  variant = 'primary'
}) {
  return (
    <button 
      className={`button button--${variant}`}
      type={type}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
