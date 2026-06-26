"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AnimatedLine } from "@/components/ui/animated-line"
import { cn } from "@/lib/utils"
import { usePostHog } from "posthog-js/react"

interface CTAProps {
  badge?: {
    text: string
  }
  title: string
  description?: string
  action: {
    text: string
    href: string
    variant?: "default" | "glow"
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
  const posthog = usePostHog()

  return (
    <section className={cn("overflow-hidden pt-0 md:pt-0", className)}>
      <div className="relative mx-auto flex max-w-container flex-col items-center gap-6 px-8 py-12 text-center sm:gap-8 md:py-24">
        {/* Badge */}
        {badge && (
          <Badge
            variant="outline"
            className="text-[var(--color-accent)] animate-fade-in-up delay-100"
          >
            {badge.text}
          </Badge>
        )}

        {/* Title */}
        <div className="flex flex-col items-center">
          <h2
            className="text-5xl lg:text-6xl font-semibold text-[var(--color-text-primary)] animate-fade-in-up delay-200"
          >
            {title.split('<br />')[0]}
          </h2>
          {/* Animated Line */}
          <AnimatedLine
            color="rgb(0, 212, 164)"
            duration={1.5}
            className="animate-fade-in-up delay-300 -my-3 ml-48"
          />
          <h2
            className="text-5xl lg:text-6xl font-semibold text-[var(--color-text-primary)] animate-fade-in-up delay-400"
          >
            {title.split('<br />')[1]}
          </h2>
        </div>

        {/* Description */}
        {description && (
          <p
            className="text-lg text-[var(--color-text-secondary)] animate-fade-in-up delay-300 max-w-2xl"
            dangerouslySetInnerHTML={{ __html: description }}
          />
        )}

        {/* Action Button */}
        <Button
          variant={(action.variant === "glow" ? "default" : action.variant) || "default"}
          size="lg"
          className="animate-fade-in-up delay-500"
          asChild
        >
          <a
            href={action.href}
            onClick={() => posthog?.capture('cta_clicked', { button_label: action.text, position: 'footer' })}
          >
            {action.text}
          </a>
        </Button>

        {/* Glow Effect */}
        {withGlow && (
          <div className="fade-top-lg pointer-events-none absolute inset-0 rounded-2xl shadow-glow animate-scale-in delay-700" />
        )}
      </div>
    </section>
  )
}
