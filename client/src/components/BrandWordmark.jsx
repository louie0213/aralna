// this file renders the AralNa text wordmark
export default function BrandWordmark({ className = '' }) {
  return (
    <span className={`brand-wordmark ${className}`.trim()}>
      Aral<span className="brand-wordmark__token">Na</span>
    </span>
  );
}
