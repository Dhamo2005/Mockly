import React, { useState, useEffect } from 'react';
import { cn } from '../lib/utils';

interface RippleProps {
  className?: string;
  color?: string;
}

export const Ripple: React.FC<RippleProps> = ({ className, color = 'bg-black/10' }) => {
  const [ripples, setRipples] = useState<{ x: number; y: number; size: number; id: number }[]>([]);

  useEffect(() => {
    if (ripples.length > 0) {
      const timer = setTimeout(() => {
        setRipples([]);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [ripples]);

  const addRipple = (event: React.MouseEvent<HTMLDivElement>) => {
    const rippleContainer = event.currentTarget.getBoundingClientRect();
    const size = Math.max(rippleContainer.width, rippleContainer.height) * 2;
    const x = event.clientX - rippleContainer.left - size / 2;
    const y = event.clientY - rippleContainer.top - size / 2;
    
    setRipples(prev => [...prev, { x, y, size, id: Date.now() }]);
  };

  return (
    <div 
      className="absolute inset-0 overflow-hidden pointer-events-none rounded-inherit z-0" 
      onMouseDown={addRipple}
    >
      {ripples.map(ripple => (
        <div
          key={ripple.id}
          className={cn("absolute rounded-full animate-ripple pointer-events-none", color, className)}
          style={{
            width: ripple.size,
            height: ripple.size,
            left: ripple.x,
            top: ripple.y,
            transform: 'scale(0)',
            animation: 'ripple 400ms cubic-bezier(0.2, 0, 0, 1) forwards',
          }}
        />
      ))}
    </div>
  );
};

export function withRipple<T extends React.HTMLAttributes<HTMLElement>>(
  Component: React.ComponentType<T> | string,
  defaultClassName?: string
) {
  return React.forwardRef<HTMLElement, T & { disableRipple?: boolean }>((props, ref) => {
    const { disableRipple, className, children, onMouseDown, ...rest } = props;
    
    const [ripples, setRipples] = useState<{ x: number; y: number; size: number; id: number }[]>([]);

    useEffect(() => {
      if (ripples.length > 0) {
        const timer = setTimeout(() => {
          setRipples((prev) => prev.filter((r) => r.id !== ripples[0].id));
        }, 500);
        return () => clearTimeout(timer);
      }
    }, [ripples]);

    const handleMouseDown = (event: React.MouseEvent<HTMLElement>) => {
      if (!disableRipple) {
        const rect = event.currentTarget.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height) * 2;
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        
        setRipples(prev => [...prev, { x, y, size, id: Date.now() }]);
      }
      if (onMouseDown) {
        onMouseDown(event as any);
      }
    };

    return React.createElement(
      Component as any,
      {
        ...rest,
        ref,
        onMouseDown: handleMouseDown,
        className: cn("relative overflow-hidden", defaultClassName, className),
      },
      <>
        {children}
        {!disableRipple && ripples.map((ripple) => (
          <span
            key={ripple.id}
            className="absolute rounded-full bg-current opacity-[0.12] pointer-events-none"
            style={{
              width: ripple.size,
              height: ripple.size,
              left: ripple.x,
              top: ripple.y,
              transform: 'scale(0)',
              animation: 'ripple 400ms cubic-bezier(0.2, 0, 0, 1) forwards',
            }}
          />
        ))}
      </>
    );
  });
}
