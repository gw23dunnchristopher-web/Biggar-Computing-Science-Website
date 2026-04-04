interface DesignViewIconProps {
  size?: number;
  className?: string;
}

export const DesignViewIcon = ({ size = 22, className }: DesignViewIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 22 22"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Set square / triangle */}
    <path d="M1.5 1.5 L1.5 16 L13 16 Z" />

    {/* Ruler at bottom */}
    <rect x="1" y="17" width="20" height="4" rx="0.4" />
    <line x1="4"   y1="17" x2="4"   y2="19" />
    <line x1="7"   y1="17" x2="7"   y2="19.5" />
    <line x1="10"  y1="17" x2="10"  y2="19" />
    <line x1="13"  y1="17" x2="13"  y2="19.5" />
    <line x1="16"  y1="17" x2="16"  y2="19" />
    <line x1="19"  y1="17" x2="19"  y2="19.5" />

    {/* Pencil body (diagonal, upper-right to lower-left) */}
    <polygon points="18,0.5 20,2.5 7,15.5 5,13.5" />

    {/* Pencil tip */}
    <path d="M5,13.5 L7,15.5 L5,17" />
  </svg>
);

export default DesignViewIcon;
