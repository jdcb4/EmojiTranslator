import type { HTMLAttributes, ReactNode } from 'react';

type SurfaceProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  variant?: 'base' | 'overlay' | 'raised' | 'sunken';
};

const surfaceClasses = {
  base: 'bg-surface-base',
  overlay: 'bg-surface-overlay',
  raised: 'bg-surface-raised',
  sunken: 'bg-surface-sunken',
} as const;

export function Surface({
  children,
  className = '',
  variant = 'raised',
  ...props
}: SurfaceProps) {
  return (
    <div
      className={`${surfaceClasses[variant]} rounded-default border border-border-subtle ${className}`.trim()}
      {...props}
    >
      {children}
    </div>
  );
}
