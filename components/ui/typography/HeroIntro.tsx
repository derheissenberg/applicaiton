import { cn } from "@/lib/utils";

type HeroIntroProps = {
  className?: string;
};

export function Kicker({
  children,
  className,
}: HeroIntroProps & { children: React.ReactNode }) {
  return (
    <p
      className={cn(
        "mb-[22px] text-[13px] uppercase text-white/60 sm:text-[15px]",
        className
      )}
      style={{
        fontFamily: "var(--font-kode-mono), ui-monospace, monospace",
        fontWeight: 500,
        letterSpacing: "0.32em",
      }}
    >
      {children}
    </p>
  );
}

export function HeroTitle({
  children,
  className,
}: HeroIntroProps & { children: React.ReactNode }) {
  return (
    <h2
      className={cn(
        "text-[38px] font-bold leading-[1.05] tracking-[-0.02em] text-white sm:text-5xl lg:text-[56px]",
        className
      )}
      style={{ fontFamily: "var(--font-outfit), system-ui, sans-serif" }}
    >
      {children}
    </h2>
  );
}

export function HeroDescription({
  children,
  className,
}: HeroIntroProps & { children: React.ReactNode }) {
  return (
    <p
      className={cn(
        "mx-auto mt-[22px] max-w-[56ch] text-[18px] font-normal leading-[1.6] text-white/[0.72]",
        className
      )}
      style={{ fontFamily: "var(--font-outfit), system-ui, sans-serif" }}
    >
      {children}
    </p>
  );
}
