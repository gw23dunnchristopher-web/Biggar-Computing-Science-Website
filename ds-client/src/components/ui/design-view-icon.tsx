interface ViewIconProps {
  size?: number;
  className?: string;
}

export const DesignViewIcon = ({ size = 22, className }: ViewIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="1096 493 375 341"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M1376.5 500.5 1465.5 500.5 1465.5 829.5 1460.93 829.5 1376.5 752.41Z"
      stroke="currentColor"
      strokeWidth="6.875"
      strokeMiterlimit="8"
      fill="#FFFFFF"
      fillRule="evenodd"
    />
    <path d="M1376.5 546.5 1427.46 546.5" stroke="currentColor" strokeWidth="6.875" strokeMiterlimit="8" fill="none" fillRule="evenodd"/>
    <path d="M1376.5 601.5 1427.46 601.5" stroke="currentColor" strokeWidth="6.875" strokeMiterlimit="8" fill="none" fillRule="evenodd"/>
    <path d="M1376.5 655.5 1436.11 655.684" stroke="currentColor" strokeWidth="6.875" strokeMiterlimit="8" fill="none" fillRule="evenodd"/>
    <path d="M1376.5 709.5 1427.46 709.5" stroke="currentColor" strokeWidth="6.875" strokeMiterlimit="8" fill="none" fillRule="evenodd"/>
    <path d="M1389.5 763.5 1422.66 763.5" stroke="currentColor" strokeWidth="6.875" strokeMiterlimit="8" fill="none" fillRule="evenodd"/>
    <path
      d="M1166.63 638.869 1166.63 772.672 1313.85 772.672ZM1099.5 501.5 1461.5 830.5 1099.5 830.5Z"
      stroke="currentColor"
      strokeWidth="6.875"
      strokeMiterlimit="8"
      fill="none"
      fillRule="evenodd"
    />
  </svg>
);

export const DatasheetViewIcon = ({ size = 22, className }: ViewIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="1595 497 383 337"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <rect x="1598.5" y="500.5" width="375" height="329" stroke="currentColor" strokeWidth="6.875" strokeMiterlimit="8" fill="none"/>
    <path d="M1598.5 574.5 1974.05 574.5" stroke="currentColor" strokeWidth="6.875" strokeMiterlimit="8" fill="none" fillRule="evenodd"/>
    <path d="M1598.5 655.5 1974.05 655.5" stroke="currentColor" strokeWidth="6.875" strokeMiterlimit="8" fill="none" fillRule="evenodd"/>
    <path d="M1598.5 743.5 1974.05 743.5" stroke="currentColor" strokeWidth="6.875" strokeMiterlimit="8" fill="none" fillRule="evenodd"/>
    <path d="M1721.5 574.5 1721.5 830.224" stroke="currentColor" strokeWidth="6.875" strokeMiterlimit="8" fill="none" fillRule="evenodd"/>
    <path d="M1849.5 574.5 1849.5 830.224" stroke="currentColor" strokeWidth="6.875" strokeMiterlimit="8" fill="none" fillRule="evenodd"/>
    <path d="M1703 520 1667 554 1631 520Z" fill="currentColor" fillRule="evenodd"/>
    <path d="M1821 520 1785 554 1749 520Z" fill="currentColor" fillRule="evenodd"/>
    <path d="M1940 520 1904 554 1868 520Z" fill="currentColor" fillRule="evenodd"/>
  </svg>
);

export default DesignViewIcon;
