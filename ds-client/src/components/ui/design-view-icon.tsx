interface ViewIconProps {
  size?: number;
  className?: string;
}

export const DesignViewIcon = ({ size = 22, className }: ViewIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 22 22"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.35"
    strokeLinecap="round"
    strokeLinejoin="round"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Set square body — right-angle triangle */}
    <path d="M3 19 L3 3 L17 19 Z" />

    {/* Right-angle indicator at the corner */}
    <path d="M3 17 L5 17 L5 19" strokeWidth="1" />

    {/* Pencil lying along the hypotenuse */}
    <line x1="18" y1="2" x2="20" y2="4" />
    <line x1="17" y1="19" x2="20" y2="4" strokeWidth="1" />
    <line x1="17" y1="19" x2="18" y2="2" strokeWidth="1" />

    {/* Ruler tick marks along bottom edge */}
    <line x1="6"  y1="19" x2="6"  y2="17.2" strokeWidth="0.9" />
    <line x1="9"  y1="19" x2="9"  y2="17.2" strokeWidth="0.9" />
    <line x1="12" y1="19" x2="12" y2="17.2" strokeWidth="0.9" />
    <line x1="15" y1="19" x2="15" y2="17.2" strokeWidth="0.9" />
  </svg>
);

export const DatasheetViewIcon = ({ size = 22, className }: ViewIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 22 22"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.3"
    strokeLinecap="round"
    strokeLinejoin="round"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Outer table border */}
    <rect x="2" y="3" width="18" height="16" rx="0.5" />

    {/* Column dividers */}
    <line x1="8.5"  y1="3"  x2="8.5"  y2="19" />
    <line x1="14.5" y1="3"  x2="14.5" y2="19" />

    {/* Row dividers */}
    <line x1="2" y1="8"  x2="20" y2="8" />
    <line x1="2" y1="13" x2="20" y2="13" />

    {/* Header row — small filled sort triangles (one per column, pointing down) */}
    <path d="M4.5 5 L6 7 L7.5 5 Z" fill="currentColor" stroke="none" />
    <path d="M10.5 5 L12 7 L13.5 5 Z" fill="currentColor" stroke="none" />
    <path d="M16 5 L17.5 7 L19 5 Z" fill="currentColor" stroke="none" />
  </svg>
);

export default DesignViewIcon;
