import React from "react";
import clsx from "clsx";

export type TNoteType = "default" | "success" | "warning" | "error" | "alert" | "secondary" |
  "violet" | "cyan" | "lite" | "ghost" | "tertiary" | "rotate-ccw";

const sizes = {
  small: "py-1.5 px-2 min-h-[34px] text-[13px]",
  medium: "py-2 px-3 min-h-10 text-[14px]",
  large: "py-[11px] px-3 min-h-12 text-base"
};

export interface NoteProps {
  size?: keyof typeof sizes;
  action?: React.ReactNode;
  type?: TNoteType;
  fill?: boolean;
  disabled?: boolean;
  label?: string | boolean;
  children: React.ReactNode;
  className?: string;
}

export const Note: React.FC<NoteProps> = ({
  size = "medium",
  action,
  type = "default",
  fill = false,
  disabled = false,
  label,
  children,
  className
}) => {
  const typeStyles: Record<TNoteType, string> = {
    default: "bg-blue-50 text-blue-900 border-blue-200 dark:bg-blue-950/30 dark:text-blue-200 dark:border-blue-900/50",
    success: "bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-200 dark:border-emerald-900/50",
    warning: "bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/30 dark:text-amber-200 dark:border-amber-900/50",
    error: "bg-red-50 text-red-900 border-red-200 dark:bg-red-950/30 dark:text-red-200 dark:border-red-900/50",
    alert: "bg-orange-50 text-orange-900 border-orange-200 dark:bg-orange-950/30 dark:text-orange-200 dark:border-orange-900/50",
    secondary: "bg-slate-50 text-slate-900 border-slate-200 dark:bg-slate-900/30 dark:text-slate-200 dark:border-slate-800",
    violet: "bg-violet-50 text-violet-900 border-violet-200 dark:bg-violet-950/30 dark:text-violet-200 dark:border-violet-900/50",
    cyan: "bg-cyan-50 text-cyan-900 border-cyan-200 dark:bg-cyan-950/30 dark:text-cyan-200 dark:border-cyan-900/50",
    lite: "bg-zinc-50 text-zinc-900 border-zinc-200 dark:bg-zinc-800/30 dark:text-zinc-200 dark:border-zinc-700/50",
    ghost: "bg-transparent text-slate-700 border-transparent dark:text-slate-300",
    tertiary: "bg-rose-50 text-rose-900 border-rose-200 dark:bg-rose-950/30 dark:text-rose-200 dark:border-rose-900/50",
    "rotate-ccw": "bg-indigo-50 text-indigo-900 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-200 dark:border-indigo-900/50",
  };

  const fillStyles: Record<TNoteType, string> = {
    default: "bg-blue-600 text-white border-blue-600 dark:bg-blue-600 dark:text-white dark:border-blue-600",
    success: "bg-emerald-600 text-white border-emerald-600 dark:bg-emerald-600 dark:text-white dark:border-emerald-600",
    warning: "bg-amber-500 text-white border-amber-500 dark:bg-amber-600 dark:text-white dark:border-amber-600",
    error: "bg-red-600 text-white border-red-600 dark:bg-red-600 dark:text-white dark:border-red-600",
    alert: "bg-orange-500 text-white border-orange-500 dark:bg-orange-600 dark:text-white dark:border-orange-600",
    secondary: "bg-slate-800 text-white border-slate-800 dark:bg-slate-700 dark:text-white dark:border-slate-700",
    violet: "bg-violet-600 text-white border-violet-600 dark:bg-violet-600 dark:text-white dark:border-violet-600",
    cyan: "bg-cyan-600 text-white border-cyan-600 dark:bg-cyan-600 dark:text-white dark:border-cyan-600",
    lite: "bg-zinc-200 text-zinc-900 border-zinc-200 dark:bg-zinc-700 dark:text-white dark:border-zinc-700",
    ghost: "bg-slate-200 text-slate-900 border-slate-200 dark:bg-slate-800 dark:text-white dark:border-slate-800",
    tertiary: "bg-rose-600 text-white border-rose-600 dark:bg-rose-600 dark:text-white dark:border-rose-600",
    "rotate-ccw": "bg-indigo-600 text-white border-indigo-600 dark:bg-indigo-600 dark:text-white dark:border-indigo-600",
  };

  const baseStyle = fill ? fillStyles[type] : typeStyles[type];

  return (
    <div 
      className={clsx(
        "flex items-start justify-between rounded-[12px] border gap-3 w-full transition-all duration-200",
        sizes[size],
        baseStyle,
        disabled && "opacity-50 pointer-events-none cursor-not-allowed",
        className
      )}
    >
      <div className="flex flex-col flex-1 min-w-0">
        {label && <span className="font-semibold mb-0.5">{label}</span>}
        <div className="leading-snug text-current opacity-90">{children}</div>
      </div>
      {action && (
        <div className="flex-shrink-0 ml-2">
          {action}
        </div>
      )}
    </div>
  );
};
