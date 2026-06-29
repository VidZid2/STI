import { cn } from "@/lib/utils"
import { NumberTicker } from "./number-ticker"

interface AnimatedCircularProgressBarProps {
  max?: number
  min?: number
  value: number
  gaugePrimaryColor: string
  gaugeSecondaryColor: string
  className?: string
  hideText?: boolean
  children?: React.ReactNode
  fullCircle?: boolean
  hideRing?: boolean
}

export function AnimatedCircularProgressBar({
  max = 100,
  min = 0,
  value = 0,
  gaugePrimaryColor,
  gaugeSecondaryColor,
  className,
  hideText = false,
  children,
  fullCircle = false,
  hideRing = false,
}: AnimatedCircularProgressBarProps) {
  const circumference = 2 * Math.PI * 45
  const percentPx = circumference / 100
  const currentPercent = Math.round(((value - min) / (max - min)) * 100)

  return (
    <div
      className={cn("relative size-40 text-2xl font-semibold", className)}
      style={
        {
          "--circle-size": "100px",
          "--circumference": circumference,
          "--percent-to-px": `${percentPx}px`,
          "--gap-percent": fullCircle ? "0" : "5",
          "--offset-factor": "0",
          "--transition-length": "1s",
          "--transition-step": "200ms",
          "--delay": "0s",
          "--percent-to-deg": "3.6deg",
          transform: "translateZ(0)",
        } as React.CSSProperties
      }
    >
      {!hideRing && (
        <svg
          fill="none"
          className="size-full pointer-events-none"
          strokeWidth="2"
          viewBox="0 0 100 100"
        >
          {(fullCircle || (currentPercent <= 90 && currentPercent >= 0)) && (
            <circle
              cx="50"
              cy="50"
              r="45"
              strokeWidth="10"
              strokeDashoffset="0"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="opacity-100"
              style={
                {
                  stroke: gaugeSecondaryColor,
                  ...(fullCircle
                    ? {}
                    : {
                        "--stroke-percent": 90 - currentPercent,
                        "--offset-factor-secondary": "calc(1 - var(--offset-factor))",
                        strokeDasharray:
                          "calc(var(--stroke-percent) * var(--percent-to-px)) var(--circumference)",
                        transform:
                          "rotate(calc(1turn - 90deg - (var(--gap-percent) * var(--percent-to-deg) * var(--offset-factor-secondary)))) scaleY(-1)",
                      }),
                  transition: "all var(--transition-length) ease var(--delay)",
                  transformOrigin: "50% 50%",
                } as React.CSSProperties
              }
            />
          )}
          <circle
            cx="50"
            cy="50"
            r="45"
            strokeWidth="10"
            strokeDashoffset="0"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="opacity-100"
            style={
              {
                stroke: gaugePrimaryColor,
                "--stroke-percent": currentPercent,
                strokeDasharray:
                  "calc(var(--stroke-percent) * var(--percent-to-px)) var(--circumference)",
                transition:
                  "var(--transition-length) ease var(--delay),stroke var(--transition-length) ease var(--delay)",
                transitionProperty: "stroke-dasharray,transform",
                transform: fullCircle
                  ? "rotate(-90deg)"
                  : "rotate(calc(-90deg + var(--gap-percent) * var(--offset-factor) * var(--percent-to-deg)))",
                transformOrigin: "50% 50%",
              } as React.CSSProperties
            }
          />
        </svg>
      )}
      
      {!hideText && !children && (
        <div className="absolute inset-0 m-auto size-fit flex items-center justify-center delay-(--delay) duration-(--transition-length) ease-linear">
          <NumberTicker
            value={currentPercent}
            className="font-bold tracking-tighter text-inherit dark:text-inherit"
          />
        </div>
      )}

      {children && (
        <div className="absolute inset-0 m-auto size-full flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  )
}
