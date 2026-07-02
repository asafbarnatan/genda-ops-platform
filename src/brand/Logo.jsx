// Buildots wordmark — bracketed [BUILDOTS] frame with the signature lime "+".
// Recreated as SVG from the provided hi-res logo (charcoal wordmark, lime plus).
export default function Logo({ height = 26 }) {
  const w = height * (152 / 34);
  return (
    <svg width={w} height={height} viewBox="0 0 152 34" fill="none" role="img" aria-label="Buildots">
      <g stroke="#20201E" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
        {/* left bracket [ */}
        <path d="M13 4 H5 V30 H13" />
        {/* bottom bar */}
        <path d="M13 30 H122" />
        {/* top bar (stops before the plus) */}
        <path d="M13 4 H110" />
        {/* right bracket ] (lower part; top-right corner is the plus) */}
        <path d="M122 30 H129 V15" />
      </g>
      <text x="17" y="23.5" fontFamily="Inter, sans-serif" fontSize="16.5" fontWeight="800" letterSpacing="0.4" fill="#20201E">BUILDOTS</text>
      {/* lime + top-right */}
      <g fill="#DDF250">
        <rect x="123.5" y="0" width="4.6" height="16" rx="1.2" />
        <rect x="118.2" y="5.7" width="15.2" height="4.6" rx="1.2" />
      </g>
    </svg>
  );
}
