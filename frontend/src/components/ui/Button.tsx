'use client';

import { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
}

const styles: Record<Variant, string> = {
  primary:
    'bg-emerald-600 hover:bg-emerald-700 text-white disabled:bg-emerald-300',
  secondary:
    'bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300',
  danger: 'bg-red-600 hover:bg-red-700 text-white disabled:bg-red-300',
  ghost: 'bg-transparent hover:bg-gray-100 text-gray-700',
};

export default function Button({
  variant = 'primary',
  loading,
  children,
  className = '',
  disabled,
  ...rest
}: Props) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed ${styles[variant]} ${className}`}
    >
      {loading ? 'Working…' : children}
    </button>
  );
}