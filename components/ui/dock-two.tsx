import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface DockProps {
  className?: string
  items: {
    label: string
    onClick?: () => void
    isLogo?: boolean
    isButton?: boolean
  }[]
}

interface DockItemProps {
  label: string
  onClick?: () => void
  className?: string
  isLogo?: boolean
  isButton?: boolean
}

const floatingAnimation = {
  initial: { y: 0 },
  animate: {
    y: [-2, 2, -2],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
}

const DockItem = React.forwardRef<HTMLButtonElement, DockItemProps>(
  ({ label, onClick, className, isLogo, isButton }, ref) => {
    if (isLogo) {
      return (
        <motion.button
          ref={ref}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={onClick}
          className={cn(
            "relative group flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap",
            "text-base font-semibold text-[var(--color-text-primary)]",
            "hover:bg-[color-mix(in_srgb,var(--color-text-primary)_8%,transparent)] transition-colors",
            className
          )}
        >
          <img src="/logo.svg" alt="Flowtex" width={32} height={32} />
          {label}
        </motion.button>
      )
    }

    if (isButton) {
      return (
        <motion.button
          ref={ref}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={onClick}
          className={cn(
            "relative group px-5 py-2 rounded-full whitespace-nowrap",
            "text-sm font-semibold transition-colors shadow-md hover:shadow-lg",
            className
          )}
          style={{
            backgroundColor: "var(--color-accent)",
            color: "var(--color-bg)",
          }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--color-accent-dark)")}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = "var(--color-accent)")}
        >
          {label}
        </motion.button>
      )
    }

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className={cn(
          "relative group px-4 py-2 rounded-lg whitespace-nowrap",
          "text-sm font-medium transition-colors",
          className
        )}
        style={{ color: "var(--color-text-muted)" }}
        onMouseEnter={e => (e.currentTarget.style.color = "var(--color-text-primary)")}
        onMouseLeave={e => (e.currentTarget.style.color = "var(--color-text-muted)")}
      >
        {label}
      </motion.button>
    )
  }
)
DockItem.displayName = "DockItem"

const Dock = React.forwardRef<HTMLDivElement, DockProps>(
  ({ items, className }, ref) => {
    return (
      <div ref={ref} className={cn("flex items-center justify-center p-4", className)}>
        <motion.div
          className={cn(
            "flex items-center gap-3 px-6 py-2 rounded-full",
            "backdrop-blur-lg",
            "shadow-lg hover:shadow-xl transition-shadow duration-300",
            "max-w-5xl"
          )}
          style={{
            backgroundColor: "color-mix(in srgb, var(--color-surface) 88%, transparent)",
            border: "1px solid var(--color-border-subtle)",
          }}
        >
          {items.map((item, index) => (
            <DockItem key={item.label} {...item} className={index === 0 ? "mr-8" : ""} />
          ))}
        </motion.div>
      </div>
    )
  }
)
Dock.displayName = "Dock"

export { Dock }
