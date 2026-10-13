import { forwardRef, useId, type InputHTMLAttributes } from 'react';

import { cn } from '../../lib/cn';

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  description?: string | undefined;
  error?: string | undefined;
  label: string;
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  { className, description, error, id, label, required, ...props },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const descriptionId = description ? `${inputId}-description` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [descriptionId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cn('space-y-2', className)}>
      <label className="block text-sm font-bold text-primary" htmlFor={inputId}>
        {label}
        {required ? <span className="ml-1 text-error">*</span> : null}
      </label>
      {description ? (
        <p className="text-sm text-muted" id={descriptionId}>
          {description}
        </p>
      ) : null}
      <input
        aria-describedby={describedBy}
        aria-invalid={error ? true : undefined}
        className="min-h-11 w-full rounded-xl border bg-bg px-4 py-2.5 text-text placeholder:text-muted disabled:cursor-not-allowed disabled:bg-surface disabled:text-muted"
        id={inputId}
        ref={ref}
        required={required}
        {...props}
      />
      {error ? (
        <p className="text-sm font-semibold text-error" id={errorId}>
          {error}
        </p>
      ) : null}
    </div>
  );
});
