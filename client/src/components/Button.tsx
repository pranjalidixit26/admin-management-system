import { theme } from '../theme';
import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'danger' | 'secondary';
}

export default function Button({ variant = 'primary', style, children, ...rest }: ButtonProps) {
  const base = {
    padding: `${theme.spacing(2)} ${theme.spacing(4)}`,
    borderRadius: theme.radius,
    fontSize: '14px',
    fontWeight: 500,
    border: 'none',
    cursor: 'pointer',
    transition: 'opacity 0.15s ease',
  };

  const variants = {
    primary: { backgroundColor: theme.colors.accent, color: '#fff' },
    danger: { backgroundColor: theme.colors.danger, color: '#fff' },
    secondary: {
      backgroundColor: 'transparent',
      color: theme.colors.textPrimary,
      border: `1px solid ${theme.colors.border}`,
    },
  };

  return (
    <button
      {...rest}
      style={{ ...base, ...variants[variant], ...style }}
      onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
      onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
    >
      {children}
    </button>
  );
}