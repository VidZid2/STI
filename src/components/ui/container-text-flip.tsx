"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface ContainerTextFlipProps {
  /** Array of words to cycle through in the animation */
  words?: string[];
  /** Time in milliseconds between word transitions */
  interval?: number;
  /** Additional CSS classes to apply to the container */
  className?: string;
  /** Additional CSS classes to apply to the text */
  textClassName?: string;
  /** Duration of the transition animation in milliseconds */
  animationDuration?: number;
}

export function ContainerTextFlip({
  className,
  textClassName,
}: ContainerTextFlipProps) {
  return (
    <p
      className={cn(
        "relative inline-block rounded-lg pt-2 pb-3 pl-2 pr-3 text-left text-4xl font-bold md:text-7xl",
        "bg-white text-blue-600",
        "border border-blue-500",
        "shadow-sm",
        "dark:bg-white dark:text-blue-600 dark:border-blue-500",
        className,
      )}
    >
      <span className={cn("block text-left", textClassName)}>eLMS</span>
    </p>
  );
}
