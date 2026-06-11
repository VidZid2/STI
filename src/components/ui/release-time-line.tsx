"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowUpRight, Package, Calendar, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export type TimeLine_01Entry = {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  subtitle: string;
  description: string;
  items?: (string | { 
    text: string | React.ReactNode; 
    icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
    type?: 'cosmetic' | 'social' | 'feature' | 'boost' | 'discount' | 'vip';
    isReached?: boolean;
    isNext?: boolean;
  })[];
  image?: string | React.ReactNode;
  button?: {
    url: string;
    text: string;
  };
};

export interface TimeLine_01Props {
  title?: string;
  description?: string;
  entries?: TimeLine_01Entry[];
  className?: string;
}

export const defaultEntries: TimeLine_01Entry[] = [
  {
    icon: Package,
    title: "Advanced Component Pack",
    subtitle: "Version 2.1.0 • Feb 2025",
    description:
      "Ruixen UI now ships with an advanced component pack including complex layouts, enterprise-ready data tables, and animated navigation menus.",
    items: [
      "New Data Grid with sorting, filtering, and pagination",
      "Kanban board with drag-and-drop support",
      "Animated mega menu component",
      "Masonry grid layout for galleries and portfolios",
      "Extended accessibility support across all components",
    ],
    image:
      "https://pub-940ccf6255b54fa799a9b01050e6c227.r2.dev/dashboard-gradient.png",
    button: {
      url: "https://ruixenui.com",
      text: "Explore Components",
    },
  },
  {
    icon: Sparkles,
    title: "Theme Builder & Design Tokens",
    subtitle: "Version 2.0.0 • Jan 2025",
    description:
      "We've introduced a fully customizable theme builder powered by design tokens so you can tailor Ruixen UI to match any brand identity.",
    items: [
      "Real-time theme preview in the dashboard",
      "Customizable color palettes, typography, and spacing",
      "Preset themes for quick project setup",
      "Export tokens to CSS variables or JSON",
    ],
    image:
      "https://pub-940ccf6255b54fa799a9b01050e6c227.r2.dev/featured-01.png",
  },
  {
    icon: Zap,
    title: "Motion & Interaction Update",
    subtitle: "Version 1.8.0 • Dec 2024",
    description:
      "Micro-interactions across Ruixen UI have been enhanced with Framer Motion, delivering a smoother and more engaging user experience.",
    items: [
      "Animated dropdown menus and modals",
      "Smooth transitions between pages",
      "Custom easing curves for a premium feel",
      "Reduced layout shift for better stability",
    ],
    image:
      "https://pub-940ccf6255b54fa799a9b01050e6c227.r2.dev/dashboard-02.png",
  },
  {
    icon: Calendar,
    title: "Initial Pro Release",
    subtitle: "Version 1.5.0 • Oct 2024",
    description:
      "Ruixen UI Pro is here — a premium set of components, templates, and utilities designed for production-grade applications.",
    items: [
      "Full Figma design kit",
      "Extended form components with validation",
      "Chart components with Recharts integration",
      "Ready-to-use dashboard layouts",
    ],
    image:
      "https://pub-940ccf6255b54fa799a9b01050e6c227.r2.dev/featured-06.png",
    button: {
      url: "https://ruixenui.com/pro",
      text: "View Ruixen UI Pro",
    },
  },
];

/**
 * Behavior: Only the card that is currently centered in the viewport is "open".
 * As you scroll, the active card expands to reveal its full content. Others stay collapsed.
 */
