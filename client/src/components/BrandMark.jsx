export default function BrandMark({ className }) {
  return (
    <svg className={className} viewBox="0 0 40 40" aria-hidden="true" focusable="false">
      <rect className="logo-mark__background" x="0.35" y="0.35" width="39.3" height="39.3" rx="10" />
      <path className="logo-mark__book" d="M6.8 18.1c4.2-1.1 8.3-.2 12.2 2.8v11.2c-4.9-3.3-9-4.2-12.2-3.1zm26.4 0c-4.2-1.1-8.3-.2-12.2 2.8v11.2c4.9-3.3 9-4.2 12.2-3.1z" />
      <path className="logo-mark__accent" d="M20 7.5c.8 4 2.5 5.5 5.6 5.7-3.1.3-4.8 1.8-5.6 5.8-.8-4-2.5-5.5-5.6-5.8 3.1-.2 4.8-1.7 5.6-5.7z" />
    </svg>
  );
}
