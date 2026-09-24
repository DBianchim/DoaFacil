import type { ReactNode } from "react";

/** Estado vazio: ícone, título, explicação e ação opcional. */
export function EmptyState({
  icon = "🌱",
  title,
  children,
  action,
}: {
  icon?: string;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-disabled bg-surface px-6 py-14 text-center">
      <span aria-hidden="true" className="flex size-16 items-center justify-center rounded-2xl bg-primary-pale text-3xl">
        {icon}
      </span>
      <h2 className="text-lg font-bold">{title}</h2>
      {children && <div className="max-w-md text-sm text-text-2">{children}</div>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
