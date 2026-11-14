/** HALO's mark: flat Mars with its halo ring. Used as the logo and as HALO's face in the Assistant. */
export function HaloMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} className={className} aria-hidden="true">
      <path d="M14 66 A50 18 -18 0 1 106 54" fill="none" stroke="currentColor" strokeWidth="6" />
      <circle cx="60" cy="60" r="30" fill="var(--mars)" />
      <path d="M36 52 Q60 46 84 58" fill="none" stroke="var(--mars-deep)" strokeWidth="6" strokeLinecap="round" />
      <circle cx="70" cy="74" r="4.5" fill="var(--mars-deep)" />
      <path d="M106 54 A50 18 -18 0 1 14 66" fill="none" stroke="currentColor" strokeWidth="6" />
    </svg>
  );
}
