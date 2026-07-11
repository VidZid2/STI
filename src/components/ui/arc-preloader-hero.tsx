"use client";

import * as React from "react";
import {
  animate,
  AnimatePresence,
  motion,
  useMotionValue,
  useTransform,
} from "motion/react"; // Note: using motion/react as it's typically aliased or used interchangeably, but motion/react is newer. Given we installed motion, I'll stick to motion/react if possible, but let me use 'motion/react' if that's what was requested, wait let me check the package installed.
import { cn } from "@/lib/utils";

/* ── types ───────────────────────────────────────────────────── */

export type ArcRevealGreeting = {
  /** Greeting text in the target script */
  text: string;
  /** Optional `lang` attribute applied to the span (helps screen readers / font rendering) */
  lang?: string;
};

export interface ArcRevealHeroProps {
  /** Greetings cycled before the arc reveal. */
  greetings?: ArcRevealGreeting[];
  /** How long each greeting is held on screen (ms). */
  greetingHold?: number;
  /** Duration of the curved curtain reveal (ms). */
  revealDuration?: number;
  /** Outer `<section>` class. Receives the *post-reveal* surface. */
  className?: string;
  /** Class for the intro (pre-reveal) overlay surface. */
  introClassName?: string;
  /** Class for the cycled greeting `<span>`. */
  greetingClassName?: string;
  /** Class for the wrapper around `children` (the revealed content). */
  revealClassName?: string;
  /**
   * Optional `sessionStorage` key — when set, the intro plays only once per
   * session for the same key. Leave unset to replay on every mount.
   */
  storageKey?: string;
  /** Content shown after the curtain reveal (the "landing"). */
  children?: React.ReactNode;
  /** Callback fired when the reveal animation finishes */
  onComplete?: () => void;
  /** If true, the intro will wait on the last phrase or loop until false */
  isLoading?: boolean;
}

/* ── defaults ────────────────────────────────────────────────── */

const DEFAULT_GREETINGS: ArcRevealGreeting[] = [
  { text: "Quiet." },
  { text: "Sharp." },
  { text: "Calm." },
  { text: "Crafted." },
  { text: "Considered." },
  { text: "Composed." },
  { text: "Honest." },
  { text: "Ready." },
];

type Phase = "intro" | "reveal" | "done";

/* ── component ───────────────────────────────────────────────── */

export function ArcRevealHero({
  greetings = DEFAULT_GREETINGS,
  greetingHold = 620,
  revealDuration = 1500,
  className,
  introClassName,
  greetingClassName,
  revealClassName,
  storageKey,
  children,
  onComplete,
  isLoading = false,
}: ArcRevealHeroProps) {
  const [phase, setPhase] = React.useState<Phase>("intro");
  const [index, setIndex] = React.useState(0);

  // Drive the arc shape from a single 0→1 progress, scaled for objectBoundingBox.
  const progress = useMotionValue(0);
  const clipPathD = useTransform(progress, (p: number) => {
    const edge = 1.1 - p * 1.4;
    const control = edge + 0.25;
    return `M 0 0 L 1 0 L 1 ${edge} Q 0.5 ${control} 0 ${edge} Z`;
  });

  // Honor replay-suppression on mount.
  React.useEffect(() => {
    if (storageKey && typeof window !== "undefined") {
      try {
        const stored = window.sessionStorage.getItem(storageKey);
        if (stored === "done" || stored === "true") {
          setPhase("done");
          onComplete?.();
        }
      } catch {
        /* sessionStorage can throw in private mode — fall through */
      }
    }
  }, [storageKey, onComplete]);

  // Greeting cycle.
  React.useEffect(() => {
    if (phase !== "intro") return;
    const isLast = index >= greetings.length - 1;
    
    // If it's the last greeting and we are NOT loading, proceed to reveal
    if (isLast && !isLoading) {
      const t = window.setTimeout(() => setPhase("reveal"), greetingHold + 220);
      return () => window.clearTimeout(t);
    }
    
    // If it's the last greeting but we ARE loading, stay on the last phrase
    if (isLast && isLoading) {
      return; // Do nothing, just wait on the last phrase
    }

    // If we are NOT loading, and we've shown at least a couple of phrases, we can skip the rest and reveal early!
    // This prevents the user from being forced to watch 20 loading phrases on a fast connection.
    const minGreetings = Math.min(2, greetings.length);
    if (!isLoading && index >= minGreetings - 1) {
      const t = window.setTimeout(() => setPhase("reveal"), greetingHold + 220);
      return () => window.clearTimeout(t);
    }

    // Move to next greeting
    const t = window.setTimeout(() => setIndex((i) => i + 1), greetingHold);
    return () => window.clearTimeout(t);
  }, [phase, index, greetingHold, greetings.length, isLoading]);

  // Drive the curtain reveal.
  React.useEffect(() => {
    if (phase !== "reveal") return;
    const controls = animate(progress, 1, {
      duration: revealDuration / 1000,
      ease: [0.85, 0, 0.15, 1],
      onComplete: () => {
        if (storageKey && typeof window !== "undefined") {
          try {
            window.sessionStorage.setItem(storageKey, "done");
          } catch {
            /* ignore */
          }
        }
        setPhase("done");
        onComplete?.();
      },
    });
    return () => controls.stop();
  }, [phase, progress, revealDuration, storageKey]);

  const showOverlay = phase !== "done";
  const current = greetings[Math.min(index, greetings.length - 1)];

  return (
    <div
      aria-label="Hero"
      className={cn(
        "relative isolate min-h-screen w-full overflow-hidden bg-white text-black",
        className,
      )}
    >
      <div className={cn("relative z-0", revealClassName)}>{children}</div>

      <AnimatePresence>
        {showOverlay && (
          <motion.div
            key="arc-reveal-overlay"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
            style={{ clipPath: "url(#yellow-curtain-clip)", willChange: "clip-path, transform, opacity" }}
            className={cn(
              "absolute inset-x-0 top-0 z-[9999] h-screen overflow-hidden bg-[#eab308]",
              introClassName,
            )}
          >
            {/* Cycled greeting */}
            <div className="absolute inset-0 flex items-center justify-center">
              <AnimatePresence mode="wait">
                {phase === "intro" && current && (
                  <motion.span
                    key={`${index}-${current.text}`}
                    lang={current.lang}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                    className={cn(
                      "select-none px-6 text-center text-5xl font-semibold tracking-tight text-[#1d4ed8] sm:text-6xl md:text-7xl",
                      greetingClassName,
                    )}
                  >
                    {current.text}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>

            {/* Rising curved curtain mask */}
            <svg width="0" height="0" className="absolute">
              <clipPath id="yellow-curtain-clip" clipPathUnits="objectBoundingBox">
                <motion.path d={clipPathD} />
              </clipPath>
            </svg>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ArcRevealHero;
