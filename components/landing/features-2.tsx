"use client"

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Zap, Database, MessageSquare, Search, ArrowRight } from 'lucide-react'
import { SiGmail, SiGooglecalendar, SiNotion, SiGoogledrive } from 'react-icons/si'
import { MessageCircle, CheckCircle2 } from 'lucide-react'
import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'

const steps = [
  {
    icon: Zap,
    headline: "Connect your apps",
    body: "Gmail, Calendar, Notion, and Drive. One click each.",
  },
  {
    icon: Database,
    headline: "Tell it about your project",
    body: "A quick brief. Flowtex remembers everything from here on.",
  },
  {
    icon: MessageSquare,
    headline: "Just ask",
    body: "Execute tasks, get answers, stay in sync all in one place.",
  },
]

export function Features() {
    const { ref, inView } = useInView({ threshold: 0.1, triggerOnce: true })

    return (
        <section ref={ref} className="py-16 md:py-32 bg-[var(--color-bg-base)]">
            <div className="@container mx-auto max-w-7xl px-6">
                <motion.div
                    className="text-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                >
                    <span className="text-sm font-semibold text-[var(--color-accent)] tracking-widest">
                        HOW IT WORKS
                    </span>
                    <h2 className="text-balance text-4xl font-semibold lg:text-5xl text-[var(--color-text-primary)] mt-4 mb-4">Up and running in 3 minutes.</h2>
                    <p className="mt-4 text-lg lg:text-xl text-[var(--color-text-secondary)] max-w-2xl mx-auto leading-relaxed">
                        No setup, no templates, no learning curve.<br />
                        Connect your apps and Flowtex is ready to work with you.
                    </p>
                </motion.div>
                <div className="@min-4xl:max-w-full @min-4xl:grid-cols-3 mx-auto mt-8 grid max-w-full gap-6 md:mt-16">
                    {steps.map((step, i) => {
                        const IconComponent = step.icon
                        return (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 40 }}
                                animate={inView ? { opacity: 1, y: 0 } : {}}
                                transition={{ duration: 0.6, delay: i * 0.15 }}
                                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                            >
                            <Card className="group border border-[var(--color-border-default)] bg-[var(--color-bg-card)] shadow-none hover:shadow-lg transition-all duration-300 overflow-hidden text-left">
                                <div className="h-48 bg-[var(--color-bg-elevated)] flex flex-col items-center justify-center gap-4 p-4">
                                  {i === 0 && (
                                    <div className="flex items-center justify-center gap-8">
                                      <div className="w-10 h-10 rounded-lg bg-white border-2 border-[var(--color-accent)] flex items-center justify-center hover:bg-[var(--color-bg-base)] transition-all -translate-y-3">
                                        <SiGmail className="w-5 h-5 text-[var(--color-text-primary)]" />
                                      </div>
                                      <div className="w-10 h-10 rounded-lg bg-white border-2 border-[var(--color-accent)] flex items-center justify-center hover:bg-[var(--color-bg-base)] transition-all translate-y-3">
                                        <SiGooglecalendar className="w-5 h-5 text-[var(--color-text-primary)]" />
                                      </div>
                                      <div className="w-10 h-10 rounded-lg bg-white border-2 border-[var(--color-accent)] flex items-center justify-center hover:bg-[var(--color-bg-base)] transition-all -translate-y-3">
                                        <SiNotion className="w-5 h-5 text-[var(--color-text-primary)]" />
                                      </div>
                                      <div className="w-10 h-10 rounded-lg bg-white border-2 border-[var(--color-accent)] flex items-center justify-center hover:bg-[var(--color-bg-base)] transition-all translate-y-3">
                                        <SiGoogledrive className="w-5 h-5 text-[var(--color-text-primary)]" />
                                      </div>
                                    </div>
                                  )}
                                  {i === 1 && (
                                    <div className="flex flex-col items-center justify-center gap-4 w-full">
                                      <div className="w-full max-w-xs bg-white rounded-lg border border-[var(--color-border-default)] p-3 space-y-2">
                                        <p className="text-xs text-[var(--color-text-muted)]">Your brief:</p>
                                        <div className="space-y-1.5">
                                          <div className="h-1.5 bg-[#E0E5EB] rounded w-full"></div>
                                          <div className="h-1.5 bg-[#E0E5EB] rounded w-4/5"></div>
                                          <div className="h-1.5 bg-[#E0E5EB] rounded w-3/4"></div>
                                          <div className="h-1.5 bg-[#E0E5EB] rounded w-2/5"></div>
                                        </div>
                                      </div>
                                      <div className="w-full max-w-xs bg-[var(--color-accent)] rounded-lg p-3">
                                        <p className="text-xs font-semibold text-[var(--color-text-primary)]">✓ Remembers</p>
                                      </div>
                                    </div>
                                  )}
                                  {i === 2 && (
                                    <>
                                      <div className="relative w-full max-w-xs">
                                        <input
                                          type="text"
                                          placeholder="Ask anything..."
                                          disabled
                                          className="w-full px-4 py-2.5 rounded-lg border-2 border-[var(--color-accent)] bg-white text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] disabled:opacity-75 pr-10"
                                        />
                                        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)] pointer-events-none" />
                                      </div>
                                      <div className="flex flex-col gap-2 w-fit">
                                        <button disabled className="px-3 py-1.5 rounded-md bg-white border border-[var(--color-border-default)] text-xs text-[var(--color-text-primary)] hover:bg-[var(--color-bg-base)] disabled:opacity-75 whitespace-nowrap">Write me email</button>
                                        <button disabled className="px-3 py-1.5 rounded-md bg-white border border-[var(--color-border-default)] text-xs text-[var(--color-text-primary)] hover:bg-[var(--color-bg-base)] disabled:opacity-75 whitespace-nowrap">Schedule a meeting</button>
                                      </div>
                                    </>
                                  )}
                                </div>
                                <div className="h-px bg-[var(--color-border-default)]"></div>
                                <CardHeader className="pt-6 pb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded flex-shrink-0 flex items-center justify-center">
                                            <span className="text-sm font-bold text-[var(--color-text-primary)]">{i + 1}</span>
                                        </div>
                                        <h3 className="font-bold text-xl lg:text-2xl text-[var(--color-text-primary)]">{step.headline}</h3>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-xl text-[var(--color-text-secondary)]">{step.body}</p>
                                </CardContent>
                            </Card>
                            </motion.div>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}

const CardDecorator = ({ children }: { children: ReactNode }) => (
    <div aria-hidden className="relative mx-auto size-48 [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]">
        <div className="absolute inset-0 [--border:var(--color-text-primary)] bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:24px_24px] opacity-20"/>
        <div className="bg-[var(--color-bg-base)] absolute inset-0 m-auto flex size-12 items-center justify-center border-t border-l border-[var(--color-border-default)]">{children}</div>
    </div>
)
