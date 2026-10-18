export default function BrandMark({ className }) {
  return (
    <svg className={className} viewBox="0 0 40 40" aria-hidden="true" focusable="false">
      <rect className="logo-mark__background" width="40" height="40" rx="12" />
      <path
        className="logo-mark__book"
        d="M10.5 14.5c3.4-1.2 6.5-.8 9.5 1.1v13c-3-1.9-6.1-2.3-9.5-1.1zm19 0c-3.4-1.2-6.5-.8-9.5 1.1v13c3-1.9 6.1-2.3 9.5-1.1z"
      />
      <path className="logo-mark__book" d="M20 15.6v13m-6-10.1 3 .2m9-.2-3 .2" />
      <path className="logo-mark__accent" d="m29.5 7 .9 2.2 2.3.9-2.3.9-.9 2.3-.9-2.3-2.3-.9 2.3-.9z" />
    </svg>
  );
}
