"use client";

import { Slot } from "@radix-ui/react-slot";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { AnimatePresence, motion } from "motion/react";
import * as React from "react";

import { cn } from "@/lib/utils";

const controlCornerClassName =
  "rounded-lg supports-[corner-shape:squircle]:corner-squircle supports-[corner-shape:squircle]:rounded-[11px]";

const tooltipThemeClassName =
  "[--tt-surface:#ffffff] [--tt-foreground:#2563eb] dark:[--tt-surface:#1e293b] dark:[--tt-foreground:#60a5fa]";

const tooltipContentClassName = cn(
  controlCornerClassName,
  "group/tooltip pointer-events-none relative z-50 max-w-60 whitespace-normal bg-[color:var(--tt-surface)] px-3 py-1.5 font-medium text-[color:var(--tt-foreground)] text-xs leading-snug border border-slate-200 dark:border-slate-800"
);

const tooltipArrowClassName =
  "absolute h-2 w-2 group-data-[side=bottom]/tooltip:-top-1 group-data-[side=left]/tooltip:top-1/2 group-data-[side=right]/tooltip:top-1/2 group-data-[side=left]/tooltip:-right-1 group-data-[side=top]/tooltip:-bottom-1 group-data-[side=bottom]/tooltip:left-1/2 group-data-[side=right]/tooltip:-left-1 group-data-[side=top]/tooltip:left-1/2 group-data-[side=bottom]/tooltip:-translate-x-1/2 group-data-[side=top]/tooltip:-translate-x-1/2 group-data-[side=left]/tooltip:-translate-y-1/2 group-data-[side=right]/tooltip:-translate-y-1/2";

type Side = "top" | "bottom" | "left" | "right";
type TooltipTriggerElement = React.ReactElement<{
  "aria-describedby"?: string;
}>;

export interface TooltipProps {
  children: TooltipTriggerElement;
  content: string;
  side?: Side;
  delay?: number;
  className?: string;
}

const MAX_TOOLTIP_CHARACTERS = 80;

function isTooltipTriggerElement(
  node: React.ReactNode
): node is TooltipTriggerElement {
  return React.isValidElement(node) && node.type !== React.Fragment;
}

function mergeDescribedBy(...ids: Array<string | undefined>) {
  const merged = ids.filter(Boolean).join(" ");

  return merged.length > 0 ? merged : undefined;
}

export const TooltipProvider = TooltipPrimitive.Provider;

export function Tooltip({
  children,
  content,
  side = "top",
  delay = 0.15,
  className,
}: TooltipProps) {
  const [open, setOpen] = React.useState(false);
  const tooltipId = React.useId();
  const normalizedContent = content.trim();

  if (!isTooltipTriggerElement(children)) {
    throw new Error(
      "Tooltip expects a single element child so it can forward hover, focus, and accessibility props."
    );
  }

  React.useEffect(() => {
    if (
      process.env.NODE_ENV !== "production" &&
      (normalizedContent.length > MAX_TOOLTIP_CHARACTERS ||
        normalizedContent.includes("\n"))
    ) {
      console.warn(
        "Tooltip content should stay short, single-line, and non-interactive. Use Popover for longer or multiline content."
      );
    }
  }, [normalizedContent]);

  const childAriaDescribedBy = children.props["aria-describedby"];
  const triggerDescription = open
    ? mergeDescribedBy(childAriaDescribedBy, tooltipId)
    : childAriaDescribedBy;

  if (normalizedContent.length === 0) {
    return children;
  }

  return (
      <TooltipPrimitive.Root
        delayDuration={delay * 1000}
        onOpenChange={setOpen}
        open={open}
      >
        <TooltipPrimitive.Trigger asChild>
          <Slot aria-describedby={triggerDescription}>{children}</Slot>
        </TooltipPrimitive.Trigger>

        <AnimatePresence>
          {open && (
            <TooltipPrimitive.Portal forceMount>
              <TooltipPrimitive.Content
                align="center"
                asChild
                avoidCollisions
                collisionPadding={12}
                forceMount
                side={side}
                sideOffset={10}
              >
                <motion.div
                  animate={{
                    opacity: 1,
                    scale: 1,
                    filter: "blur(0px)",
                  }}
                  className={cn(
                    tooltipThemeClassName,
                    tooltipContentClassName,
                    className
                  )}
                  exit={{
                    opacity: 0,
                    scale: 0.92,
                    filter: "blur(4px)",
                  }}
                  id={tooltipId}
                  initial={{
                    opacity: 0,
                    scale: 0.92,
                    filter: "blur(4px)",
                  }}
                  role="tooltip"
                  style={{
                    transformOrigin:
                      "var(--radix-tooltip-content-transform-origin)",
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 24,
                    mass: 0.6,
                  }}
                >
                  <div className={tooltipArrowClassName}>
                    <motion.span
                      animate={{ scale: 1, rotate: 45 }}
                      className="block h-full w-full bg-[color:var(--tt-surface)] border-slate-200 dark:border-slate-800 group-data-[side=bottom]/tooltip:border-t group-data-[side=bottom]/tooltip:border-l group-data-[side=top]/tooltip:border-b group-data-[side=top]/tooltip:border-r group-data-[side=left]/tooltip:border-t group-data-[side=left]/tooltip:border-r group-data-[side=right]/tooltip:border-b group-data-[side=right]/tooltip:border-l"
                      exit={{ scale: 0, rotate: 45 }}
                      initial={{ scale: 0, rotate: 45 }}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 28,
                        delay: 0.03,
                      }}
                    />
                  </div>
                  {normalizedContent}
                </motion.div>
              </TooltipPrimitive.Content>
            </TooltipPrimitive.Portal>
          )}
        </AnimatePresence>
      </TooltipPrimitive.Root>
  );
}

export { Tooltip as tooltip };
