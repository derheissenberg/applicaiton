import { cn } from "@/lib/utils";

type HeadingProps = {
  children: React.ReactNode;
  className?: string;
};

export function Heading({ children, className }: HeadingProps) {
  return (
    <h1
      className={cn(
        "font-outfit text-4xl font-medium tracking-tight text-white sm:text-5xl",
        className
      )}
    >
      {children}
    </h1>
  );
}
