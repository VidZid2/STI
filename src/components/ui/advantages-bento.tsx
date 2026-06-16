"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Zap, MousePointerClick, Moon, Smartphone, Compass } from "lucide-react";

// Animation variants for staggered entrance
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 120,
      damping: 14,
    },
  },
};

interface AdvantageItem {
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
  bg: string;
}

const ADVANTAGES: AdvantageItem[] = [
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Pages load significantly faster, saving you valuable time between classes.",
    color: "text-amber-500",
    bg: "bg-amber-50 dark:bg-amber-900/20",
  },
  {
    icon: MousePointerClick,
    title: "Fewer Clicks",
    description: "Get to your modules and schedules with zero friction.",
    color: "text-blue-500",
    bg: "bg-blue-50 dark:bg-blue-900/20",
  },
  {
    icon: Moon,
    title: "Reduced Eye Strain",
    description: "A gorgeous dark mode designed for late-night study sessions. Your eyes will thank you during midnight cramming.",
    color: "text-indigo-500",
    bg: "bg-indigo-50 dark:bg-indigo-900/20",
  },
  {
    icon: Smartphone,
    title: "Works Everywhere",
    description: "Fully optimized for phones, tablets, and desktops.",
    color: "text-emerald-500",
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
  },
  {
    icon: Compass,
    title: "Smarter Navigation",
    description: "A redesigned sidebar and quick-access shortcuts mean less searching, more learning.",
    color: "text-rose-500",
    bg: "bg-rose-50 dark:bg-rose-900/20",
  },
];

function AdvantageCard({ item, className }: { item: AdvantageItem; className?: string }) {
  const Icon = item.icon;
  return (
    <div
      className={cn(
        "relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex flex-col gap-3 h-full",
        "group hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all duration-300 min-h-0",
        className
      )}
    >
      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", item.bg, item.color)}>
        <Icon className="w-[18px] h-[18px]" strokeWidth={2} />
      </div>
      <div className="flex-1 flex flex-col justify-center min-h-0">
        <h4 className="text-[13px] lg:text-sm font-bold text-slate-800 dark:text-slate-100 mb-1 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">{item.title}</h4>
        <p className="text-[11px] lg:text-xs text-slate-500 dark:text-slate-400 leading-relaxed overflow-hidden text-ellipsis line-clamp-3">{item.description}</p>
      </div>
    </div>
  );
}

export interface AdvantagesBentoProps {
  className?: string;
}

export function AdvantagesBento({ className }: AdvantagesBentoProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn(
        "grid w-full gap-3 h-full min-h-0",
        "grid-cols-1",
        "sm:grid-cols-2",
        "lg:grid-cols-3 lg:grid-rows-3",
        className
      )}
    >
      {/* Card 1: Lightning Fast — tall left card spanning 2 rows */}
      <motion.div variants={itemVariants} className="lg:row-span-2">
        <AdvantageCard item={ADVANTAGES[0]} className="h-full" />
      </motion.div>

      {/* Card 2: Fewer Clicks */}
      <motion.div variants={itemVariants}>
        <AdvantageCard item={ADVANTAGES[1]} className="h-full" />
      </motion.div>

      {/* Card 3: Reduced Eye Strain */}
      <motion.div variants={itemVariants}>
        <AdvantageCard item={ADVANTAGES[2]} className="h-full" />
      </motion.div>

      {/* Card 4: Works Everywhere */}
      <motion.div variants={itemVariants}>
        <AdvantageCard item={ADVANTAGES[3]} className="h-full" />
      </motion.div>

      {/* Card 5: Smarter Navigation */}
      <motion.div variants={itemVariants}>
        <AdvantageCard item={ADVANTAGES[4]} className="h-full" />
      </motion.div>

      {/* Bottom wide stat card spanning 2 cols */}
      <motion.div variants={itemVariants} className="sm:col-span-2 lg:col-span-3 lg:row-span-1 h-full min-h-0">
        <div className="relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/10 dark:via-indigo-900/10 dark:to-purple-900/10 p-4 flex items-center justify-between gap-4 h-full overflow-hidden">
          <div className="flex-1">
            <h4 className="text-[13px] lg:text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">Built for Students</h4>
            <p className="text-[11px] lg:text-xs text-slate-500 dark:text-slate-400 leading-relaxed">Every improvement was designed with your daily workflow in mind — study smarter, not harder.</p>
          </div>
          <span className="text-3xl lg:text-4xl font-extrabold text-blue-600/20 dark:text-blue-400/20 shrink-0 select-none">10X</span>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default AdvantagesBento;
