'use client';

import {
  motion,
  useInView,
  Variant,
  Transition,
  UseInViewOptions,
} from 'motion/react';
import { ReactNode, useRef, memo } from 'react';

interface InViewProps {
  children: ReactNode;
  variants?: {
    hidden: Variant;
    visible: Variant;
  };
  transition?: Transition;
  viewOptions?: UseInViewOptions;
  as?: keyof typeof motion;
  className?: string;
}

// Optimized variants without filter blur for better performance
const defaultVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0 },
};

export const InView = memo(function InView({
  children,
  variants = defaultVariants,
  transition,
  viewOptions,
  as = 'div',
  className,
}: InViewProps) {
  const ref = useRef<HTMLElement>(null);
  // Add margin to trigger animation slightly before element is in view
  const isInView = useInView(ref, { 
    once: true, // Default to once for performance
    margin: '-50px',
    ...viewOptions 
  });

  const MotionComponent = motion[as] as typeof motion.div;

  return (
    <MotionComponent
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={variants}
      transition={transition}
      className={className}
      style={{ willChange: isInView ? 'auto' : 'opacity, transform' }}
    >
      {children}
    </MotionComponent>
  );
});
