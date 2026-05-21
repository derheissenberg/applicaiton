import { cn } from "@/lib/utils";

type ButtonLinkProps = {
  variant: "primary" | "outline";
  href: string;
  children: React.ReactNode;
  className?: string;
};

type ButtonIconProps = {
  variant: "icon";
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  "aria-label": string;
  onClick?: () => void;
  type?: "button" | "submit";
};

type ButtonProps = ButtonLinkProps | ButtonIconProps;

export function Button(props: ButtonProps) {
  if (props.variant === "icon") {
    const { children, className, disabled, onClick, type = "button", "aria-label": ariaLabel } =
      props;
    return (
      <button
        type={type}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={onClick}
        className={cn(
          "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-black transition-opacity",
          "hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50",
          "disabled:cursor-not-allowed disabled:opacity-40",
          className
        )}
      >
        {children}
      </button>
    );
  }

  const { variant, href, children, className } = props;
  const linkClasses =
    variant === "primary"
      ? "inline-flex items-center justify-center rounded-[10px] bg-white px-[22px] py-[14px] text-sm font-medium text-black"
      : "inline-flex items-center justify-center rounded-[10px] border border-white/20 px-[20px] py-[12px] text-sm text-white hover:border-white/40 hover:bg-white/[0.06]";

  return (
    <a href={href} className={cn(linkClasses, className)}>
      {children}
    </a>
  );
}

export function SendIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden
    >
      <path d="M12 19V5" />
      <path d="m5 12 7-7 7 7" />
    </svg>
  );
}
