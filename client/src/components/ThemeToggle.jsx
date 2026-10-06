import { useTheme } from '../ThemeContext.jsx';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const nextTheme = theme === 'dark' ? 'light' : 'dark';

  return (
    <button
      className="theme-toggle"
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${nextTheme} mode`}
      aria-pressed={theme === 'dark'}
    >
      <span className="theme-toggle-mark" aria-hidden="true">{theme === 'dark' ? '☼' : '◐'}</span>
    </button>
  );
}