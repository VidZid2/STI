"use client";

import { Slot } from "@radix-ui/react-slot";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { AnimatePresence, motion } from "motion/react";
import * as React from "react";

import { cn } from "@/lib/utils";

const controlCornerClassName =
  "rounded-lg supports-[corner-shape:squircle]:corner-squircle supports-[corner-shape:squircle]:rounded-[11px]";

const tooltipThemeClassName =
  "[--tt-surface:#111111] [--tt-foreground:#ffffff] dark:[--tt-surface:#f6f3ec] dark:[--tt-foreground:#111111]";

const tooltipContentClassName = cn(
  controlCornerClassName,
  "group/tooltip pointer-events-none relative z-50 max-w-60 whitespace-normal bg-[color:var(--tt-surface)] px-3 py-1.5 font-medium text-[color:var(--tt-foreground)] text-xs leading-snug shadow-[0_4px_24px_-4px_rgba(0,0,0,0.25)]"
);

const tooltipArrowClassName =
  "absolute h-2 w-2 bg-[color:var(--tt-surface)] border-slate-200 dark:border-slate-700/50 group-data-[side=top]/tooltip:border-b group-data-[side=top]/tooltip:border-r group-data-[side=bottom]/tooltip:border-t group-data-[side=bottom]/tooltip:border-l group-data-[side=left]/tooltip:border-t group-data-[side=left]/tooltip:border-r group-data-[side=right]/tooltip:border-b group-data-[side=right]/tooltip:border-l group-data-[side=bottom]/tooltip:-top-1 group-data-[side=left]/tooltip:top-1/2 group-data-[side=right]/tooltip:top-1/2 group-data-[side=left]/tooltip:-right-1 group-data-[side=top]/tooltip:-bottom-1 group-data-[side=bottom]/tooltip:left-1/2 group-data-[side=right]/tooltip:-left-1 group-data-[side=top]/tooltip:left-1/2 group-data-[side=bottom]/tooltip:-translate-x-1/2 group-data-[side=top]/tooltip:-translate-x-1/2 group-data-[side=left]/tooltip:-translate-y-1/2 group-data-[side=right]/tooltip:-translate-y-1/2";

type Side = "top" | "bottom" | "left" | "right";
type TooltipTriggerElement = React.ReactElement<{
  "aria-describedby"?: string;
}>;

export interface TooltipProps {
  children: TooltipTriggerElement;
  content: React.ReactNode;
  side?: Side;
  delay?: number;
  className?: string;
  style?: React.CSSProperties;
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

export function Tooltip({
  children,
  content,
  side = "top",
  delay = 0.15,
  className,
  style,
}: TooltipProps) {
  const [open, setOpen] = React.useState(false);
  const tooltipId = React.useId();
  const isString = typeof content === "string";
  const normalizedContent = isString ? content.trim() : content;

  if (!isTooltipTriggerElement(children)) {
    throw new Error(
      "Tooltip expects a single element child so it can forward hover, focus, and accessibility props."
    );
  }

  React.useEffect(() => {
    if (
      process.env.NODE_ENV !== "production" &&
      isString &&
      ((normalizedContent as string).length > MAX_TOOLTIP_CHARACTERS ||
        (normalizedContent as string).includes("\n"))
    ) {
      console.warn(
        "Tooltip content should stay short, single-line, and non-interactive. Use Popover for longer or multiline content."
      );
    }
  }, [normalizedContent, isString]);

  const childAriaDescribedBy = children.props["aria-describedby"];
  const triggerDescription = open
    ? mergeDescribedBy(childAriaDescribedBy, tooltipId)
    : childAriaDescribedBy;

  if (isString && (normalizedContent as string).length === 0) {
    return children;
  }
  if (!isString && !content) {
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
                    ...style,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 24,
                    mass: 0.6,
                    filter: { type: "tween", ease: "easeOut", duration: 0.2 }
                  }}
                >
                  <motion.span
                    animate={{ scale: 1, rotate: 45, x: ["top", "bottom"].includes(side) ? "-50%" : 0, y: ["left", "right"].includes(side) ? "-50%" : 0 }}
                    className={tooltipArrowClassName}
                    exit={{ scale: 0, rotate: 45, x: ["top", "bottom"].includes(side) ? "-50%" : 0, y: ["left", "right"].includes(side) ? "-50%" : 0 }}
                    initial={{ scale: 0, rotate: 45, x: ["top", "bottom"].includes(side) ? "-50%" : 0, y: ["left", "right"].includes(side) ? "-50%" : 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 28,
                      delay: 0.03,
                    }}
                  />
                  {normalizedContent}
                </motion.div>
              </TooltipPrimitive.Content>
            </TooltipPrimitive.Portal>
          )}
        </AnimatePresence>
      </TooltipPrimitive.Root>
  );
}

export const RTooltipProvider = TooltipPrimitive.Provider;

export { Tooltip as tooltip };
