import { type ComponentPropsWithoutRef } from "react"
import { cn } from "@/lib/utils"

export interface AnimatedGradientTextProps extends ComponentPropsWithoutRef<"span"> {
  speed?: number
  colorFrom?: string
  colorTo?: string
}

export function AnimatedGradientText({
  children,
  className,
  speed = 1,
  colorFrom = "#1e40af", // Default STI Blue Deep
  colorTo = "#3b82f6",   // Default STI Blue Accent
  ...props
}: AnimatedGradientTextProps) {
  return (
    <span
      style={
        {
          "--bg-size": `${speed * 300}%`,
          "--color-from": colorFrom,
          "--color-to": colorTo,
          animationDuration: `${8 / speed}s`,
        } as React.CSSProperties
      }
      className={cn(
        "animate-gradient inline bg-gradient-to-r from-[var(--color-from)] via-[var(--color-to)] to-[var(--color-from)] bg-[length:var(--bg-size)_100%] bg-clip-text text-transparent font-semibold",
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
