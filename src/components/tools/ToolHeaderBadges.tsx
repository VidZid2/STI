import type { LucideIcon } from "lucide-react";
import type { FC } from "react";

type ToolBadgeTone = "blue" | "emerald" | "violet" | "amber" | "rose" | "zinc";

interface ToolHeaderBadgeProps {
    icon?: LucideIcon;
    label: string;
    tone?: ToolBadgeTone;
    hideOnSmall?: boolean;
}

interface ToolHeaderLiveBadgeProps {
    label: string;
    isOnline?: boolean;
}

const badgeToneClasses: Record<ToolBadgeTone, string> = {
    blue: "border-blue-100 bg-blue-50 text-blue-600 dark:border-blue-800/50 dark:bg-blue-900/30 dark:text-blue-300",
    emerald: "border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-800/50 dark:bg-emerald-900/30 dark:text-emerald-300",
    violet: "border-violet-100 bg-violet-50 text-violet-600 dark:border-violet-800/50 dark:bg-violet-900/30 dark:text-violet-300",
    amber: "border-amber-100 bg-amber-50 text-amber-700 dark:border-amber-800/50 dark:bg-amber-900/30 dark:text-amber-300",
    rose: "border-rose-100 bg-rose-50 text-rose-600 dark:border-rose-800/50 dark:bg-rose-900/30 dark:text-rose-300",
    zinc: "border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-300",
};

const baseBadgeClass = "inline-flex h-6 items-center gap-1.5 rounded-md border px-2.5 text-[10px] font-bold uppercase leading-none tracking-wider";

export const ToolHeaderBadge: FC<ToolHeaderBadgeProps> = ({
    icon: Icon,
    label,
    tone = "blue",
    hideOnSmall = false,
}) => (
    <span className={`${baseBadgeClass} ${badgeToneClasses[tone]} ${hideOnSmall ? "hidden sm:inline-flex" : ""}`}>
        {Icon && <Icon className="h-3 w-3" aria-hidden="true" strokeWidth={2.4} />}
        {label}
    </span>
);

export const ToolHeaderLiveBadge: FC<ToolHeaderLiveBadgeProps> = ({
    label,
    isOnline = true,
}) => (
    <span className={`${baseBadgeClass} ${isOnline ? badgeToneClasses.emerald : badgeToneClasses.rose}`}>
        <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
            {isOnline && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />}
            <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${isOnline ? "bg-emerald-500" : "bg-rose-500"}`} />
        </span>
        {label}
    </span>
);
