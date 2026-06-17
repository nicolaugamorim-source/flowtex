"use client"

import { motion } from "framer-motion"
import { useInView } from "react-intersection-observer"

const steps = [
  {
    headline: "Connect your apps",
    body: "Link Gmail, Google Calendar, Notion, and Google Drive. One click each. Done in under a minute.",
  },
  {
    headline: "Give Flowtex context",
    body: "Tell it about your project, your team, and your clients. A quick brief — Flowtex remembers everything from here on.",
  },
  {
    headline: "Start working",
    body: "Ask anything, execute anything. Your workspace already knows your project — just tell it what you need.",
  },
]

export function HowItWorks() {
  const { ref, inView } = useInView({ threshold: 0.1, triggerOnce: true })

  return (
    <section ref={ref} className="py-20 md:py-24 px-4 md:px-6 bg-[var(--color-bg-base)]">
      <div className="w-[95%] max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-16">
          <span className="text-sm font-semibold text-[var(--color-accent)] tracking-widest">
            HOW IT WORKS
          </span>
          <h2 className="text-4xl lg:text-5xl font-semibold text-[var(--color-text-primary)] mt-4 mb-4">
            Up and running in 3 minutes.
          </h2>
          <p className="text-lg text-[var(--color-text-secondary)] max-w-2xl">
            No setup, no templates, no learning curve. Connect your apps and Flowtex is ready to work with you.
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-12 md:space-y-16">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="flex gap-8"
            >
              {/* Number */}
              <div className="flex-shrink-0">
                <div className="h-12 w-12 rounded-full bg-[var(--color-accent)] flex items-center justify-center">
                  <span className="text-lg font-semibold text-white">{i + 1}</span>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 pt-1">
                <h3 className="text-xl lg:text-2xl font-semibold text-[var(--color-text-primary)] mb-3">
                  {step.headline}
                </h3>
                <p className="text-base text-[var(--color-text-secondary)] leading-relaxed mb-6">
                  {step.body}
                </p>

                {/* Test text for first card */}
                {i === 0 && <p className="mb-4 text-sm text-[var(--color-text-primary)]">ola</p>}

                {/* Bubbles Section */}
                <div className="space-y-4">
                  {/* How it works */}
                  <div className="border-t border-[var(--color-border-default)] pt-4">
                    <p className="text-xs font-semibold text-[var(--color-text-muted)] mb-3 uppercase tracking-wide">How it works</p>
                    <div className="flex flex-col gap-2">
                      <div className="bg-blue-100 rounded-lg px-4 py-3 flex items-center relative overflow-hidden w-fit">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-100 via-blue-200 to-blue-100 animate-pulse"></div>
                        <p className="text-sm font-semibold text-blue-800 relative z-10">Processing request...</p>
                      </div>
                      <div className="bg-[var(--color-accent)] rounded-lg px-4 py-3 w-fit">
                        <p className="text-sm font-semibold text-[var(--color-text-primary)]">Ready</p>
                      </div>
                    </div>
                  </div>

                  {/* Up and running */}
                  <div className="border-t border-[var(--color-border-default)] pt-4">
                    <p className="text-xs font-semibold text-[var(--color-text-muted)] mb-3 uppercase tracking-wide">Up and running</p>
                    <div className="flex flex-col gap-2">
                      <div className="bg-purple-100 rounded-lg px-4 py-3 flex items-center relative overflow-hidden w-fit">
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-100 via-purple-200 to-purple-100 animate-pulse"></div>
                        <p className="text-sm font-semibold text-purple-800 relative z-10">Initializing...</p>
                      </div>
                      <div className="bg-[var(--color-accent)] rounded-lg px-4 py-3 w-fit">
                        <p className="text-sm font-semibold text-[var(--color-text-primary)]">Complete</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
