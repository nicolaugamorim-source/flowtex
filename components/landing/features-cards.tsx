"use client"

import { motion } from "framer-motion"
import { useInView } from "react-intersection-observer"

const features = [
  {
    label: "CLIENT MANAGEMENT",
    headline: "Add a client, schedule the kickoff, send the email.",
    body: "Just tell Flowtex what you need. It creates the client in Notion, schedules the meeting in Google Calendar, and drafts the email — all at once, in seconds.",
    command: "Add John as a new client, create a project called Website Redesign, and schedule a kickoff call for Friday at 2pm",
  },
  {
    label: "AI WITH CONTEXT",
    headline: "Your AI already knows the full story.",
    body: "Switch between Claude, ChatGPT, or Gemini and Flowtex feeds them the context they need — client name, project status, last decisions. No re-explaining, ever.",
    command: "Write a follow-up email to John about the proposal we discussed last Tuesday",
  },
  {
    label: "TEAM OVERVIEW",
    headline: "Everything your team is working on, in one place.",
    body: "Projects, tasks, meetings, and client updates — aggregated from all your apps into a single view. Your whole team sees the same picture.",
    command: "What's the status of all active projects and what's on the team's calendar this week?",
  },
]

export function FeaturesCards() {
  const { ref, inView } = useInView({ threshold: 0.1, triggerOnce: true })

  return (
    <section ref={ref} className="py-20 md:py-24 px-4 md:px-6 bg-[#F8FAFC]">
      <div className="w-[95%] max-w-5xl mx-auto">
        <div className="space-y-[8rem]">
          {features.map((feature, i) => {
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="group relative"
              >
                <div className="relative h-96 md:h-[28rem] rounded-2xl border border-[#C8D8E6] bg-[#E8EFF5] hover:border-[#C8D8E6]/60 hover:shadow-lg transition-all duration-300 p-4 flex flex-col overflow-hidden">
                  {/* Inner card */}
                  <div className={`absolute top-1/2 -translate-y-1/2 w-1/2 h-[90%] rounded-xl border border-[#C8D8E6] bg-[#DDE6EF] flex items-end justify-center p-4 ${
                    i === 1 ? 'left-6' : 'right-6'
                  }`}>
                    {/* Chat Bubble inside */}
                    <div className="bg-[#E8EFF5] rounded-lg p-3 w-full">
                      <p className="text-[#0D1F2D] text-base font-bold">
                        "{feature.command}"
                      </p>
                    </div>
                  </div>

                  {/* Content - Outside inner card */}
                  <div className={`relative z-10 w-[45%] flex flex-col justify-center h-full ${i === 1 ? 'ml-auto text-right pr-4' : 'pl-4'}`}>
                    {/* Label */}
                    <span className="text-sm font-semibold text-[#00D4A4] tracking-widest mb-3">
                      {feature.label}
                    </span>

                    {/* Headline */}
                    <h3 className="text-xl lg:text-2xl font-semibold text-[#0D1F2D] mb-3">
                      {feature.headline}
                    </h3>

                    {/* Body */}
                    <p className="text-base text-[#2E4A62] leading-relaxed">
                      {feature.body}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  )
}
