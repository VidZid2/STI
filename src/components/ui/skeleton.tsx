import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("relative overflow-hidden rounded-md bg-slate-200/80 dark:bg-slate-700/80", className)}
      {...props}
    >
      <div className="absolute inset-0 -translate-x-full animate-[skeleton-shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/50 dark:via-white/10 to-transparent" />
    </div>
  )
}

export { Skeleton }
