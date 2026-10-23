import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
}

export default function Card({ children, className = '', title, subtitle }: Props) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}>
      {(title || subtitle) && (
        <div className="px-5 py-4 border-b border-gray-100">
          {title && <h3 className="text-base font-semibold text-gray-900">{title}</h3>}
          {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}