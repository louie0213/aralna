export default function BrandMark({ className }) {
  return (
    <svg className={className} viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <rect className="logo-mark__shadow" x="8" y="7" width="90" height="90" rx="23" />
      <rect className="logo-mark__background" x="3" y="2" width="90" height="90" rx="23" />
      <circle className="logo-mark__sparkle-dot" cx="25" cy="32" r="3.8" />
      <circle className="logo-mark__sparkle-dot" cx="75" cy="26" r="4.4" />
      <path className="logo-mark__accent" d="M50 14c2.5 10 5.5 13 15 15-9.5 2-12.5 5-15 15-2.5-10-5.5-13-15-15 9.5-2 12.5-5 15-15z" />
      <path className="logo-mark__book" d="M19 48c10-3.5 21-2.5 31 2.5 10-5 21-6 31-2.5v25c-10-3.5-21-2.5-31 2.5-10-5-21-6-31-2.5z" />
      <path className="logo-mark__book-detail" d="M50 50.5v25M43 65c2.3 2.4 4.7 3.5 7 3.5s4.7-1.1 7-3.5" />
      <circle className="logo-mark__eye" cx="35" cy="59" r="2.5" />
      <circle className="logo-mark__eye" cx="65" cy="59" r="2.5" />
    </svg>
  );
}
