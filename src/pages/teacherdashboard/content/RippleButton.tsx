"use client";

import { motion } from "motion/react";
import * as React from "react";
import { cn } from "@/lib/utils";

type Ripple = { id: string; x: number; y: number; size: number };

export const RippleButton = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, children, disabled, onPointerDown, ...props }, ref) => {
    const [ripples, setRipples] = React.useState<Ripple[]>([]);

    const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
      onPointerDown?.(e);

      if (disabled || e.button !== 0) {
        return;
      }

      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const size =
        2 *
        Math.max(
          Math.hypot(x, y),
          Math.hypot(rect.width - x, y),
          Math.hypot(x, rect.height - y),
          Math.hypot(rect.width - x, rect.height - y)
        );
      
      const id = `${Date.now()}-${Math.random()}`;

      setRipples((current) => [...current, { id, x, y, size }]);
    };

    return (
      <motion.button
        className={cn("relative overflow-hidden", className)}
        disabled={disabled}
        onPointerDown={handlePointerDown}
        ref={ref}
        {...props as any}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[inherit]"
        >
          {ripples.map((ripple) => (
            <motion.span
              animate={{ opacity: 0, scale: 1 }}
              className="pointer-events-none absolute rounded-full bg-current"
              initial={{ opacity: 0.16, scale: 0 }}
              key={ripple.id}
              onAnimationComplete={() => {
                setRipples((current) =>
                  current.filter((item) => item.id !== ripple.id)
                );
              }}
              style={{
                height: ripple.size,
                left: ripple.x - ripple.size / 2,
                top: ripple.y - ripple.size / 2,
                width: ripple.size,
              }}
              transition={{
                duration: 0.55,
                ease: [0.22, 1, 0.36, 1],
              }}
            />
          ))}
        </span>
        <span
          className="relative z-10 w-full h-full inline-flex items-center justify-center gap-[inherit]"
        >
          {children}
        </span>
      </motion.button>
    );
  }
);
RippleButton.displayName = "RippleButton";
