"use client"

import { cn } from "@/lib/utils"
import { AnimatedList } from "@/components/ui/animated-list"

interface Item {
  name: string
  description: string
  icon: string
  color: string
  time: string
}

let notifications = [
  {
    name: "Quiz Auto-graded",
    description: "Score: 98/100 (Top 5%)",
    time: "Just now",
    icon: "✅",
    color: "#10b981", // emerald-500
  },
  {
    name: "New Feedback",
    description: "Prof. Cruz reviewed your essay",
    time: "5m ago",
    icon: "💬",
    color: "#3b82f6", // blue-500
  },
  {
    name: "Code Challenge Passed",
    description: "All 15 test cases succeeded",
    time: "12m ago",
    icon: "🚀",
    color: "#8b5cf6", // violet-500
  },
  {
    name: "Assessment Graded",
    description: "Data Structures Midterm",
    time: "1h ago",
    icon: "📊",
    color: "#f59e0b", // amber-500
  },
]

notifications = Array.from({ length: 10 }, () => notifications).flat()

const Notification = ({ name, description, icon, color, time }: Item) => {
  return (
    <figure
      className={cn(
        "relative mx-auto min-h-fit w-full max-w-[400px] cursor-pointer overflow-hidden rounded-xl p-3 md:p-4",
        // animation styles
        "transition-all duration-200 ease-in-out hover:scale-[103%]",
        // light styles
        "bg-white border border-neutral-100 shadow-sm",
        // dark styles
        "transform-gpu dark:bg-black/40 dark:backdrop-blur-md dark:border-white/[0.1] dark:shadow-none"
      )}
    >
      <div className="flex flex-row items-center gap-3">
        <div
          className="flex size-10 flex-shrink-0 items-center justify-center rounded-lg"
          style={{
            backgroundColor: color,
          }}
        >
          <span className="text-lg">{icon}</span>
        </div>
        <div className="flex flex-col overflow-hidden">
          <figcaption className="flex flex-row items-center text-sm md:text-base font-medium whitespace-pre dark:text-white">
            <span>{name}</span>
            <span className="mx-1 text-neutral-300 dark:text-neutral-600">·</span>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">{time}</span>
          </figcaption>
          <p className="text-xs md:text-sm font-normal text-neutral-600 dark:text-neutral-400 truncate">
            {description}
          </p>
        </div>
      </div>
    </figure>
  )
}

export function SmartAssessmentsList({
  className,
  isActive = true,
}: {
  className?: string
  isActive?: boolean
}) {
  return (
    <div
      className={cn(
        "relative flex h-[200px] w-full flex-col overflow-hidden",
        className
      )}
      style={{
        maskImage: "linear-gradient(to bottom, transparent, black 10%, black 80%, transparent)",
        WebkitMaskImage: "linear-gradient(to bottom, transparent, black 10%, black 80%, transparent)",
      }}
    >
      {isActive ? (
        <AnimatedList delay={2500}>
          {notifications.map((item, idx) => (
            <Notification {...item} key={idx} />
          ))}
        </AnimatedList>
      ) : (
        <div className="flex flex-col items-center gap-4">
          {notifications.slice(0, 2).map((item, idx) => (
            <Notification {...item} key={idx} />
          ))}
        </div>
      )}
    </div>
  )
}