export default function TimeLine_01({
  title = "Ruixen UI Release Notes",
  description = "Stay up to date with the latest components, features, and performance enhancements in Ruixen UI — built to help you design and ship faster.",
  entries = defaultEntries,
  className = "",
}: TimeLine_01Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  const renderStatusBadge = (subtitle: string) => {
    const isReached = subtitle.includes("• Reached");
    const isNext = subtitle.includes("• Next Tier");
    const cleanSubtitle = subtitle.replace(" • Reached", "").replace(" • Next Tier", "");

    if (isReached) {
      return (
        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
        <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">{cleanSubtitle}</span>
        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8.5px] font-extrabold bg-zinc-100 dark:bg-zinc-800/80 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700/50 leading-none">
          <svg className="w-2 h-2" fill="none" stroke="currentColor" strokeWidth={3.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
        </span>
        </div>
      );
    }

    if (isNext) {
      return (
        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
          <span className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">{cleanSubtitle}</span>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[8.5px] font-extrabold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 leading-none">
            Next Tier
          </span>
        </div>
      );
    }

    return (
      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
        <span className="text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-wider">{cleanSubtitle}</span>
        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8.5px] font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-450 dark:text-slate-550 border border-slate-200 dark:border-slate-700/50 leading-none">
          Locked
        </span>
      </div>
    );
  };

  // Create stable setters for refs inside map
  const setItemRef = (el: HTMLDivElement | null, i: number) => {
    itemRefs.current[i] = el;
  };

  useEffect(() => {
    if (!itemRefs.current.length) return;

    let frame = 0;
    const updateActiveByProximity = () => {
      frame = requestAnimationFrame(updateActiveByProximity);
      
      const readingLine = window.innerHeight * 0.4; // 40% from top of screen
      let newActiveIndex = activeIndex;
      let minDistance = Infinity;

      itemRefs.current.forEach((node, i) => {
        if (!node) return;
        const rect = node.getBoundingClientRect();
        
        // Calculate distance from the reading line to the item's bounding box
        let dist = 0;
        if (readingLine < rect.top) {
           dist = rect.top - readingLine;
        } else if (readingLine > rect.bottom) {
           dist = readingLine - rect.bottom;
        } else {
           dist = 0; // Reading line is INSIDE the item
        }
        
        if (dist < minDistance) {
           minDistance = dist;
           newActiveIndex = i;
        }
      });

      if (newActiveIndex !== activeIndex) {
        setActiveIndex(newActiveIndex);
      }
    };

    frame = requestAnimationFrame(updateActiveByProximity);
    return () => cancelAnimationFrame(frame);
  }, [activeIndex]);

  // Optional: ensure the first card is active on mount
  useEffect(() => {
    setActiveIndex(0);
  }, []);

  return (
    <section className={`py-12 ${className}`}>
      <div className="container px-4">
        {title && (
          <div className="mx-auto max-w-3xl mb-12">
            <h1 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl text-zinc-900 dark:text-zinc-100">
              {title}
            </h1>
            {description && (
              <p className="text-base text-zinc-500 dark:text-zinc-400 md:text-lg">
                {description}
              </p>
            )}
          </div>
        )}

        <div className="mx-auto max-w-3xl space-y-8 md:space-y-12">
          {entries.map((entry, index) => {
            const isActive = index === activeIndex;

            return (
              <div
                key={index}
                className="relative flex flex-col gap-3 md:flex-row md:gap-12"
                ref={(el) => setItemRef(el, index)}
                aria-current={isActive ? "true" : "false"}
              >
                {/* Sticky meta column (Desktop only) */}
                <div className="hidden md:flex top-8 h-min w-56 shrink-0 items-center gap-4 md:sticky z-10 bg-zinc-50/80 dark:bg-zinc-900/80 backdrop-blur-sm md:bg-transparent md:backdrop-blur-none py-2 md:py-0">
                  <div className="flex items-center gap-3 w-full group">
                    <div className={`flex items-center justify-center rounded-[16px] transition-all duration-300 border flex-shrink-0 ${
                      isActive 
                        ? "w-12 h-12 bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20 shadow-sm scale-105" 
                        : "w-10 h-10 bg-white text-zinc-400 border-zinc-200 dark:bg-zinc-800/50 dark:text-zinc-500 dark:border-zinc-700/50 opacity-70 group-hover:opacity-100"
                    }`}>
                      <entry.icon className={isActive ? "h-6 w-6" : "h-5 w-5"} strokeWidth={isActive ? 2 : 1.5} />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className={`font-bold tracking-tight truncate transition-colors duration-200 ${
                        isActive ? "text-[15px] text-zinc-900 dark:text-white" : "text-[14px] text-zinc-500 dark:text-zinc-400"
                      }`}>
                        {entry.title}
                      </span>
                      {renderStatusBadge(entry.subtitle)}
                    </div>
                  </div>
                </div>

                {/* Content column */}
                <article
                  className={
                    "flex flex-col rounded-[20px] md:rounded-[24px] border p-4 md:p-5 lg:p-6 transition-all duration-300 w-full relative overflow-hidden group " +
                    (isActive
                      ? "border-blue-200/80 dark:border-blue-800/50 bg-white dark:bg-zinc-900 shadow-md shadow-blue-500/5"
                      : "border-zinc-200/80 dark:border-zinc-800/80 bg-white/50 dark:bg-zinc-900/50 opacity-80 hover:opacity-100 hover:border-zinc-300/80 dark:hover:border-zinc-700/80")
                  }
                >
                  {/* SaaS Background Accents */}
                  {isActive && (
                      <>
                          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-150" aria-hidden="true" />
                          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-48 h-48 bg-blue-400/10 dark:bg-blue-400/5 rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-150" aria-hidden="true" />
                      </>
                  )}
                  {/* Mobile header removed, moved to floating bottom bar */}

                  {entry.image && (
                    typeof entry.image === "string" ? (
                      <img
                        src={entry.image}
                        alt={`${entry.title} visual`}
                        className="mb-3 md:mb-4 w-full h-36 md:h-56 rounded-xl object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="mb-3 md:mb-4 w-full overflow-hidden rounded-xl">
                        {entry.image}
                      </div>
                    )
                  )}
                  <div className="space-y-4">
                    {/* Header with improved typography */}
                    <div className="space-y-2 relative z-10">
                      <h2
                        className={
                          "text-lg md:text-xl font-extrabold leading-tight tracking-tight transition-colors duration-200 " +
                          (isActive ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-700 dark:text-zinc-300")
                        }
                      >
                        {entry.title}
                      </h2>
                      
                      {/* Improved description with better spacing */}
                      <p
                        className={
                          "text-sm md:text-[15px] leading-relaxed transition-all duration-300 " +
                          (isActive 
                            ? "font-medium text-zinc-500 dark:text-zinc-400 line-clamp-none" 
                            : "font-medium text-zinc-500/80 dark:text-zinc-400/80 line-clamp-2")
                        }
                      >
                        {entry.description}
                      </p>
                    </div>

                    {/* Enhanced expandable content */}
                    <div
                      aria-hidden={!isActive}
                      className={
                        "grid transition-all duration-500 ease-out " +
                        (isActive 
                          ? "grid-rows-[1fr] opacity-100" 
                          : "grid-rows-[0fr] opacity-0")
                      }
                    >
                      <div className="overflow-hidden">
                        <div className="space-y-4 pt-1 md:pt-2 pb-2 md:pb-3">
                          {entry.items && entry.items.length > 0 && (
                            <div className="space-y-2 md:space-y-3">
                              {entry.items.map((item, itemIndex) => {
                                const isObject = typeof item !== "string";
                                const text = isObject ? (item as any).text : (item as string);
                                const IconComponent = isObject ? (item as any).icon : null;
                                const itemType = isObject ? (item as any).type : undefined;
                                const isReached = isObject ? (item as any).isReached : false;
                                const isNext = isObject ? (item as any).isNext : false;

                                // Determine type badge text and styles
                                let typeLabel = "Benefit";
                                let typeClass = "bg-blue-50/60 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border-blue-100/50 dark:border-blue-900/30";
                                let typeIconColor = "text-blue-600 dark:text-blue-400";
                                let typeBgColor = "bg-blue-50 dark:bg-blue-950/40 border-blue-100/50 dark:border-blue-900/30";

                                if (itemType === "cosmetic") {
                                  typeLabel = "Cosmetic Unlock";
                                  typeClass = "bg-purple-50/60 text-purple-750 dark:bg-purple-950/40 dark:text-purple-400 border-purple-100/50 dark:border-purple-900/30";
                                  typeIconColor = "text-purple-655 dark:text-purple-400";
                                  typeBgColor = "bg-purple-50 dark:bg-purple-950/40 border-purple-100/50 dark:border-purple-900/30";
                                } else if (itemType === "social") {
                                  typeLabel = "Social Benefit";
                                  typeClass = "bg-emerald-50/60 text-emerald-755 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-100/50 dark:border-emerald-900/30";
                                  typeIconColor = "text-emerald-655 dark:text-emerald-400";
                                  typeBgColor = "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-100/50 dark:border-emerald-900/30";
                                } else if (itemType === "feature") {
                                  typeLabel = "Feature Unlock";
                                  typeClass = "bg-sky-50/60 text-sky-755 dark:bg-sky-950/40 dark:text-sky-400 border-sky-100/50 dark:border-sky-900/30";
                                  typeIconColor = "text-sky-655 dark:text-sky-400";
                                  typeBgColor = "bg-sky-55 dark:bg-sky-950/40 border-sky-100/50 dark:border-sky-900/30";
                                } else if (itemType === "boost") {
                                  typeLabel = "XP Multiplier";
                                  typeClass = "bg-amber-50/60 text-amber-750 dark:bg-amber-950/40 dark:text-amber-400 border-amber-100/50 dark:border-amber-900/30";
                                  typeIconColor = "text-amber-655 dark:text-amber-400";
                                  typeBgColor = "bg-amber-50 dark:bg-amber-950/40 border-amber-100/50 dark:border-amber-900/30";
                                } else if (itemType === "discount") {
                                  typeLabel = "Store Discount";
                                  typeClass = "bg-rose-50/60 text-rose-750 dark:bg-rose-950/40 dark:text-rose-400 border-rose-100/50 dark:border-rose-900/30";
                                  typeIconColor = "text-rose-655 dark:text-rose-400";
                                  typeBgColor = "bg-rose-50 dark:bg-rose-950/40 border-rose-100/50 dark:border-rose-900/30";
                                } else if (itemType === "vip") {
                                  typeLabel = "VIP Exclusive";
                                  typeClass = "bg-indigo-50/60 text-indigo-750 dark:bg-indigo-950/40 dark:text-indigo-400 border-indigo-100/50 dark:border-indigo-900/30";
                                  typeIconColor = "text-indigo-655 dark:text-indigo-400";
                                  typeBgColor = "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-100/50 dark:border-indigo-900/30";
                                }

                                // Border and background styling based on unlock status
                                let statusBorder = "border-zinc-200/50 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-800/20 opacity-60";
                                if (isReached) {
                                  statusBorder = "border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700/80";
                                } else if (isNext) {
                                  statusBorder = "border-blue-200/80 dark:border-blue-800/50 bg-blue-50/30 dark:bg-blue-900/10 shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700/80";
                                }

                                return (
                                  <div 
                                    key={itemIndex} 
                                    className={`flex items-start gap-3 md:gap-4 p-4 md:p-5 rounded-[16px] md:rounded-[20px] border transition-all duration-300 group ${statusBorder}`}
                                  >
                                    {/* Icon Container */}
                                    {IconComponent ? (
                                      <div className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl shrink-0 shadow-sm border ${typeBgColor} ${typeIconColor} transition-transform duration-300 group-hover:scale-110`}>
                                        <IconComponent className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2} />
                                      </div>
                                    ) : (
                                      <div className="mt-2.5 h-2 w-2 rounded-full bg-blue-500 shrink-0 shadow-sm shadow-blue-500/50" />
                                    )}

                                    {/* Content Container */}
                                    <div className="flex-1 space-y-1.5 min-w-0">
                                      <div className="flex flex-wrap items-center gap-2">
                                        {/* Reward Type Pill Badge */}
                                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border leading-none ${typeClass}`}>
                                          {typeLabel}
                                        </span>

                                        {/* Unlock status indicator */}
                                        {isReached ? (
                                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 leading-none">
                                            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                            Unlocked
                                          </span>
                                        ) : isNext ? (
                                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 leading-none">
                                            Up Next
                                          </span>
                                        ) : (
                                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700/50 leading-none">
                                            Locked
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-[13px] md:text-[14.5px] text-zinc-700 dark:text-zinc-300 font-medium leading-relaxed mt-1">
                                        {text}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {entry.button && (
                            <div className="flex justify-end">
                              <Button 
                                variant="default" 
                                size="sm"
                                className="group hover:bg-primary hover:text-primary-foreground font-normal transition-all duration-200" 
                                asChild
                              >
                                <a href={entry.button.url} target="_blank" rel="noreferrer">
                                  {entry.button.text} 
                                  <ArrowUpRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                                </a>
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              </div>
            );
          })}
        </div>

        {/* Floating Mobile Active Item Bar */}
        <div className="sticky bottom-2 sm:bottom-4 z-50 md:hidden pointer-events-none mt-8 flex justify-center w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="flex items-center gap-3 p-3 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.2)] rounded-[20px] pointer-events-auto w-[calc(100%-1.5rem)] max-w-md mx-auto"
            >
              {(() => {
                const activeEntry = entries[activeIndex];
                if (!activeEntry) return null;
                const ActiveIcon = activeEntry.icon;
                return (
                  <>
                    <div className="w-12 h-12 rounded-[16px] bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-sm relative overflow-hidden z-10">
                      <ActiveIcon className="h-6 w-6 relative z-10" strokeWidth={2} />
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="text-[15px] font-bold text-zinc-900 dark:text-zinc-100 tracking-tight truncate">
                        {activeEntry.title}
                      </span>
                      <div className="flex flex-wrap items-center gap-1.5 -mt-0.5">
                        {renderStatusBadge(activeEntry.subtitle)}
                      </div>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
