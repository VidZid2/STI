"use client";

import { Slot } from "@radix-ui/react-slot";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { AnimatePresence, motion } from "motion/react";
import * as React from "react";

import { cn } from "@/lib/utils";

const controlCornerClassName =
  "rounded-lg supports-[corner-shape:squircle]:corner-squircle supports-[corner-shape:squircle]:rounded-[11px]";

const tooltipThemeClassNames = {
  default: "[--tt-surface:#ffffff] [--tt-foreground:#3268df] [--tt-border:#e5e7eb] dark:[--tt-surface:#ffffff] dark:[--tt-foreground:#3268df] dark:[--tt-border:#e5e7eb]",
  neutral: "[--tt-surface:#ffffff] [--tt-foreground:#111827] [--tt-border:#dfe3e8] dark:[--tt-surface:#ffffff] dark:[--tt-foreground:#111827] dark:[--tt-border:#dfe3e8]",
  primary: "[--tt-surface:#3268df] [--tt-foreground:#ffffff] [--tt-border:#3268df] dark:[--tt-surface:#3268df] dark:[--tt-foreground:#ffffff] dark:[--tt-border:#3268df]"
};

const tooltipContentClassName = cn(
  controlCornerClassName,
  "group/tooltip pointer-events-none relative z-50 max-w-60 whitespace-normal bg-[color:var(--tt-surface)] px-3 py-1.5 font-medium text-[color:var(--tt-foreground)] text-xs leading-snug border border-[color:var(--tt-border)]"
);

const tooltipArrowClassName =
  "absolute h-2 w-2 rotate-45 bg-[color:var(--tt-surface)] " +
  "group-data-[side=bottom]/tooltip:-top-1 group-data-[side=bottom]/tooltip:left-1/2 group-data-[side=bottom]/tooltip:-ml-1 group-data-[side=bottom]/tooltip:border-t group-data-[side=bottom]/tooltip:border-l group-data-[side=bottom]/tooltip:border-[color:var(--tt-border)] " +
  "group-data-[side=top]/tooltip:-bottom-1 group-data-[side=top]/tooltip:left-1/2 group-data-[side=top]/tooltip:-ml-1 group-data-[side=top]/tooltip:border-b group-data-[side=top]/tooltip:border-r group-data-[side=top]/tooltip:border-[color:var(--tt-border)] " +
  "group-data-[side=left]/tooltip:-right-1 group-data-[side=left]/tooltip:top-1/2 group-data-[side=left]/tooltip:-mt-1 group-data-[side=left]/tooltip:border-t group-data-[side=left]/tooltip:border-r group-data-[side=left]/tooltip:border-[color:var(--tt-border)] " +
  "group-data-[side=right]/tooltip:-left-1 group-data-[side=right]/tooltip:top-1/2 group-data-[side=right]/tooltip:-mt-1 group-data-[side=right]/tooltip:border-b group-data-[side=right]/tooltip:border-l group-data-[side=right]/tooltip:border-[color:var(--tt-border)]";

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
  autoShow?: boolean;
  forceHide?: boolean;
  variant?: 'default' | 'neutral' | 'primary';
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

export function InfoTooltip({
  children,
  content,
  side = "top",
  delay = 0.15,
  className,
  autoShow = false,
  forceHide = false,
  variant = 'default',
}: TooltipProps) {
  const [open, setOpen] = React.useState(false);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout>>(undefined);
  const tooltipId = React.useId();
  const normalizedContent = content.trim();

  React.useEffect(() => {
    if (forceHide) {
      setOpen(false);
    } else if (autoShow) {
      const timer = setTimeout(() => setOpen(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [autoShow, forceHide]);

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

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      if (forceHide) {
        return;
      }
      clearTimeout(timeoutRef.current);

      if (nextOpen) {
        if (open) {
          return;
        }

        timeoutRef.current = setTimeout(() => setOpen(true), delay * 1000);
        return;
      }

      setOpen(false);
    },
    [delay, open, forceHide]
  );

  React.useEffect(() => () => clearTimeout(timeoutRef.current), []);

  if (normalizedContent.length === 0) {
    return children;
  }

  return (
    <TooltipPrimitive.Provider delayDuration={0} skipDelayDuration={0}>
      <TooltipPrimitive.Root
        delayDuration={0}
        onOpenChange={handleOpenChange}
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
                    tooltipThemeClassNames[variant],
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
                    fontFamily: "'Inter', sans-serif",
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 24,
                    mass: 0.6,
                  }}
                >
                  <motion.span
                    animate={{ scale: 1, rotate: 45 }}
                    className={tooltipArrowClassName}
                    exit={{ scale: 0, rotate: 45 }}
                    initial={{ scale: 0, rotate: 45 }}
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
    </TooltipPrimitive.Provider>
  );
}

const TooltipProvider = TooltipPrimitive.Provider;
const Tooltip = TooltipPrimitive.Root;
const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      "z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    )}
    {...props}
  />
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider, InfoTooltip as tooltip };
