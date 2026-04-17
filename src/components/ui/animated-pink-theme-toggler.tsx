import { useCallback, useEffect, useRef, useState } from "react"
import { flushSync } from "react-dom"

import { cn } from "@/lib/utils"

interface AnimatedPinkThemeTogglerProps extends React.ComponentPropsWithoutRef<"button"> {
  duration?: number
}

// Custom SVG icons — Droplet filled (pink active) and Droplet outline (inactive)
const DropletFilled = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="#ec4899" stroke="#ec4899" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
  </svg>
)

const DropletOutline = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
  </svg>
)

/**
 * Get the current teacher's user ID for per-user theme storage.
 * Falls back to 'default' if no user is found.
 */
const getTeacherUserId = (): string => {
  try {
    const saved = sessionStorage.getItem('elms_current_user')
    if (saved) {
      const user = JSON.parse(saved)
      return user.student_id || user.id || 'default'
    }
  } catch {
    // ignore
  }
  return 'default'
}

export const AnimatedPinkThemeToggler = ({
  className,
  duration = 500,
  ...props
}: AnimatedPinkThemeTogglerProps) => {
  const [isPink, setIsPink] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const updateTheme = () => {
      setIsPink(document.documentElement.classList.contains("pink-theme"))
    }

    updateTheme()

    const observer = new MutationObserver(updateTheme)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })

    return () => observer.disconnect()
  }, [])

  const toggleTheme = useCallback(async () => {
    if (!buttonRef.current) return

    const newPink = !isPink
    const userId = getTeacherUserId()

    // Check if View Transitions API is supported
    if (!document.startViewTransition) {
      // Fallback: just toggle without animation
      setIsPink(newPink)
      document.documentElement.classList.toggle("pink-theme")
      localStorage.setItem(`pinkTheme_${userId}`, newPink ? "enabled" : "disabled")
      localStorage.setItem("pinkTheme", newPink ? "enabled" : "disabled")
      return
    }

    // Get button position for the animation origin
    const { top, left, width, height } = buttonRef.current.getBoundingClientRect()
    const x = left + width / 2
    const y = top + height / 2
    const maxRadius = Math.hypot(
      Math.max(left, window.innerWidth - left),
      Math.max(top, window.innerHeight - top)
    )

    try {
      const transition = document.startViewTransition(() => {
        flushSync(() => {
          setIsPink(newPink)
          document.documentElement.classList.toggle("pink-theme")
          localStorage.setItem(`pinkTheme_${userId}`, newPink ? "enabled" : "disabled")
          localStorage.setItem("pinkTheme", newPink ? "enabled" : "disabled")
        })
      })

      await transition.ready

      // Animate the NEW view with circular reveal — same as dark mode
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${maxRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration,
          easing: "ease-out",
          pseudoElement: "::view-transition-new(root)",
        }
      )
    } catch (error) {
      // If animation fails, still toggle the theme
      console.warn("View transition failed:", error)
      setIsPink(newPink)
      if (newPink) {
        document.documentElement.classList.add("pink-theme")
      } else {
        document.documentElement.classList.remove("pink-theme")
      }
      localStorage.setItem(`pinkTheme_${userId}`, newPink ? "enabled" : "disabled")
      localStorage.setItem("pinkTheme", newPink ? "enabled" : "disabled")
    }
  }, [isPink, duration])

  return (
    <button
      ref={buttonRef}
      onClick={toggleTheme}
      className={cn(className)}
      {...props}
    >
      {isPink ? <DropletFilled /> : <DropletOutline />}
      <span className="sr-only">Toggle pink theme</span>
    </button>
  )
}
