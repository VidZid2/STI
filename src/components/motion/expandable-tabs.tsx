"use client";

import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Variants,
} from "motion/react";
import { X, Lock } from "lucide-react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { EASE_OUT } from "@/lib/ease";
import { cn } from "@/lib/utils";

export type ExpandableTabsItem = {
  id: string;
  /** String label — shown inside the active tab and used as the button's accessible name. */
  label: string;
  icon: ReactNode;
  /** Panel shown above the bar when this tab is active. */
  content?: ReactNode;
  isLocked?: boolean;
  onClick?: () => void;
  isSeparator?: boolean;
};

export type ExpandableTabsClassNames = {
  root?: string;
  panel?: string;
  bar?: string;
  tab?: string;
  activeTab?: string;
  icon?: string;
  label?: string;
  pill?: string;
};



type Size = { width: number; height: number };

// DynamicIsland-style real width/height motion, tuned tighter here so the tab
// bar feels controlled instead of elastic.
const SHELL_SPRING = { type: "spring", duration: 0.58, bounce: 0.06 } as const;

// Position-only tab layout motion keeps switching loose without stretching
// icons or letting the label linger.
const TAB_CHANGE_SPRING = {
  type: "spring",
  duration: 0.46,
  bounce: 0.04,
} as const;

const CONTENT_SPRING = {
  type: "spring",
  stiffness: 240,
  damping: 24,
} as const;

const TAB_W = 36;
const BAR_X = 12;
const BAR_GAP = 6;
const ROOT_BORDER = 2;
const ICON_W = 20;
const ACTIVE_LEFT_PAD = 10;
const ACTIVE_RIGHT_PAD = 20;
const LABEL_GAP = 6;
const PANEL_DOCK_GAP = 4;

// Content is clipped above the dock so rows never pass through the icon bar.
// It enters from slightly above instead of from the dock line.
const CONTENT_VARIANTS: Variants = {
  enter: { y: -8, scale: 0.98, opacity: 0, filter: "blur(4px)" },
  center: { y: 0, scale: 1, opacity: 1, filter: "blur(0px)" },
  exit: {
    y: -6,
    scale: 0.98,
    opacity: 0,
    filter: "blur(4px)",
    transition: { duration: 0.08, ease: EASE_OUT },
  },
};

const REDUCED_CONTENT_VARIANTS: Variants = {
  enter: { opacity: 0, filter: "blur(0px)" },
  center: { opacity: 1, filter: "blur(0px)" },
  exit: {
    opacity: 0,
    filter: "blur(0px)",
    transition: { duration: 0.08, ease: EASE_OUT },
  },
};


function sameSize(a: Size | null | undefined, b: Size | null | undefined) {
  return a?.width === b?.width && a?.height === b?.height;
}

function sameWidths(a: Record<string, number>, b: Record<string, number>) {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);

  if (aKeys.length !== bKeys.length) {
    return false;
  }

  return aKeys.every((key) => a[key] === b[key]);
}

