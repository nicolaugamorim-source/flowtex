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
    <section ref={ref} className="py-20 md:py-24 px-4 md:px-6 bg-[var(--color-bg-base)]">
      <div className="w-[95%] max-w-5xl mx-auto">
        <div className="space-y-[8rem]">
          {features.map((feature, i) => {
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
                transition={{ duration: 0.8, delay: i * 0.2, ease: "easeOut" }}
                whileHover={{ y: -10, transition: { duration: 0.3 } }}
                className="group relative"
              >
                <div className="relative h-96 md:h-[28rem] rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-bg-card)] hover:border-[var(--color-border-default)]/60 hover:shadow-lg transition-all duration-300 p-4 flex flex-col overflow-hidden">
                  {/* Inner card */}
                  {i === 0 ? (
                    <div className={`absolute top-1/2 -translate-y-1/2 w-1/2 h-[90%] rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-elevated)] flex flex-col items-center justify-center p-4 gap-4 right-6`}>
                      <div className="w-[70%] bg-[var(--color-bg-card)] rounded-lg border border-[var(--color-border-default)] p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <svg className="w-4 h-4 text-[var(--color-accent)]" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                          </svg>
                          <p className="text-sm font-semibold text-[var(--color-text-primary)]">Client Added</p>
                        </div>
                        <div className="flex justify-between items-center text-sm gap-2 mb-4">
                          <div className="flex gap-1">
                            <span className="font-medium text-[var(--color-text-primary)]">Name:</span>
                            <span className="text-[var(--color-text-primary)]">John</span>
                          </div>
                          <div className="flex gap-1">
                            <span className="font-medium text-[var(--color-text-primary)]">Obs:</span>
                            <span className="text-[var(--color-text-primary)]">None</span>
                          </div>
                        </div>
                        <p className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Task created - Website Redesign</p>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-5 h-5 rounded flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: "var(--color-info)" }}>
                            31
                          </div>
                          <p className="text-sm font-semibold text-[var(--color-text-primary)]">Google Calendar</p>
                        </div>
                        <p className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">Kickoff Call</p>
                        <p className="text-sm text-[var(--color-text-primary)]">Friday 02:00 PM</p>
                      </div>

                      <div className="bg-[var(--color-accent)] text-[var(--color-text-primary)] rounded-lg px-3 py-3 text-sm max-w-[85%] text-center font-semibold">
                        "{feature.command}"
                      </div>
                    </div>
                  ) : (
                    <div className={`absolute top-1/2 -translate-y-1/2 w-1/2 h-[90%] rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-elevated)] flex flex-col items-center justify-center p-4 gap-4 ${
                      i === 1 ? 'left-6' : 'right-6'
                    }`}>
                      {/* Response Bubble */}
                      <div className="w-[75%] bg-[var(--color-bg-card)] rounded-lg border border-[var(--color-border-default)] p-3">
                        {i === 1 ? (
                          <>
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-5 h-5 rounded flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: "var(--color-error)" }}>
                                G
                              </div>
                              <p className="text-sm font-semibold text-[var(--color-text-primary)]">Follow up email</p>
                            </div>
                            <div className="w-full text-left">
                              <p className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">Hello John,</p>
                              <p className="text-sm text-[var(--color-text-primary)] line-clamp-3 leading-relaxed">
                                I wanted to follow up on our meeting last Tuesday and see if you had any questions about the proposal. Let me know your thoughts...</p>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center gap-2 mb-3">
                              <svg className="w-5 h-5 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <p className="text-sm font-semibold text-[var(--color-text-primary)]">Report Generated</p>
                            </div>
                            <div className="w-full text-left space-y-2.5">
                              <div className="space-y-1.5">
                                <p className="text-sm font-semibold text-[var(--color-text-primary)]">Active Projects</p>
                                <div className="flex items-center gap-3">
                                  <div className="relative w-12 h-12">
                                    <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 100 100">
                                      <circle cx="50" cy="50" r="30" fill="none" stroke="var(--color-accent)" strokeWidth="12" strokeDasharray="113.1 188.5" strokeLinecap="round" />
                                      <circle cx="50" cy="50" r="30" fill="none" stroke="var(--color-warning)" strokeWidth="12" strokeDasharray="75.4 188.5" strokeDashoffset="-113.1" strokeLinecap="round" />
                                    </svg>
                                  </div>
                                  <div className="text-sm">
                                    <p className="text-[var(--color-text-primary)] font-semibold">5 running</p>
                                    <div className="flex flex-col gap-1 mt-1">
                                      <span className="text-xs flex items-center gap-1.5"><span className="inline-block w-2 h-2 rounded-full bg-[var(--color-accent)]"></span><span className="text-[var(--color-accent)] font-semibold">3 on track</span></span>
                                      <span className="text-xs flex items-center gap-1.5"><span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: "var(--color-warning)" }}></span><span style={{ color: "var(--color-warning)" }} className="font-semibold">2 at risk</span></span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="space-y-1.5">
                                <p className="text-sm font-semibold text-[var(--color-text-primary)]">This Week</p>
                                <p className="text-sm text-[var(--color-text-primary)]">12 meetings scheduled: 3 stakeholder reviews, 4 team syncs, 5 client calls</p>
                              </div>
                              <div className="border-t border-[var(--color-border-default)] pt-2.5 mt-2">
                                <p className="text-sm text-[var(--color-text-primary)]">
                                  <span className="font-semibold">Note:</span> Don't forget tomorrow's meeting with John about Website Redesign scope
                                </p>
                              </div>
                            </div>
                          </>
                        )}
                      </div>

                      {/* User Chat Bubble */}
                      <div className="bg-[var(--color-accent)] text-[var(--color-text-primary)] rounded-lg px-3 py-3 text-sm max-w-[85%] text-center font-semibold">
                        "{feature.command}"
                      </div>
                    </div>
                  )}


                  {/* Content - Outside inner card */}
                  <div className={`relative z-10 w-[45%] flex flex-col justify-center h-full ${i === 1 ? 'ml-auto text-right pr-4' : 'pl-4'}`}>
                    {/* Label */}
                    <span className="text-sm font-semibold text-[var(--color-accent)] tracking-widest mb-3">
                      {feature.label}
                    </span>

                    {/* Headline */}
                    <h3 className="text-xl lg:text-2xl font-semibold text-[var(--color-text-primary)] mb-3">
                      {feature.headline}
                    </h3>

                    {/* Body */}
                    <p className="text-base text-[var(--color-text-secondary)] leading-relaxed">
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
