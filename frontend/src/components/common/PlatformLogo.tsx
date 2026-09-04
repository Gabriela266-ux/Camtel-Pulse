import React from 'react';

export type PlatformLogoSize = 'modal' | 'auth' | 'hero';

export interface PlatformLogoProps {
  size?: PlatformLogoSize;
  className?: string;
}

const sizeClasses: Record<PlatformLogoSize, string> = {
  modal: 'h-24 w-24 sm:h-28 sm:w-28',
  auth: 'h-32 w-32 sm:h-36 sm:w-36',
  hero: 'h-40 w-40 sm:h-48 sm:w-48',
};

export const PlatformLogo: React.FC<PlatformLogoProps> = ({ size = 'auth', className = '' }) => (
  <div
    className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-3xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-sky-950/10 dark:border-slate-700 ${sizeClasses[size]} ${className}`}
  >
    <img
      src="/logo-camtel.png"
      alt="Logo BLUE Financial Pulse — Un point c'est BLUE"
      className="h-full w-full object-contain"
    />
  </div>
);
