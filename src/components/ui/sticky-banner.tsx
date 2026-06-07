"use client";
import React, { useState } from "react";
import type { SVGProps } from "react";
import { motion, useMotionValueEvent, useScroll, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

export const StickyBanner = ({
  className,
  children,
  hideOnScroll = false,
  id,
}: {
  className?: string;
  children: React.ReactNode;
  hideOnScroll?: boolean;
  id?: string;
}) => {
  const [dismissed, setDismissed] = useState(() => {
    if (id) {
      const dismissedAt = localStorage.getItem(`banner_dismissed_${id}`);
      if (dismissedAt) {
        const timePassed = Date.now() - parseInt(dismissedAt, 10);
        // 7 days in milliseconds
        if (timePassed < 7 * 24 * 60 * 60 * 1000) {
          return true;
        }
      }
    }
    return false;
  });

  const [open, setOpen] = useState(!dismissed);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (dismissed) return;
    
    if (hideOnScroll && latest > 40) {
      setOpen(false);
    } else {
      setOpen(true);
    }
  });

  const handleClose = () => {
    setOpen(false);
    setDismissed(true);
    if (id) {
      localStorage.setItem(`banner_dismissed_${id}`, Date.now().toString());
    }
  };

  if (dismissed && !open) {
    // If it's already dismissed on load, we can return null to avoid rendering it completely
    // We only return null on initial load if it was dismissed previously to not break the exit animation
    // But since `open` is false initially if `dismissed` is true, this works perfectly.
    // However, if the user JUST clicked dismiss, we want it to animate out, so we don't unmount immediately.
    // Wait, actually, if we return null immediately, the animation won't play. 
    // It's safer to just let it render as hidden (like the original code did).
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={cn(
            "sticky inset-x-0 top-0 z-40 flex w-full items-center justify-center bg-transparent px-4",
            className,
          )}
          initial={{
            height: 0,
            opacity: 0,
            paddingTop: 0,
            paddingBottom: 0,
          }}
          animate={{
            height: "auto",
            opacity: 1,
            paddingTop: "0.25rem",
            paddingBottom: "0.25rem",
          }}
          exit={{
            height: 0,
            opacity: 0,
            paddingTop: 0,
            paddingBottom: 0,
          }}
          transition={{
            duration: 0.3,
            ease: "easeInOut",
          }}
        >
          {children}

          <motion.button
            initial={{
              scale: 0,
              y: "-50%",
            }}
            animate={{
              scale: 1,
              y: "-50%",
            }}
            className="absolute top-1/2 right-4 cursor-pointer"
            onClick={handleClose}
          >
            <CloseIcon className="h-5 w-5 text-[#0a0a0a]" />
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const CloseIcon = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M18 6l-12 12" />
      <path d="M6 6l12 12" />
    </svg>
  );
};
