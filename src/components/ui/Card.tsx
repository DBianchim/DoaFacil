import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

type CardProps = ComponentProps<"div"> & {
  /** Espaçamento interno padrão. Use "none" quando o conteúdo encosta nas bordas (ex.: foto do item). */
  padding?: "none" | "sm" | "md" | "lg";
};

const paddings = {
  none: "",
  sm: "p-4",
  md: "p-5 sm:p-6",
  lg: "p-6 sm:p-8",
};

export function Card({ padding = "md", className, ...props }: CardProps) {
  return (
    <div
      className={cn("rounded-card border border-border bg-surface", paddings[padding], className)}
      {...props}
    />
  );
}
