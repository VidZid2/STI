"use client";

import { ChevronDown, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import * as React from "react";

import { cn } from "@/lib/utils";

const PANEL_EASE = [0.16, 1, 0.3, 1] as const;
const EXPAND_SPRING = {
  type: "spring" as const,
  stiffness: 150,
  damping: 26,
  mass: 1.05,
};
const COLLAPSE_SPRING = {
  type: "spring" as const,
  stiffness: 190,
  damping: 30,
  mass: 1.1,
};

export type FaqProItem = {
  id: string;
  question: string;
  answer: string;
};

export type FaqProProps = {
  className?: string;
  defaultOpenFirst?: boolean;
  items: FaqProItem[];
  searchPlaceholder?: string;
};

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlightText(text: string, query: string) {
  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    return text;
  }

  const parts = text.split(
    new RegExp(`(${escapeRegExp(normalizedQuery)})`, "gi")
  );

  return parts.map((part, index) => {
    if (part.toLowerCase() === normalizedQuery.toLowerCase()) {
      return (
        <mark
          className="rounded-sm bg-amber-200/90 px-0.5 text-slate-900 dark:bg-amber-400/40"
          key={index}
        >
          {part}
        </mark>
      );
    }

    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
}

function itemMatchesQuery(item: FaqProItem, query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  return (
    item.question.toLowerCase().includes(normalizedQuery) ||
    item.answer.toLowerCase().includes(normalizedQuery)
  );
}

function getDefaultOpenId(items: FaqProItem[], defaultOpenFirst: boolean) {
  if (defaultOpenFirst && items[0]) {
    return items[0].id;
  }

  return null;
}

type FaqProRowProps = {
  isOpen: boolean;
  item: FaqProItem;
  onToggle: () => void;
  panelId: string;
  query: string;
  triggerId: string;
};

function FaqProRow({
  isOpen,
  item,
  onToggle,
  panelId,
  query,
  triggerId,
}: FaqProRowProps) {
  return (
    <div 
        className={cn(
            "overflow-hidden rounded-2xl transition-all duration-300 border", 
            isOpen 
                ? "bg-blue-50/80 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/50 shadow-sm" 
                : "bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700/50 hover:border-slate-200 dark:hover:border-slate-700"
        )}
    >
      <button
        aria-controls={panelId}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset"
        id={triggerId}
        onClick={onToggle}
        type="button"
      >
        <span className={cn(
            "font-bold text-[15px] leading-6 tracking-[-0.01em] transition-colors duration-300 flex items-center gap-3",
            isOpen ? "text-blue-700 dark:text-blue-300" : "text-slate-700 dark:text-slate-200"
        )}>
          {highlightText(item.question, query)}
        </span>
        <div className={cn(
            "flex items-center justify-center w-8 h-8 rounded-full transition-colors duration-300 shrink-0",
            isOpen ? "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400" : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500"
        )}>
            <ChevronDown
              aria-hidden
              className={cn(
                "size-4 shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
                isOpen && "rotate-180"
              )}
            />
        </div>
      </button>

      <motion.div
        animate={{ height: isOpen ? "auto" : 0 }}
        aria-labelledby={triggerId}
        className="overflow-hidden"
        id={panelId}
        initial={false}
        role="region"
        transition={{
          height: isOpen ? EXPAND_SPRING : COLLAPSE_SPRING,
        }}
      >
        <motion.div
          animate={{
            opacity: isOpen ? 1 : 0,
            y: isOpen ? 0 : -6,
          }}
          aria-hidden={!isOpen}
          className="px-5 pb-5 pt-1 text-[14px] text-slate-500 dark:text-slate-400 leading-relaxed"
          inert={isOpen ? undefined : true}
          initial={false}
          transition={{
            opacity: {
              duration: isOpen ? 0.38 : 0.2,
              ease: PANEL_EASE,
              delay: isOpen ? 0.06 : 0,
            },
            y: isOpen ? EXPAND_SPRING : COLLAPSE_SPRING,
          }}
        >
          {highlightText(item.answer, query)}
        </motion.div>
      </motion.div>
    </div>
  );
}

function FaqPro({
  className,
  defaultOpenFirst = false,
  items,
  searchPlaceholder = "Search advantages...",
}: FaqProProps) {
  const listId = React.useId();
  const wasSearchingRef = React.useRef(false);

  const [query, setQuery] = React.useState("");
  const [openId, setOpenId] = React.useState<string | null>(() =>
    getDefaultOpenId(items, defaultOpenFirst)
  );

  const normalizedQuery = query.trim();
  const isSearching = normalizedQuery.length > 0;

  const visibleItems = React.useMemo(
    () => items.filter((item) => itemMatchesQuery(item, query)),
    [items, query]
  );

  React.useEffect(() => {
    if (isSearching) {
      wasSearchingRef.current = true;
      setOpenId((current) => {
        if (current && visibleItems.some((item) => item.id === current)) {
          return current;
        }

        return visibleItems[0]?.id ?? null;
      });
      return;
    }

    if (wasSearchingRef.current) {
      wasSearchingRef.current = false;
      setOpenId(getDefaultOpenId(items, defaultOpenFirst));
      return;
    }
  }, [defaultOpenFirst, isSearching, items, visibleItems]);

  React.useEffect(() => {
    setOpenId((current) => {
      if (!current) {
        return current;
      }

      return items.some((item) => item.id === current) ? current : null;
    });
  }, [items]);

  const toggleItem = React.useCallback((id: string) => {
    setOpenId((current) => (current === id ? null : id));
  }, []);

  return (
    <div
      className={cn(
        "mx-auto flex w-full flex-col gap-4",
        className
      )}
    >
      <div className="relative mb-2">
        <input
          aria-label={searchPlaceholder}
          className={cn(
            "h-12 w-full appearance-none rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 px-5 pr-11 text-[14px] text-slate-800 dark:text-slate-100",
            "shadow-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all",
            "placeholder:text-slate-400 dark:placeholder:text-slate-500",
            "[&::-webkit-search-cancel-button]:appearance-none",
            "[&::-webkit-search-decoration]:appearance-none"
          )}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={searchPlaceholder}
          type="search"
          value={query}
        />
        {query ? (
          <button
            aria-label="Clear search"
            className="absolute top-1/2 right-3 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            onClick={() => setQuery("")}
            type="button"
          >
            <X aria-hidden className="size-4" />
          </button>
        ) : null}
      </div>

      <div className="flex flex-col gap-3">
        <AnimatePresence initial={false} mode="popLayout">
          {visibleItems.length > 0 ? (
            visibleItems.map((item) => (
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                initial={{ opacity: 0, y: 4 }}
                key={item.id}
                layout="position"
                transition={{ duration: 0.2, ease: PANEL_EASE }}
              >
                <FaqProRow
                  isOpen={openId === item.id}
                  item={item}
                  onToggle={() => toggleItem(item.id)}
                  panelId={`${listId}-${item.id}-panel`}
                  query={query}
                  triggerId={`${listId}-${item.id}-trigger`}
                />
              </motion.div>
            ))
          ) : (
            <motion.p
              animate={{ opacity: 1 }}
              className="px-2 py-8 text-center text-[14px] text-slate-500 dark:text-slate-400"
              initial={{ opacity: 0 }}
              key="empty"
            >
              No advantages match your search.
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
FaqPro.displayName = "FaqPro";

export { FaqPro };
