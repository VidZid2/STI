// @ts-nocheck
"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "motion/react";
import { cn } from "@/lib/utils";

// More classic ASCII and block characters for a proper terminal feel
const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*+=-/\\|<>[]{}~░▒▓';

export interface AsciiTextProps {
  text: string;
  delay?: number;
  duration?: number;
  className?: string;
  as?: React.ElementType;
}

export function AsciiText({
  text,
  delay = 0,
  duration = 1800, // Slower default for a more dramatic effect
  className,
  as: Component = "span",
}: AsciiTextProps) {
  const [displayText, setDisplayText] = useState("");
  const containerRef = useRef<HTMLElement>(null);
  const isInView = useInView(containerRef, { once: true });

  useEffect(() => {
    if (!isInView) return;

    let timeout: NodeJS.Timeout;
    let frameId: number;

    timeout = setTimeout(() => {
      const startTime = Date.now();
      const length = text.length;
      
      let lastUpdate = 0;
      const fps = 20; // Throttle scramble updates to 20fps for a smoother, retro feel (less blurry vibration)
      const frameInterval = 1000 / fps;
      
      const animate = () => {
        const now = Date.now();
        const progress = Math.min((now - startTime) / duration, 1);
        
        // Use an ease-out curve so it starts fast and slows down elegantly
        const easeOutQuad = 1 - (1 - progress) * (1 - progress);
        const revealCount = Math.floor(easeOutQuad * length);
        
        // Throttle the visual updates, but still check progress continuously
        if (now - lastUpdate >= frameInterval || progress === 1) {
          lastUpdate = now;
          let currentText = "";
          for (let i = 0; i < length; i++) {
            if (i < revealCount || text[i] === " " || text[i] === "," || text[i] === ".") {
              currentText += text[i];
            } else {
              currentText += CHARS[Math.floor(Math.random() * CHARS.length)];
            }
          }
          setDisplayText(currentText);
        }

        if (progress < 1) {
          frameId = requestAnimationFrame(animate);
        } else {
          setDisplayText(text);
        }
      };
      
      frameId = requestAnimationFrame(animate);
    }, delay);

    return () => {
      clearTimeout(timeout);
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [isInView, text, delay, duration]);

  return (
    <Component ref={containerRef} className={cn("inline font-mono tracking-tight", className)}>
      {displayText || text.replace(/[^\s,.]/g, "░")} 
    </Component>
  );
}
