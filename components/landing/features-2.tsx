"use client"

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Zap, Database, MessageSquare } from 'lucide-react'
import { ReactNode } from 'react'

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
    return (
        <section className="py-16 md:py-32 bg-[#F8FAFC]">
            <div className="@container mx-auto max-w-7xl px-6">
                <div className="text-center">
                    <span className="text-sm font-semibold text-[#00D4A4] tracking-widest">
                        HOW IT WORKS
                    </span>
                    <h2 className="text-balance text-4xl font-semibold lg:text-5xl text-[#0D1F2D] mt-4 mb-4">Up and running in 3 minutes.</h2>
                    <p className="mt-4 text-lg lg:text-xl text-[#2E4A62] max-w-2xl mx-auto leading-relaxed">
                        No setup, no templates, no learning curve.<br />
                        Connect your apps and Flowtex is ready to work with you.
                    </p>
                </div>
                <div className="@min-4xl:max-w-full @min-4xl:grid-cols-3 mx-auto mt-8 grid max-w-full gap-6 md:mt-16">
                    {steps.map((step, i) => {
                        const IconComponent = step.icon
                        return (
                            <Card key={i} className="group border border-[#C8D8E6] bg-[#E8EFF5] shadow-none hover:shadow-lg transition-all duration-300 overflow-hidden text-left">
                                <div className="h-48"></div>
                                <div className="h-px bg-[#C8D8E6]"></div>
                                <CardHeader className="pt-6 pb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-[#DDE6EF] border border-[#C8D8E6] rounded flex-shrink-0 flex items-center justify-center">
                                            <span className="text-sm font-bold text-[#0D1F2D]">{i + 1}</span>
                                        </div>
                                        <h3 className="font-bold text-xl lg:text-2xl text-[#0D1F2D]">{step.headline}</h3>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-xl text-[#2E4A62]">{step.body}</p>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}

const CardDecorator = ({ children }: { children: ReactNode }) => (
    <div aria-hidden className="relative mx-auto size-48 [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]">
        <div className="absolute inset-0 [--border:#0D1F2D] bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:24px_24px] opacity-20"/>
        <div className="bg-[#F8FAFC] absolute inset-0 m-auto flex size-12 items-center justify-center border-t border-l border-[#C8D8E6]">{children}</div>
    </div>
)
