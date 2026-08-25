import React from 'react';
import { cn } from '../lib/utils';

interface RippleProps {
  className?: string;
  color?: string;
}

export const Ripple: React.FC<RippleProps> = () => {
  return null;
};

export function withRipple<T extends React.HTMLAttributes<HTMLElement>>(
  Component: React.ComponentType<T> | string,
  defaultClassName?: string
) {
  return React.forwardRef<HTMLElement, T & { disableRipple?: boolean }>((props, ref) => {
    const { disableRipple: _disableRipple, className, children, ...rest } = props;
    return React.createElement(
      Component as any,
      {
        ...rest,
        ref,
        className: cn("relative", defaultClassName, className),
      },
      children
    );
  });
}

