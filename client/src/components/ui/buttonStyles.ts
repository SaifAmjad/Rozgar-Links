import { cn } from '../../lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-brand-blue text-white shadow-soft hover:bg-primary',
  secondary: 'bg-primary text-white shadow-soft hover:bg-brand-blue',
  outline: 'border border-primary bg-bg text-primary hover:bg-surface',
  ghost: 'text-primary hover:bg-surface',
};

export function getButtonClasses(variant: ButtonVariant, className?: string) {
  return cn(
    'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-55',
    variantClasses[variant],
    className,
  );
}
