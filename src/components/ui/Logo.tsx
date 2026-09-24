import { cn } from "@/lib/cn";

/** Marca do Doa Fácil (gota/folha). Em fundo escuro use tone="onDark". */
export function Logo({
  size = "md",
  tone = "default",
  showName = true,
  className,
}: {
  size?: "sm" | "md";
  tone?: "default" | "onDark";
  showName?: boolean;
  className?: string;
}) {
  const box = size === "sm" ? "size-[30px] rounded-lg" : "size-9 rounded-control";
  const icon = size === "sm" ? 16 : 20;
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span
        aria-hidden="true"
        className={cn("flex shrink-0 items-center justify-center", box, tone === "onDark" ? "bg-white/15" : "bg-primary")}
      >
        <svg width={icon} height={icon} viewBox="0 0 24 24" fill="none">
          <path d="M12 3C12 3 5 8 5 13.5C5 17.09 8.13 20 12 20C15.87 20 19 17.09 19 13.5C19 8 12 3 12 3Z" fill="#D8F3DC" />
          <path
            d="M12 7C12 7 9 10 9 13C9 14.65 10.34 16 12 16C13.66 16 15 14.65 15 13C15 10 12 7 12 7Z"
            fill={tone === "onDark" ? "rgba(255,255,255,0.5)" : "#fff"}
          />
        </svg>
      </span>
      {showName ? (
        <span
          className={cn(
            "font-extrabold tracking-tight",
            size === "sm" ? "text-base" : "text-lg",
            tone === "onDark" ? "text-white" : "text-text",
          )}
        >
          Doa Fácil
        </span>
      ) : (
        <span className="sr-only">Doa Fácil</span>
      )}
    </span>
  );
}
