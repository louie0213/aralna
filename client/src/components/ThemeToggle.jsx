import { useTheme } from '../ThemeContext.jsx';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const nextTheme = theme === 'dark' ? 'light' : 'dark';
  const isDark = theme === 'dark';

  return (
    <button
      className="theme-toggle"
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${nextTheme} mode`}
      role="switch"
      aria-checked={isDark}
    >
      <span className={`theme-toggle-thumb${isDark ? ' theme-toggle-thumb-dark' : ''}`} aria-hidden="true">
        {isDark ? (
          <svg className="theme-toggle-icon" viewBox="0 0 24 24" fill="none">
            <path d="M20.2 15.3A8.5 8.5 0 0 1 8.7 3.8 8.5 8.5 0 1 0 20.2 15.3Z" />
          </svg>
        ) : (
          <svg className="theme-toggle-icon" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
          </svg>
        )}
      </span>
    </button>
  );
}