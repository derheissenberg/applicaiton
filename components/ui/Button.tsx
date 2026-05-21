import { cn } from "@/lib/utils";
import { accentGradientButton } from "@/lib/gradient-styles";

const typoPrimary =
  "font-[family-name:var(--font-kode-mono)] text-[13px] font-bold uppercase leading-none tracking-[0.18em] antialiased";

type ButtonLinkProps = {
  variant: "primary" | "outline";
  href: string;
  children: React.ReactNode;
  className?: string;
};

type ButtonPrimaryActionProps = {
  variant: "primary";
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
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

type ButtonProps = ButtonLinkProps | ButtonPrimaryActionProps | ButtonIconProps;

export function Button(props: ButtonProps) {
  if (props.variant === "primary" && !("href" in props)) {
    const {
      children,
      className,
      disabled,
      onClick,
      type = "button",
    } = props;
    return (
      <button
        type={type}
        disabled={disabled}
        onClick={onClick}
        className={cn(
          "inline-flex items-center justify-center rounded-[10px] py-[14px] px-[22px] text-white",
          accentGradientButton,
          typoPrimary,
          className
        )}
        style={{ fontFamily: "var(--font-kode-mono), ui-monospace, monospace" }}
      >
        {children}
      </button>
    );
  }

  if (props.variant === "icon") {
    const {
      children,
      className,
      disabled,
      onClick,
      type = "button",
      "aria-label": ariaLabel,
    } = props;
    return (
      <button
        type={type}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={onClick}
        className={cn(
          "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white",
          accentGradientButton,
          disabled && "opacity-50",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50",
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
      ? cn(
          "inline-flex items-center justify-center rounded-[10px] py-[14px] px-[22px] text-white",
          accentGradientButton,
          typoPrimary
        )
      : cn(
          "inline-flex items-center justify-center rounded-[10px] border border-white/20",
          "py-[12px] px-[20px] text-[12px] font-semibold uppercase leading-none tracking-[0.18em]",
          "text-white transition-[background-color,border-color] duration-200",
          "hover:border-white/40 hover:bg-white/[0.06]"
        );

  return (
    <a
      href={href}
      className={cn(linkClasses, className)}
      style={{ fontFamily: "var(--font-kode-mono), ui-monospace, monospace" }}
    >
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
