"use client"

import React, { forwardRef, useRef } from "react"

import { cn } from "@/lib/utils"
import { AnimatedBeam } from "@/components/ui/animated-beam"

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "lord-icon": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        src?: string;
        trigger?: string;
        colors?: string;
        state?: string;
        style?: React.CSSProperties;
      };
    }
  }
}

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
            <lord-icon
              src="https://cdn.lordicon.com/fozsorqm.json"
              trigger="hover"
              colors="primary:#1e3a8a,secondary:#3b82f6"
              style={{ width: "32px", height: "32px" }}
            />
          </Circle>
          <Circle ref={div2Ref}>
            <lord-icon
              src="https://cdn.lordicon.com/dhzbkemf.json"
              trigger="hover"
              colors="primary:#1e3a8a,secondary:#3b82f6"
              style={{ width: "32px", height: "32px" }}
            />
          </Circle>
        </div>
        <div className="flex flex-col items-center justify-center">
          <Circle ref={div4Ref} className="size-16 p-2 border-blue-200 dark:border-blue-500/30">
            <lord-icon
              src="https://cdn.lordicon.com/shcfcebj.json"
              trigger="hover"
              state="hover-nodding"
              colors="primary:#1e3a8a,secondary:#3b82f6"
              style={{ width: "48px", height: "48px" }}
            />
          </Circle>
        </div>
        <div className="flex flex-col items-center justify-between">
          <Circle ref={div5Ref}>
            <lord-icon
              src="https://cdn.lordicon.com/rrbmabsx.json"
              trigger="hover"
              colors="primary:#1e3a8a,secondary:#3b82f6"
              style={{ width: "32px", height: "32px" }}
            />
          </Circle>
          <Circle ref={div6Ref}>
            <lord-icon
              src="https://cdn.lordicon.com/cfoaotmk.json"
              trigger="hover"
              colors="primary:#1e3a8a,secondary:#3b82f6"
              style={{ width: "32px", height: "32px" }}
            />
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


