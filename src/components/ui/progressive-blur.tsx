// @ts-nocheck
"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface ProgressiveBlurProps {
  className?: string;
  height?: string;
  position?: "top" | "bottom" | "both";
  blurLevels?: number[];
}

export function ProgressiveBlur({
  className,
  height = "30%",
  position = "bottom",
  blurLevels = [0.5, 1, 2, 4, 8, 16, 32, 64],
}: ProgressiveBlurProps) {
  const renderBlurContainer = (pos: "top" | "bottom") => {
    const isTop = pos === "top";
    return (
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 z-10 overflow-hidden",
          isTop ? "top-0" : "bottom-0",
          className
        )}
        style={{ height }}
      >
        {blurLevels.map((blur, index) => {
          const ratio = (index + 1) / blurLevels.length;
          const maskStart = isTop ? 0 : 100 - ratio * 100;
          const maskEnd = isTop ? ratio * 100 : 100;
          
          return (
            <div
              key={index}
              className="absolute inset-0"
              style={{
                backdropFilter: `blur(${blur}px)`,
                WebkitBackdropFilter: `blur(${blur}px)`,
                maskImage: `linear-gradient(to ${isTop ? "bottom" : "top"}, rgba(0,0,0,1) ${maskStart}%, rgba(0,0,0,0) ${maskEnd}%)`,
                WebkitMaskImage: `linear-gradient(to ${isTop ? "bottom" : "top"}, rgba(0,0,0,1) ${maskStart}%, rgba(0,0,0,0) ${maskEnd}%)`,
              }}
            />
          );
        })}
      </div>
    );
  };

  return (
    <>
      {(position === "top" || position === "both") && renderBlurContainer("top")}
      {(position === "bottom" || position === "both") && renderBlurContainer("bottom")}
    </>
  );
}

export default ProgressiveBlur;
