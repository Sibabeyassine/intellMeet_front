import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  showWordmark?: boolean;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: { box: "h-7 w-7", text: "text-base", radius: "rounded-md" },
  md: { box: "h-9 w-9", text: "text-lg", radius: "rounded-lg" },
  lg: { box: "h-12 w-12", text: "text-2xl", radius: "rounded-xl" },
};

export function Logo({ className, showWordmark = true, size = "md" }: LogoProps) {
  const s = sizes[size];
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div
        className={cn(
          "relative flex items-center justify-center bg-gradient-accent text-primary-foreground shadow-glow",
          s.box,
          s.radius
        )}
        aria-hidden="true"
      >
        <svg viewBox="0 0 24 24" className="h-1/2 w-1/2" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 7v10a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2z" />
          <path d="m15 10 5-3v10l-5-3" />
        </svg>
        <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-success ring-2 ring-background" />
      </div>
      {showWordmark && (
        <span className={cn("font-display font-bold tracking-tight text-foreground", s.text)}>
          Intell<span className="text-gradient">Meet</span>
        </span>
      )}
    </div>
  );
}
