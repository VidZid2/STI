import { useCallback, useEffect, useRef, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { flushSync } from "react-dom"

import { cn } from "@/lib/utils"

interface AnimatedThemeTogglerProps extends React.ComponentPropsWithoutRef<"button"> {
  duration?: number
}

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

export const AnimatedThemeToggler = ({
  className,
  duration = 500,
  ...props
}: AnimatedThemeTogglerProps) => {
  const [isDark, setIsDark] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const updateTheme = () => {
      setIsDark(document.documentElement.classList.contains("dark"))
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

    const newTheme = !isDark
    const userId = getTeacherUserId()

    // Check if View Transitions API is supported
    if (!document.startViewTransition) {
      // Fallback: just toggle without animation
      setIsDark(newTheme)
      document.documentElement.classList.toggle("dark")
      document.body.classList.toggle("dark-mode")
      // Store per-user preference
      localStorage.setItem(`theme_${userId}`, newTheme ? "dark" : "light")
      // Keep legacy key for backward compat
      localStorage.setItem("theme", newTheme ? "dark" : "light")
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
          setIsDark(newTheme)
          document.documentElement.classList.toggle("dark")
          document.body.classList.toggle("dark-mode")
          localStorage.setItem(`theme_${userId}`, newTheme ? "dark" : "light")
          localStorage.setItem("theme", newTheme ? "dark" : "light")
        })
      })

      await transition.ready

      // Animate the NEW view (the one we're transitioning TO)
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
      setIsDark(newTheme)
      if (newTheme) {
        document.documentElement.classList.add("dark")
        document.body.classList.add("dark-mode")
      } else {
        document.documentElement.classList.remove("dark")
        document.body.classList.remove("dark-mode")
      }
      localStorage.setItem(`theme_${userId}`, newTheme ? "dark" : "light")
      localStorage.setItem("theme", newTheme ? "dark" : "light")
    }
  }, [isDark, duration])

  return (
    <button
      ref={buttonRef}
      onClick={toggleTheme}
      className={cn(className)}
      {...props}
    >
      {isDark ? <Sun /> : <Moon />}
      <span className="sr-only">Toggle theme</span>
    </button>
  )
}
