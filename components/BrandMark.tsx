type BrandMarkProps = {
  size?: number;
  className?: string;
};

export function BrandMark({ size = 32, className }: BrandMarkProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      <rect x="2" y="2" width="28" height="28" rx="6" fill="var(--accent-amber)"/>
      <path d="M9 9 L16 23 L23 9" stroke="#0B0D10" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="2" y="2" width="28" height="28" rx="6" fill="none" stroke="rgba(124,92,255,0.35)" strokeWidth="1"/>
    </svg>
  );
}
