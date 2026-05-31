import type { LucideIcon } from "lucide-react";
import type { FC } from "react";
import { StatusBadge } from "../shared/StatusBadge";

type ToolBadgeTone = "blue" | "emerald" | "violet" | "amber" | "rose" | "zinc" | "cyan";

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

export const ToolHeaderBadge: FC<ToolHeaderBadgeProps> = ({
  icon: Icon,
  label,
  tone = "blue",
  hideOnSmall = false,
}) => (
  <span className={hideOnSmall ? "hidden sm:inline-flex" : ""}>
    <StatusBadge
      tone={tone}
      label={label}
      leftIcon={
        Icon ? <Icon className="h-3 w-3" aria-hidden="true" strokeWidth={3} /> : undefined
      }
    />
  </span>
);

export const ToolHeaderLiveBadge: FC<ToolHeaderLiveBadgeProps> = ({
  label,
  isOnline = true,
}) => (
  <StatusBadge
    tone={isOnline ? "emerald" : "rose"}
    label={label}
    leftIcon={
      <span className="relative flex h-2 w-2" aria-hidden="true">
        {isOnline && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        )}
        <span
          className={`relative inline-flex h-2 w-2 rounded-full ${
            isOnline ? "bg-emerald-500" : "bg-rose-500"
          }`}
        />
      </span>
    }
  />
);
