import { useCallback, useEffect, useRef, useState } from "react"
import { flushSync } from "react-dom"
import { Moon, Sun } from "lucide-react"

import { cn } from "@/lib/utils"

interface AnimatedThemeTogglerProps extends React.ComponentPropsWithoutRef<"button"> {
  duration?: number
}

/**
 * Get the current user ID for per-user theme storage.
 * Falls back to 'default' if no user is found.
 */
const getUserId = (): string => {
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
  duration = 400,
  ...props
}: AnimatedThemeTogglerProps) => {
  const [isDark, setIsDark] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const isAnimating = useRef(false)

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

  const applyTheme = useCallback((newDark: boolean) => {
    const userId = getUserId()
    if (newDark) {
      document.documentElement.classList.add("dark")
      document.body.classList.add("dark-mode")
    } else {
      document.documentElement.classList.remove("dark")
      document.body.classList.remove("dark-mode")
    }
    setIsDark(newDark)
    localStorage.setItem(`theme_${userId}`, newDark ? "dark" : "light")
    localStorage.setItem("theme", newDark ? "dark" : "light")
  }, [])

  const toggleTheme = useCallback(async () => {
    if (!buttonRef.current || isAnimating.current) return
    isAnimating.current = true

    const newTheme = !isDark

    // Check if View Transitions API is supported
    if (!document.startViewTransition) {
      applyTheme(newTheme)
      isAnimating.current = false
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
          applyTheme(newTheme)
        })
      })

      await transition.ready

      // Animate the NEW view with a smooth circle clip
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${maxRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration,
          easing: "cubic-bezier(0.4, 0, 0.2, 1)",
          pseudoElement: "::view-transition-new(root)",
        }
      )

      await transition.finished
    } catch (error) {
      console.warn("View transition failed:", error)
      flushSync(() => {
        applyTheme(newTheme)
      })
    } finally {
      isAnimating.current = false
    }
  }, [isDark, duration, applyTheme])

  return (
    <button
      ref={buttonRef}
      onClick={toggleTheme}
      className={cn(
        "relative overflow-hidden",
        className
      )}
      aria-label="Toggle theme"
      {...props}
    >
      <div
        className="transition-transform duration-300 ease-out"
        style={{ transform: isDark ? 'rotate(0deg)' : 'rotate(-90deg)' }}
      >
        {isDark ? <Sun size={16} /> : <Moon size={16} />}
      </div>
      <span className="sr-only">Toggle theme</span>
    </button>
  )
}
