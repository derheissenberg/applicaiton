type ChevronDownIconProps = {
  size?: number;
  strokeWidth?: number;
  className?: string;
};

export function ChevronDownIcon({
  size = 18,
  strokeWidth = 1.75,
  className,
}: ChevronDownIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
