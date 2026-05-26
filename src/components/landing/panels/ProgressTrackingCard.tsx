"use client"

import { useEffect, useState } from "react"
import { AnimatedCircularProgressBar } from "@/components/ui/animated-circular-progress-bar"

export function ProgressTrackingCard({ isActive = true }: { isActive?: boolean }) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!isActive) {
      setValue(0)
      return
    }

    // Small delay to let the component mount/become active and trigger the CSS and Framer Motion animations
    const timeout = setTimeout(() => {
      setValue(85)
    }, 100)
    
    return () => clearTimeout(timeout)
  }, [isActive])

  return (
    <div className="flex h-full min-h-[160px] w-full flex-row items-center justify-between gap-2 md:gap-4 p-4 md:p-6 overflow-hidden relative">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 -mr-8 -mt-8 size-32 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-8 -mb-8 size-32 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
      
      {/* Subject details */}
      <div className="flex flex-col z-10 max-w-[55%]">
        <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">
          In Progress
        </span>
        <h3 className="text-base md:text-xl font-bold text-neutral-800 dark:text-white leading-tight mb-1 md:mb-2 truncate">
          NSTP 1
        </h3>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-snug line-clamp-2 md:line-clamp-none">
          Civic Welfare Training Service
        </p>
      </div>

      {/* Progress Bar */}
      <div className="flex z-10 justify-end items-center">
        <AnimatedCircularProgressBar
          max={100}
          min={0}
          value={value}
          gaugePrimaryColor="rgb(59, 130, 246)" // Tailwind blue-500
          gaugeSecondaryColor="rgba(59, 130, 246, 0.15)"
          className="size-20 md:size-24 text-lg md:text-xl font-bold text-neutral-800 dark:text-white"
        />
      </div>
    </div>
  )
}
