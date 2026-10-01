export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Accept strings only. This blocks NoSQL injection such as { "email": { "$ne": "" } }.
export const str = (v) => (typeof v === 'string' ? v.trim() : '');

export function validateAccount({ fullName, email, password }) {
  const errors = {};
  if (!fullName) errors.fullName = 'Enter the full name.';
  if (!EMAIL_RE.test(email)) errors.email = 'Enter a valid email address.';
  if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    errors.password = 'Use at least 8 characters with a letter and a number.';
  }
  return errors;
}
