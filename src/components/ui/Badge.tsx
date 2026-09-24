import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

export type BadgeTone = "available" | "reserved" | "donated" | "highlight" | "neutral" | "condition";

const tones: Record<BadgeTone, string> = {
  available: "bg-primary-pale text-primary",
  reserved: "bg-accent-pale text-accent-ink",
  donated: "bg-muted text-text-2",
  highlight: "bg-primary text-white",
  neutral: "bg-bg text-text-2",
  condition: "bg-accent-pale text-accent-ink",
};

type BadgeProps = ComponentProps<"span"> & {
  tone?: BadgeTone;
  /** "status": maiúsculas 11/700 (selos sobre fotos). "tag": 12/600 (categoria, condição). */
  shape?: "status" | "tag";
  /** Bolinha antes do texto. Decorativa: o texto sempre diz o estado. */
  dot?: boolean;
};

export function Badge({ tone = "neutral", shape = "status", dot, className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full whitespace-nowrap",
        shape === "status"
          ? "px-2.5 py-0.5 text-badge font-bold uppercase"
          : "px-2.5 py-0.5 text-xs font-semibold",
        tones[tone],
        className,
      )}
      {...props}
    >
      {dot && <span aria-hidden="true" className="size-[7px] shrink-0 rounded-full bg-current" />}
      {children}
    </span>
  );
}

export type ItemStatus = "disponivel" | "reservado" | "doado";

const statusMap: Record<ItemStatus, { label: string; tone: BadgeTone }> = {
  disponivel: { label: "Disponível", tone: "available" },
  reservado: { label: "Reservado", tone: "reserved" },
  doado: { label: "Doado", tone: "donated" },
};

export function StatusBadge({
  status,
  ...props
}: Omit<BadgeProps, "tone" | "children"> & { status: ItemStatus }) {
  const s = statusMap[status];
  return (
    <Badge tone={s.tone} {...props}>
      {s.label}
    </Badge>
  );
}
