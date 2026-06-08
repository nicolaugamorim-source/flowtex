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
    <section ref={ref} className="py-20 md:py-24 px-4 md:px-6 bg-[#F8FAFC]">
      <div className="w-[95%] max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-16">
          <span className="text-sm font-semibold text-[#00D4A4] tracking-widest">
            HOW IT WORKS
          </span>
          <h2 className="text-4xl lg:text-5xl font-semibold text-[#0D1F2D] mt-4 mb-4">
            Up and running in 3 minutes.
          </h2>
          <p className="text-lg text-[#2E4A62] max-w-2xl">
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
                <div className="h-12 w-12 rounded-full bg-[#00D4A4] flex items-center justify-center">
                  <span className="text-lg font-semibold text-white">{i + 1}</span>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 pt-1">
                <h3 className="text-xl lg:text-2xl font-semibold text-[#0D1F2D] mb-3">
                  {step.headline}
                </h3>
                <p className="text-base text-[#2E4A62] leading-relaxed">
                  {step.body}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
