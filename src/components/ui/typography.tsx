import type { HTMLAttributes, ReactNode } from 'react';

type HeadingProps = HTMLAttributes<HTMLHeadingElement> & {
  children: ReactNode;
  display?: boolean;
  level: 1 | 2 | 3 | 4;
};

const headingClasses = {
  1: 'text-h1 font-semibold text-text-primary',
  2: 'text-h2 font-semibold text-text-primary',
  3: 'text-h3 font-semibold text-text-primary',
  4: 'text-h4 font-semibold text-text-primary',
} as const;

export function Heading({
  children,
  className = '',
  display = false,
  level,
  ...props
}: HeadingProps) {
  const Tag = `h${level}` as const;
  const classes = display
    ? 'text-display font-semibold text-text-primary'
    : headingClasses[level];

  return (
    <Tag className={`${classes} ${className}`.trim()} {...props}>
      {children}
    </Tag>
  );
}

export function Body({
  children,
  className = '',
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={`text-body text-text-primary ${className}`.trim()} {...props}>
      {children}
    </p>
  );
}

export function Subtle({
  children,
  className = '',
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={`text-body-sm text-text-secondary ${className}`.trim()}
      {...props}
    >
      {children}
    </p>
  );
}

export function Caption({
  children,
  className = '',
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={`text-caption font-medium uppercase text-text-subtle ${className}`.trim()}
      {...props}
    >
      {children}
    </p>
  );
}
