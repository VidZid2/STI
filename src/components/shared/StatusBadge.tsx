import type { FC, ReactNode } from "react";

type StatusBadgeTone = "blue" | "emerald" | "violet" | "amber" | "rose" | "zinc" | "cyan";

const badgeToneClasses: Record<StatusBadgeTone, string> = {
  blue: "border-blue-100 bg-blue-50 text-blue-700 dark:border-blue-800/50 dark:bg-blue-900/30 dark:text-blue-200",
  emerald: "border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-800/50 dark:bg-emerald-900/30 dark:text-emerald-200",
  violet: "border-violet-100 bg-violet-50 text-violet-700 dark:border-violet-800/50 dark:bg-violet-900/30 dark:text-violet-200",
  amber: "border-amber-100 bg-amber-50 text-amber-800 dark:border-amber-800/50 dark:bg-amber-900/30 dark:text-amber-200",
  rose: "border-rose-100 bg-rose-50 text-rose-700 dark:border-rose-800/50 dark:bg-rose-900/30 dark:text-rose-200",
  zinc: "border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-800/80 dark:bg-zinc-900/50 dark:text-zinc-200",
  cyan: "border-cyan-100 bg-cyan-50 text-cyan-700 dark:border-cyan-800/50 dark:bg-cyan-900/30 dark:text-cyan-200",
};

interface StatusBadgeProps {
  tone?: StatusBadgeTone;
  leftIcon?: ReactNode;
  label: string;
  className?: string;
}

export const StatusBadge: FC<StatusBadgeProps> = ({
  tone = "zinc",
  leftIcon,
  label,
  className = "",
}) => {
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5",
        "text-[12px] leading-none font-semibold tracking-normal",
        badgeToneClasses[tone],
        className,
      ].join(" ")}
    >
      {leftIcon}
      {/* Title case by default; callers should pass already-cased strings */}
      {label}
    </span>
  );
};
