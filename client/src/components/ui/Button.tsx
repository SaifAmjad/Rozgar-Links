import { forwardRef, type ButtonHTMLAttributes } from 'react';

import { getButtonClasses, type ButtonVariant } from './buttonStyles';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, type = 'button', variant = 'primary', ...props },
  ref,
) {
  return (
    <button className={getButtonClasses(variant, className)} ref={ref} type={type} {...props} />
  );
});
