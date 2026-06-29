"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

interface CTAProps {
  badge?: {
    text: string
  }
  title: string
  description?: string
  action: {
    text: string
    onClick?: () => void
    variant?: "default" | "outline" | "secondary"
  }
  withGlow?: boolean
  className?: string
}

export function CTASection({
  badge,
  title,
  description,
  action,
  withGlow = true,
  className,
}: CTAProps) {
  return (
    <section className={cn("overflow-hidden w-full", className)}>
      <motion.div 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={{
          visible: { transition: { staggerChildren: 0.1 } }
        }}
        className="relative mx-auto flex w-full flex-col items-center gap-6 text-center sm:gap-8 z-10 p-10 py-16"
      >
        {/* Badge */}
        {badge && (
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 15 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
            }}
          >
            <Badge
              variant="outline"
              className="dark:border-slate-700"
            >
              <span className="text-muted-foreground">{badge.text}</span>
            </Badge>
          </motion.div>
        )}

        {/* Title */}
        <motion.h2 
          variants={{
            hidden: { opacity: 0, y: 15 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
          }}
          className="text-3xl font-bold sm:text-4xl text-slate-800 dark:text-slate-100"
        >
          {title}
        </motion.h2>

        {/* Description */}
        {description && (
          <motion.p 
            variants={{
              hidden: { opacity: 0, y: 15 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
            }}
            className="text-slate-600 dark:text-slate-400 max-w-2xl text-sm sm:text-base leading-relaxed"
          >
            {description}
          </motion.p>
        )}

        {/* Action Button */}
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 15 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
          }}
        >
          <Button
            variant={action.variant || "default"}
            size="lg"
            onClick={action.onClick}
            className="mt-2 px-8 py-6 rounded-2xl text-md shadow-lg bg-blue-600 hover:bg-blue-700 text-white"
          >
            {action.text}
          </Button>
        </motion.div>

        {/* Glow Effect */}
        {withGlow && (
          <motion.div 
            variants={{
              hidden: { opacity: 0, scale: 0.95 },
              visible: { opacity: 1, scale: 1, transition: { duration: 0.7, ease: "easeOut", delay: 0.3 } }
            }}
            style={{ 
              boxShadow: "inset 0 0 60px rgba(96, 165, 250, 0.2), inset 0 0 20px rgba(37, 99, 235, 0.3)" 
            }}
            className="pointer-events-none absolute inset-0 rounded-3xl -z-10" 
          />
        )}
      </motion.div>
    </section>
  )
}
