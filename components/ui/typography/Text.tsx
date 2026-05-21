import { cn } from "@/lib/utils";

type TextProps = {
  children: React.ReactNode;
  className?: string;
  variant?: "body" | "muted" | "kicker";
  as?: "p" | "span" | "div";
};

const variantClasses = {
  body: "font-outfit text-base text-neutral-900",
  muted: "font-outfit text-sm text-white/80 sm:text-base",
  kicker: "type-kicker text-xs uppercase",
};

export function Text({
  children,
  className,
  variant = "body",
  as: Component = "p",
}: TextProps) {
  return (
    <Component className={cn(variantClasses[variant], className)}>
      {children}
    </Component>
  );
}
