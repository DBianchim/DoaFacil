import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "neutral"
  | "ghost"
  | "danger"
  | "danger-soft"
  | "success-soft"
  | "accent-soft"
  | "whatsapp";

export type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold transition-colors " +
  "select-none disabled:cursor-not-allowed aria-disabled:cursor-not-allowed aria-disabled:pointer-events-none";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-white hover:bg-primary-hover disabled:bg-disabled aria-disabled:bg-disabled",
  secondary:
    "border-[1.5px] border-primary bg-surface text-primary hover:bg-primary-mist disabled:border-disabled disabled:text-text-2",
  neutral:
    "border-[1.5px] border-border bg-surface text-text hover:bg-bg disabled:text-text-2",
  ghost: "text-primary hover:bg-primary-mist disabled:text-text-2",
  danger: "bg-danger text-white hover:bg-[#9a1d13] disabled:bg-disabled",
  "danger-soft":
    "border-[1.5px] border-danger-border bg-danger-pale text-danger hover:bg-[#fde4e2] disabled:opacity-60",
  "success-soft":
    "border-[1.5px] border-primary-light bg-primary-pale text-primary hover:bg-[#c6ecd0] disabled:opacity-60",
  "accent-soft":
    "border-[1.5px] border-accent-border bg-accent-pale text-accent-ink hover:bg-[#fde6d5] disabled:opacity-60",
  whatsapp: "bg-whatsapp text-white hover:bg-[#19663f] disabled:bg-disabled",
};

// Todas as alturas respeitam a área de toque mínima de 44px.
const sizes: Record<ButtonSize, string> = {
  sm: "min-h-11 rounded-[9px] px-3.5 text-[13px]",
  md: "min-h-11 rounded-control px-5 text-sm",
  lg: "min-h-13 rounded-xl px-6 text-[15px]",
};

type StyleProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
};

export function buttonClasses({
  variant = "primary",
  size = "md",
  fullWidth,
  className,
}: StyleProps & { className?: string }) {
  return cn(base, variants[variant], sizes[size], fullWidth && "w-full", className);
}

function Spinner() {
  return (
    <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

type ButtonProps = ComponentProps<"button"> &
  StyleProps & {
    /** Mostra um spinner, desabilita o botão e anuncia "carregando" para leitores de tela. */
    loading?: boolean;
  };

export function Button({
  variant,
  size,
  fullWidth,
  loading,
  className,
  disabled,
  type = "button",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClasses({ variant, size, fullWidth, className })}
      {...props}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}

type ButtonLinkProps = ComponentProps<typeof Link> & StyleProps;

/** Link com aparência de botão (navegação real, não um botão com onClick). */
export function ButtonLink({ variant, size, fullWidth, className, ...props }: ButtonLinkProps) {
  return <Link className={buttonClasses({ variant, size, fullWidth, className })} {...props} />;
}
