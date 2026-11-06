import { useTheme } from '../ThemeContext.jsx';
import './Logo.css';

/** Four-point star polygon in a local box (matches clip-path star proportions). */
function starPoints(cx, cy, size) {
  const half = size / 2;
  const left = cx - half;
  const top = cy - half;
  const map = (x, y) => `${left + (size * x) / 100},${top + (size * y) / 100}`;
  return [
    map(50, 0),
    map(61, 39),
    map(100, 50),
    map(61, 61),
    map(50, 100),
    map(39, 61),
    map(0, 50),
    map(39, 39),
  ].join(' ');
}

/** Concave 4-point sparkle — matches references/glint.png */
function glintPath(cx, cy, size) {
  const s = size / 2;
  return [
    `M${cx} ${cy - s}`,
    `C${cx + s * 0.14} ${cy - s * 0.28} ${cx + s * 0.28} ${cy - s * 0.14} ${cx + s} ${cy}`,
    `C${cx + s * 0.28} ${cy + s * 0.14} ${cx + s * 0.14} ${cy + s * 0.28} ${cx} ${cy + s}`,
    `C${cx - s * 0.14} ${cy + s * 0.28} ${cx - s * 0.28} ${cy + s * 0.14} ${cx - s} ${cy}`,
    `C${cx - s * 0.28} ${cy - s * 0.14} ${cx - s * 0.14} ${cy - s * 0.28} ${cx} ${cy - s}`,
    'Z',
  ].join(' ');
}

/**
 * Shared AralNa logo — light.jpg / dark.jpg + BrandMark shadow geometry.
 * @param {"dark"|"light"} [surface] — UI surface; defaults to active theme
 * @param {"full"|"icon"} variant
 * @param {"sm"|"md"|"lg"} size
 */
export default function Logo({
  surface,
  variant = 'full',
  size = 'md',
  className = '',
}) {
  const { theme } = useTheme();
  const resolvedSurface = surface ?? (theme === 'dark' ? 'dark' : 'light');
  const classes = ['logo', `logo--${resolvedSurface}`, `logo--${size}`, `logo--${variant}`, className]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classes} data-logo-surface={resolvedSurface}>
      <svg className="logo__badge" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
        <rect className="logo-mark__shadow" x="8" y="7" width="90" height="90" rx="23" />
        <rect className="logo__badge-rim" x="3" y="2" width="90" height="90" rx="23" />
        <rect className="logo__badge-fill" x="7" y="6" width="82" height="82" rx="19" />
        <polygon className="logo__sparkle logo__sparkle--side" points={starPoints(28, 28, 10)} />
        <polygon className="logo__sparkle logo__sparkle--main logo-mark__accent" points={starPoints(48, 28, 24)} />
        <polygon className="logo__sparkle logo__sparkle--side" points={starPoints(72, 22, 12)} />
        <path
          className="logo__book"
          d="M19 48c10-3.5 21-2.5 31 2.5 10-5 21-6 31-2.5v25c-10-3.5-21-2.5-31 2.5-10-5-21-6-31-2.5z"
        />
        <path className="logo__book-detail" d="M50 50.5v25" />
        <circle className="logo__eye" cx="35" cy="59" r="2.5" />
        <circle className="logo__eye" cx="65" cy="59" r="2.5" />
        <path className="logo__smile" d="M43 65c2.3 2.4 4.7 3.5 7 3.5s4.7-1.1 7-3.5" />
      </svg>

      {/* Yellow glint floats outside the badge — references/glint.png */}
      <svg className="logo__glint" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d={glintPath(12, 12, 20)} />
      </svg>

      {variant === 'full' && (
        <span className="logo__wordmark">
          <span className="logo__aral">Aral</span>
          <span className="logo__na">Na</span>
        </span>
      )}
    </span>
  );
}
