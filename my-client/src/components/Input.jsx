import '../styles/Input.css';

export default function Input({
  type = 'text',
  value,
  onChange,
  placeholder = '',
  label,
  error,
  disabled = false
}) {
  return (
    <div className="input-group">
      {label && <label className="input-label">{label}</label>}
      <input
        className={`input ${error ? 'input--error' : ''}`}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
      />
      {error && <span className="input-error">{error}</span>}
    </div>
  );
}
