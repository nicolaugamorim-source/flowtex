"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface CTAProps {
  badge?: {
    text: string
  }
  title: string
  description?: string
  action: {
    text: string
    href: string
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
    <section className={cn("overflow-hidden py-20 md:py-24 bg-[var(--color-bg-base)]", className)}>
      <div className="relative mx-auto flex max-w-5xl flex-col items-center gap-6 px-4 md:px-6 py-12 text-center sm:gap-8">
        {/* Badge */}
        {badge && (
          <Badge
            variant="outline"
            className="opacity-0 animate-fade-in-up delay-100 text-[var(--color-accent)]"
          >
            {badge.text}
          </Badge>
        )}

        {/* Title */}
        <h2 className="text-4xl lg:text-5xl font-semibold text-[var(--color-text-primary)] opacity-0 animate-fade-in-up delay-200">
          {title}
        </h2>

        {/* Description */}
        {description && (
          <p className="text-lg text-[var(--color-text-secondary)] opacity-0 animate-fade-in-up delay-300 max-w-2xl">
            {description}
          </p>
        )}

        {/* Action Button */}
        <Link
          href={action.href}
          className="inline-flex items-center justify-center h-12 px-8 rounded-xl font-semibold bg-[var(--color-accent)] text-[var(--color-text-primary)] hover:bg-[#00B894] transition-all duration-300 opacity-0 animate-fade-in-up delay-500"
        >
          {action.text}
        </Link>

        {/* Glow Effect */}
        {withGlow && (
          <div className="fade-top-lg pointer-events-none absolute inset-0 rounded-2xl shadow-glow opacity-0 animate-scale-in delay-700" />
        )}
      </div>
    </section>
  )
}
