import { useState } from 'react';

export default function Field({ label, name, error, type = 'text', ...rest }) {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';
  return (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      <div className="field-control">
        <input
          id={name}
          name={name}
          type={isPassword && show ? 'text' : type}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${name}-error` : undefined}
          {...rest}
        />
        {isPassword && (
          <button type="button" className="field-toggle" onClick={() => setShow(!show)}>
            {show ? 'Hide' : 'Show'}
          </button>
        )}
      </div>
      {error && <p id={`${name}-error`} className="field-error">{error}</p>}
    </div>
  );
}