function useContentSize() {
  const [node, setNode] = useState<HTMLElement | null>(null);
  const [size, setSize] = useState<Size | null>(null);

  const measure = useCallback(() => {
    if (!node) return;
    const next = { width: node.offsetWidth, height: node.offsetHeight };
    setSize((current) => (sameSize(current, next) ? current : next));
  }, [node]);

  useLayoutEffect(() => {
    measure();
  }, [measure]);

  useEffect(() => {
    if (!node || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [node, measure]);

  const refCallback = useCallback((el: HTMLElement | null) => {
    if (el) {
      setNode(el);
    }
  }, []);

  return [refCallback, size] as const;
}

function useLabelWidths(items: ExpandableTabsItem[]) {
  const refs = useRef<Record<string, HTMLSpanElement | null>>({});
  const [widths, setWidths] = useState<Record<string, number>>({});

  const setLabelMeasureRef = useCallback(
    (id: string) => (node: HTMLSpanElement | null) => {
      refs.current[id] = node;
    },
    [],
  );

  const measure = useCallback(() => {
    const next: Record<string, number> = {};

    for (const item of items) {
      const node = refs.current[item.id];

      if (node) {
        next[item.id] = Math.ceil(node.offsetWidth);
      }
    }

    setWidths((current) => (sameWidths(current, next) ? current : next));
  }, [items]);

  useLayoutEffect(() => {
    measure();
  }, [measure]);

  useEffect(() => {
    if (typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(measure);

    for (const item of items) {
      const node = refs.current[item.id];

      if (node) {
        observer.observe(node);
      }
    }

    return () => observer.disconnect();
  }, [items, measure]);

  return { setLabelMeasureRef, widths };
}

export interface ExpandableTabsProps {
  items: ExpandableTabsItem[];
  value?: string | null;
  selected?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
  className?: string;
  classNames?: ExpandableTabsClassNames;
  expandDirection?: "up" | "down";
  hideCloseButton?: boolean;
  fullWidth?: boolean;
  barHeight?: number;
}

export function ExpandableTabs({
  items,
  value,
  selected,
  defaultValue = null,
  onValueChange,
  className,
  classNames,
  expandDirection = "up",
  hideCloseButton = false,
  fullWidth = false,
  barHeight = 52,
}: ExpandableTabsProps) {
  const BAR_H = barHeight;
  const reduce = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const [sizerRef, size] = useContentSize();
  const { setLabelMeasureRef, widths: labelWidths } = useLabelWidths(items);

  const controlled = value !== undefined;
  const [internal, setInternal] = useState<string | null>(defaultValue);
  const [shakeId, setShakeId] = useState<string | null>(null);
  const activeId = controlled ? value : internal;
  const active = items.find((item) => item.id === activeId) ?? null;
  const visualActiveId = active?.id ?? null;
  const selectedId = selected !== undefined ? selected : visualActiveId;
  const highlightedId = visualActiveId ?? selectedId;

  const setActive = useCallback(
    (next: string | null) => {
      if (!controlled) setInternal(next);
      onValueChange?.(next);
    },
    [controlled, onValueChange],
  );

  // Outside click / Escape closes — it behaves like an open menu.
  useEffect(() => {
    if (!visualActiveId) return;
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setActive(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActive(null);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [setActive, visualActiveId]);

  const getActiveTabWidth = useCallback(
    (item: ExpandableTabsItem) =>
      Math.max(
        TAB_W,
        ACTIVE_LEFT_PAD +
          ICON_W +
          LABEL_GAP +
          (labelWidths[item.id] ? labelWidths[item.id] + 4 : 0) +
          ACTIVE_RIGHT_PAD,
      ),
    [labelWidths],
  );

  const highlightedItem = items.find((item) => item.id === highlightedId);

  const barWidth = highlightedItem
    ? (items.length - 1) * TAB_W +
      getActiveTabWidth(highlightedItem) +
      Math.max(0, items.length - 1) * BAR_GAP +
      BAR_X +
      ROOT_BORDER
    : items.length * TAB_W +
      Math.max(0, items.length - 1) * BAR_GAP +
      BAR_X +
      ROOT_BORDER;

  const targetSize = {
    width: active && size ? Math.max(size.width + 16 + ROOT_BORDER, barWidth) : barWidth,
    height: active && active.content && size ? Math.max(size.height + BAR_H + PANEL_DOCK_GAP + 8 + ROOT_BORDER, BAR_H + ROOT_BORDER) : BAR_H + ROOT_BORDER,
  };

  return (
    <>
      <motion.div
        ref={rootRef}
        initial={false}
        animate={
          targetSize
            ? { width: fullWidth ? "100%" : targetSize.width, height: targetSize.height }
            : undefined
        }
        transition={reduce ? { duration: 0 } : SHELL_SPRING}
        style={{ 
          transformOrigin: expandDirection === "up" ? "bottom center" : "top center",
          willChange: "transform, width, height",
          transform: "translateZ(0)"
        }}
        className={cn(
          "relative overflow-clip rounded-[20px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)]",
          className,
          classNames?.root,
        )}
      >
        <div
          className={cn(
            "absolute left-0 right-0 z-10 px-2",
            expandDirection === "up" ? "top-0 pt-2 pb-0" : "bottom-0 pb-2 pt-0",
            classNames?.panel,
          )}
          style={{ 
            bottom: expandDirection === "up" ? BAR_H + PANEL_DOCK_GAP : undefined,
            top: expandDirection === "down" ? BAR_H + PANEL_DOCK_GAP : undefined
          }}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            {active ? (
              <motion.div
                key={active.id}
                ref={sizerRef}
                variants={reduce ? REDUCED_CONTENT_VARIANTS : CONTENT_VARIANTS}
                initial="enter"
                animate="center"
                exit="exit"
                transition={
                  reduce ? { duration: 0.15, ease: EASE_OUT } : CONTENT_SPRING
                }
                className={fullWidth ? "w-full" : "w-max"}
                style={{
                  transformOrigin: "top center",
                  willChange: "transform, opacity, filter",
                }}
              >
                {active.content}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        <div
          role="tablist"
          aria-label="Navigation tabs"
          aria-orientation="horizontal"
          className={cn(
            "absolute left-0 z-20 flex w-full items-center justify-start gap-[6px] py-2 px-1.5 overflow-x-auto no-scrollbar",
            expandDirection === "up" ? "bottom-0" : "top-0",
            classNames?.bar,
          )}
          style={{ height: BAR_H }}
        >
          {items.map((item) => {
            if (item.isSeparator) {
              return <div key={item.id} className="flex-1" />;
            }

            const isActive = item.id === visualActiveId;
            const isHighlighted = item.id === highlightedId;
            const activeTabWidth = getActiveTabWidth(item);
            const labelWidth = labelWidths[item.id] ?? 0;

            return (
              <motion.button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={isHighlighted}
                aria-label={item.label}
                onClick={() => {
                  if (item.isLocked) {
                    setShakeId(item.id);
                    setTimeout(() => setShakeId(null), 500);
                    return;
                  }
                  if (item.onClick) {
                    item.onClick();
                    return;
                  }
                  setActive(isActive ? null : item.id);
                }}
                layout={reduce ? false : "position"}
                animate={{
                  width: isHighlighted ? activeTabWidth : TAB_W,
                }}
                transition={reduce ? { duration: 0 } : TAB_CHANGE_SPRING}
                className={cn(
                  "relative isolate flex h-9 min-w-[36px] shrink-0 items-center justify-center overflow-hidden rounded-[12px] px-2 text-sm font-medium outline-none",
                  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  isHighlighted && "min-w-0 justify-start pl-2.5 pr-5",
                  isHighlighted
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400",
                  item.isLocked ? "opacity-80 grayscale-[20%]" : "",
                  shakeId === item.id ? "animate-[shake_0.4s_ease-in-out]" : "",
                  classNames?.tab,
                  isHighlighted && classNames?.activeTab,
                )}
              >
                {isHighlighted && !item.isLocked && (
                  <motion.div
                    layoutId="active-bg"
                    className={cn(
                      "absolute inset-0 -z-10 rounded-[12px] bg-blue-100 dark:bg-blue-900/40",
                      classNames?.pill,
                    )}
                    transition={reduce ? { duration: 0 } : TAB_CHANGE_SPRING}
                  />
                )}
                <span
                  className={cn(
                    "grid shrink-0 place-items-center relative",
                    classNames?.icon,
                  )}
                >
                  {item.icon}
                  {item.isLocked && (
                    <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-900 rounded-full p-[1px] shadow-sm border border-slate-200 dark:border-slate-700">
                        <Lock className="w-2 h-2 text-slate-400" />
                    </div>
                  )}
                </span>
                <motion.span
                  aria-hidden
                  initial={false}
                  animate={
                    reduce
                      ? {
                          width: isHighlighted ? labelWidth + 4 : 0,
                          opacity: isHighlighted ? 1 : 0,
                          marginLeft: isHighlighted ? LABEL_GAP : 0,
                        }
                      : {
                          width: isHighlighted ? labelWidth + 4 : 0,
                          opacity: isHighlighted ? 1 : 0,
                          marginLeft: isHighlighted ? LABEL_GAP : 0,
                        }
                  }
                  transition={
                    reduce
                      ? { duration: 0 }
                      : isHighlighted
                        ? { type: "spring", duration: 0.38, bounce: 0.03 }
                        : { duration: 0.16, ease: EASE_OUT }
                  }
                  className={cn(
                    "inline-block overflow-hidden whitespace-nowrap",
                    classNames?.label,
                  )}
                >
                  <span ref={setLabelMeasureRef(item.id)} className="inline-block">
                    {item.label}
                  </span>
                </motion.span>
              </motion.button>
            );
          })}

          {!highlightedId && items.length > 1 && (
            <div className="absolute left-[44px] top-1/2 -translate-y-1/2 w-[1.5px] h-[18px] bg-slate-200 dark:bg-slate-700 pointer-events-none rounded-full" />
          )}
          
          {!hideCloseButton && (
          <AnimatePresence>
            {active && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => setActive(null)}
                className="ml-auto mr-1 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors dark:hover:bg-slate-800 dark:hover:text-slate-300"
                aria-label="Close panel"
              >
                <X size={18} />
              </motion.button>
            )}
          </AnimatePresence>
          )}
        </div>
      </motion.div>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 -z-10 flex opacity-0"
      >
        {items.map((item) => (
          <span
            className={cn(
              "whitespace-nowrap text-sm font-medium leading-none",
              classNames?.label,
            )}
            key={item.id}
            ref={setLabelMeasureRef(item.id)}
          >
            {item.label}
          </span>
        ))}
      </div>
    </>
  );
}
