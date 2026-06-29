"use client";

import {
  AnimatePresence,
  motion,
  useDragControls,
  useMotionValue,
  useReducedMotion,
  type PanInfo,
} from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { EASE_OUT, SPRING_PANEL } from "@/lib/ease";
import { cn } from "@/lib/utils";

export interface BottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Heights (0-1 = fraction of viewport, or "auto"). First entry is default. */
  snapPoints?: (number | "auto")[];
  defaultSnap?: number;
  title?: string;
  description?: string;
  children?: ReactNode;
  className?: string;
  /** Min drag distance (px) past current snap to dismiss. */
  dismissThreshold?: number;
}

export function BottomSheet({
  open,
  onOpenChange,
  snapPoints = [0.5, 0.92],
  defaultSnap = 0,
  title,
  description,
  children,
  className,
  dismissThreshold = 120,
}: BottomSheetProps) {
  const [snap, setSnap] = useState(defaultSnap);
  const [mounted, setMounted] = useState(false);
  const dragY = useMotionValue(0);
  const dragControls = useDragControls();
  const sheetRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const heightRef = useRef(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) setSnap(defaultSnap);
  }, [open, defaultSnap]);

  // Lock background scroll while open. overflow:hidden alone is ignored by
  // iOS Safari — boundary scrolls inside the sheet chain to the page, which
  // scrolls underneath and ends up somewhere else on close. position:fixed
  // is the lock that actually holds; restore the scroll position after.
  useEffect(() => {
    if (!open) return;
    const body = document.body;
    const scrollY = window.scrollY;
    const prev = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      overflow: body.style.overflow,
    };
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.overflow = "hidden";
    return () => {
      body.style.position = prev.position;
      body.style.top = prev.top;
      body.style.left = prev.left;
      body.style.right = prev.right;
      body.style.overflow = prev.overflow;
      window.scrollTo(0, scrollY);
    };
  }, [open]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    const velocity = info.velocity.y;
    const offset = info.offset.y;

    // Strong downward fling or large drag → dismiss.
    if (velocity > 600 || offset > dismissThreshold) {
      const smaller = snapPoints.map((_, i) => i).filter((i) => i < snap);
      if (smaller.length && velocity < 800 && offset < dismissThreshold * 1.6) {
        setSnap(smaller[smaller.length - 1]);
      } else {
        onOpenChange(false);
      }
      dragY.set(0);
      return;
    }

    // Strong upward fling → next snap.
    if (velocity < -500) {
      setSnap(Math.min(snapPoints.length - 1, snap + 1));
      dragY.set(0);
      return;
    }

    // Otherwise snap to nearest by current offset.
    if (offset > 80 && snap > 0) setSnap(snap - 1);
    else if (offset < -80 && snap < snapPoints.length - 1) setSnap(snap + 1);
    dragY.set(0);
  };

  const snapValue = snapPoints[snap];
  const heightStyle =
    snapValue === "auto"
      ? { maxHeight: "92vh" }
      : { height: `${snapValue * 100}vh` };

  // Portal to <body>: an ancestor with backdrop-filter or transform becomes
  // the containing block for fixed descendants, which would position the
  // sheet against that ancestor instead of the viewport.
  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div key="bottom-sheet-container" className="pointer-events-none fixed inset-0 z-[100000]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: EASE_OUT }}
            onClick={() => onOpenChange(false)}
            className="pointer-events-auto absolute inset-0 bg-black/10 dark:bg-black/40 backdrop-blur-md backdrop-saturate-150"
          />
          <motion.div
            ref={sheetRef}
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.02, bottom: 0.4 }}
            dragMomentum={false}
            onDrag={(_, info) => dragY.set(Math.max(0, info.offset.y))}
            onDragEnd={onDragEnd}
            initial={reduce ? { y: 0, opacity: 0, ...heightStyle } : { y: "100%", ...heightStyle }}
            animate={reduce ? { y: 0, opacity: 1, ...heightStyle } : { y: 0, ...heightStyle }}
            exit={reduce ? { y: 0, opacity: 0, ...heightStyle } : { y: "100%", ...heightStyle }}
            transition={
              reduce ? { duration: 0.18, ease: EASE_OUT } : SPRING_PANEL
            }
            onAnimationComplete={() => {
              if (sheetRef.current)
                heightRef.current = sheetRef.current.offsetHeight;
            }}
            className={cn(
              "pointer-events-auto absolute bottom-0 left-0 right-0 mx-auto flex max-w-2xl flex-col overflow-hidden rounded-t-3xl will-change-transform",
              "border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl",
              className,
            )}
            role="dialog"
            aria-modal="true"
            aria-label={title}
          >
            <div
              onPointerDown={(e) => dragControls.start(e)}
              className="flex cursor-grab touch-none flex-col items-center px-4 pb-2 pt-3 active:cursor-grabbing"
            >
              <div className="h-1.5 w-10 rounded-full bg-slate-300 dark:bg-slate-700" />
              {title || description ? (
                <div className="mt-3 w-full">
                  {title ? (
                    <h2 className="text-base font-semibold text-foreground">
                      {title}
                    </h2>
                  ) : null}
                  {description ? (
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {description}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
            {/* overscroll-contain stops boundary scrolls from chaining to the page. */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-6">{children}</div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
