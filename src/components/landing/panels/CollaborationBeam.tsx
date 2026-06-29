"use client"

import React, { forwardRef, useRef } from "react"

import { cn } from "@/lib/utils"
import { AnimatedBeam } from "@/components/ui/animated-beam"
import { IconUser, IconMessages, IconUsersGroup, IconVideo, IconFileText } from "@tabler/icons-react"



const Circle = forwardRef<
  HTMLDivElement,
  { className?: string; children?: React.ReactNode }
>(({ className, children }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "z-10 flex size-12 items-center justify-center rounded-full border-2 border-blue-100 bg-white p-1.5 shadow-[0_0_20px_-12px_rgba(0,0,0,0.8)] dark:border-white/[0.1] dark:bg-black",
        className
      )}
    >
      {children}
    </div>
  )
})

Circle.displayName = "Circle"

export function CollaborationBeam({ isActive = true }: { isActive?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const div1Ref = useRef<HTMLDivElement>(null)
  const div2Ref = useRef<HTMLDivElement>(null)
  const div4Ref = useRef<HTMLDivElement>(null)
  const div5Ref = useRef<HTMLDivElement>(null)
  const div6Ref = useRef<HTMLDivElement>(null)

  return (
    <div
      className="relative flex h-full w-full min-h-[140px] md:min-h-[150px] items-center justify-center p-2 md:p-4"
      ref={containerRef}
    >
      <div className="flex size-full max-h-[140px] md:max-h-[150px] max-w-lg flex-row items-stretch justify-between">
        <div className="flex flex-col items-center justify-between">
          <Circle ref={div1Ref}>
            <IconUser className="w-6 h-6 text-blue-800 dark:text-blue-400" />
          </Circle>
          <Circle ref={div2Ref}>
            <IconMessages className="w-6 h-6 text-blue-800 dark:text-blue-400" />
          </Circle>
        </div>
        <div className="flex flex-col items-center justify-center">
          <Circle ref={div4Ref} className="size-16 p-2 border-blue-200 dark:border-blue-500/30">
            <IconUsersGroup className="w-10 h-10 text-blue-800 dark:text-blue-400" />
          </Circle>
        </div>
        <div className="flex flex-col items-center justify-between">
          <Circle ref={div5Ref}>
            <IconVideo className="w-6 h-6 text-blue-800 dark:text-blue-400" />
          </Circle>
          <Circle ref={div6Ref}>
            <IconFileText className="w-6 h-6 text-blue-800 dark:text-blue-400" />
          </Circle>
        </div>
      </div>

      {isActive && (
        <>
          <AnimatedBeam
            containerRef={containerRef}
            fromRef={div1Ref}
            toRef={div4Ref}
            curvature={-75}
            endYOffset={-10}
            pathColor="rgba(59, 130, 246, 0.2)"
            gradientStartColor="#3b82f6"
            gradientStopColor="#60a5fa"
          />
          <AnimatedBeam
            containerRef={containerRef}
            fromRef={div2Ref}
            toRef={div4Ref}
            curvature={75}
            endYOffset={10}
            pathColor="rgba(59, 130, 246, 0.2)"
            gradientStartColor="#3b82f6"
            gradientStopColor="#60a5fa"
          />
          <AnimatedBeam
            containerRef={containerRef}
            fromRef={div5Ref}
            toRef={div4Ref}
            curvature={-75}
            endYOffset={-10}
            reverse
            pathColor="rgba(59, 130, 246, 0.2)"
            gradientStartColor="#3b82f6"
            gradientStopColor="#60a5fa"
          />
          <AnimatedBeam
            containerRef={containerRef}
            fromRef={div6Ref}
            toRef={div4Ref}
            curvature={75}
            endYOffset={10}
            reverse
            pathColor="rgba(59, 130, 246, 0.2)"
            gradientStartColor="#3b82f6"
            gradientStopColor="#60a5fa"
          />
        </>
      )}
    </div>
  )
}


