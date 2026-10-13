import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { getButtonClasses, type ButtonVariant } from './buttonStyles';

interface ButtonLinkProps {
  children: ReactNode;
  className?: string;
  to: string;
  variant?: ButtonVariant;
}

export function ButtonLink({ children, className, to, variant = 'primary' }: ButtonLinkProps) {
  return (
    <Link className={getButtonClasses(variant, className)} to={to}>
      {children}
    </Link>
  );
}
