import {
  forwardRef,
  useId,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';

import { cn } from '../../lib/cn';

interface FieldShellProps {
  children: ReactNode;
  description?: string | undefined;
  error?: string | undefined;
  inputId: string;
  label: string;
  required?: boolean | undefined;
}

function FieldShell({ children, description, error, inputId, label, required }: FieldShellProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-bold text-primary" htmlFor={inputId}>
        {label}
        {required ? <span className="ml-1 text-error">*</span> : null}
      </label>
      {description ? (
        <p className="text-sm text-muted" id={`${inputId}-description`}>
          {description}
        </p>
      ) : null}
      {children}
      {error ? (
        <p className="text-sm font-semibold text-error" id={`${inputId}-error`}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  description?: string | undefined;
  error?: string | undefined;
  label: string;
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(function SelectField(
  { children, className, description, error, id, label, required, ...props },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const describedBy = [description && `${inputId}-description`, error && `${inputId}-error`]
    .filter(Boolean)
    .join(' ');

  return (
    <FieldShell
      description={description}
      error={error}
      inputId={inputId}
      label={label}
      required={required}
    >
      <select
        aria-describedby={describedBy || undefined}
        aria-invalid={error ? true : undefined}
        className={cn(
          'min-h-11 w-full rounded-xl border bg-bg px-4 py-2.5 text-text disabled:cursor-not-allowed disabled:bg-surface',
          className,
        )}
        id={inputId}
        ref={ref}
        required={required}
        {...props}
      >
        {children}
      </select>
    </FieldShell>
  );
});

interface TextareaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  description?: string | undefined;
  error?: string | undefined;
  label: string;
}

export const TextareaField = forwardRef<HTMLTextAreaElement, TextareaFieldProps>(
  function TextareaField(
    { className, description, error, id, label, required, ...props },
    ref,
  ) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const describedBy = [description && `${inputId}-description`, error && `${inputId}-error`]
    .filter(Boolean)
    .join(' ');

  return (
    <FieldShell
      description={description}
      error={error}
      inputId={inputId}
      label={label}
      required={required}
    >
      <textarea
        aria-describedby={describedBy || undefined}
        aria-invalid={error ? true : undefined}
        className={cn(
          'min-h-28 w-full rounded-xl border bg-bg px-4 py-3 text-text placeholder:text-muted',
          className,
        )}
        id={inputId}
        ref={ref}
        required={required}
        {...props}
      />
    </FieldShell>
    );
  },
);
