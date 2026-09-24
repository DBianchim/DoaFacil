import { useId, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/cn";

const control =
  "w-full rounded-control border-[1.5px] border-border bg-bg px-3.5 text-sm text-text transition-colors " +
  "placeholder:text-text-2/70 hover:border-disabled focus:border-primary focus:bg-surface focus:outline-none " +
  "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/25 " +
  "disabled:cursor-not-allowed disabled:opacity-60 " +
  "aria-invalid:border-danger aria-invalid:bg-danger-pale aria-invalid:focus-visible:ring-danger/20";

type FieldProps = {
  label: ReactNode;
  /** Texto de ajuda abaixo do campo. */
  hint?: ReactNode;
  /** Mensagem de erro; quando presente o campo fica aria-invalid. */
  error?: ReactNode;
  /** Esconde o rótulo visualmente (continua disponível para leitores de tela). */
  hideLabel?: boolean;
  optional?: boolean;
  className?: string;
};

type RenderArgs = {
  id: string;
  "aria-describedby"?: string;
  "aria-invalid"?: true;
};

function Field({
  label,
  hint,
  error,
  hideLabel,
  optional,
  required,
  className,
  id: givenId,
  children,
}: FieldProps & { id?: string; required?: boolean; children: (a: RenderArgs) => ReactNode }) {
  const autoId = useId();
  const id = givenId ?? autoId;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className={cn("text-[13px] font-semibold text-text", hideLabel && "sr-only")}>
        {label}
        {required && (
          <span className="text-danger" aria-hidden="true">
            {" "}*
          </span>
        )}
        {optional && <span className="font-medium text-text-2"> (opcional)</span>}
      </label>
      {children({ id, "aria-describedby": describedBy, "aria-invalid": error ? true : undefined })}
      {error && (
        <p id={errorId} className="flex items-start gap-1.5 text-xs font-medium text-danger">
          <svg className="mt-px size-3.5 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
            <path d="M12 7.5v5M12 16h.01" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
          {error}
        </p>
      )}
      {hint && (
        <p id={hintId} className="text-xs text-text-2">
          {hint}
        </p>
      )}
    </div>
  );
}

type InputProps = Omit<ComponentProps<"input">, "className"> & FieldProps & { inputClassName?: string };

export function Input({ label, hint, error, hideLabel, optional, className, inputClassName, id, ...props }: InputProps) {
  return (
    <Field {...{ label, hint, error, hideLabel, optional, className, id }} required={props.required}>
      {(a) => <input {...a} {...props} className={cn(control, "min-h-11 py-2.5", inputClassName)} />}
    </Field>
  );
}

type TextareaProps = Omit<ComponentProps<"textarea">, "className"> &
  FieldProps & { inputClassName?: string };

export function Textarea({
  label,
  hint,
  error,
  hideLabel,
  optional,
  className,
  inputClassName,
  id,
  rows = 4,
  ...props
}: TextareaProps) {
  return (
    <Field {...{ label, hint, error, hideLabel, optional, className, id }} required={props.required}>
      {(a) => (
        <textarea {...a} rows={rows} {...props} className={cn(control, "resize-y py-3 leading-relaxed", inputClassName)} />
      )}
    </Field>
  );
}

type SelectProps = Omit<ComponentProps<"select">, "className"> & FieldProps & { inputClassName?: string };

export function Select({
  label,
  hint,
  error,
  hideLabel,
  optional,
  className,
  inputClassName,
  id,
  children,
  ...props
}: SelectProps) {
  return (
    <Field {...{ label, hint, error, hideLabel, optional, className, id }} required={props.required}>
      {(a) => (
        <div className="relative">
          <select {...a} {...props} className={cn(control, "min-h-11 appearance-none py-2.5 pr-10", inputClassName)}>
            {children}
          </select>
          <svg
            className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-text-2"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
          >
            <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}
    </Field>
  );
}
