"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"

const apps = [
  {
    name: "Notion",
    logo: "https://cdn.worldvectorlogo.com/logos/notion-2.svg",
    delay: 0,
  },
  {
    name: "Gmail",
    logo: "https://cdn.worldvectorlogo.com/logos/gmail.svg",
    delay: 1.5,
  },
  {
    name: "GitHub",
    logo: "https://cdn.worldvectorlogo.com/logos/github-icon-1.svg",
    delay: 3,
  },
  {
    name: "Slack",
    logo: "https://cdn.worldvectorlogo.com/logos/slack-new-logo.svg",
    delay: 4.5,
  },
  {
    name: "Linear",
    logo: "https://cdn.worldvectorlogo.com/logos/linear.svg",
    delay: 6,
  },
]

export const WaitlistHero = () => {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle")
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setStatus("loading")

    setTimeout(() => {
      setStatus("success")
      setEmail("")
      fireConfetti()
    }, 1500)
  }

  const fireConfetti = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const particles: Array<{
      x: number
      y: number
      vx: number
      vy: number
      life: number
      color: string
      size: number
    }> = []
    const colors = ["var(--color-accent)", "var(--color-text-primary)", "var(--color-text-secondary)", "var(--color-accent)"]

    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    const createParticle = () => {
      return {
        x: canvas.width / 2,
        y: canvas.height / 2,
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 2) * 10,
        life: 100,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 4 + 2,
      }
    }

    for (let i = 0; i < 50; i++) {
      particles.push(createParticle())
    }

    const animate = () => {
      if (particles.length === 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        return
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.5
        p.life -= 2

        ctx.fillStyle = p.color
        ctx.globalAlpha = Math.max(0, p.life / 100)
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()

        if (p.life <= 0) {
          particles.splice(i, 1)
          i--
        }
      }

      requestAnimationFrame(animate)
    }

    animate()
  }

  const colors = {
    textMain: "var(--color-text-primary)",
    textSecondary: "var(--color-text-secondary)",
    accent: "var(--color-accent)",
    accentHover: "var(--color-accent-hover)",
    inputBg: "#141414",
    baseBg: "#0C0C0C",
    inputShadow: "rgba(255, 184, 0, 0.1)",
    success: "#10B981",
  }

  return (
    <div className="w-full min-h-[100dvh] bg-[#0C0C0C] flex items-center justify-center overflow-hidden">
      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 120s linear infinite;
        }
        @keyframes spin-slow-reverse {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }
        .animate-spin-slow-reverse {
          animation: spin-slow-reverse 140s linear infinite;
        }
        @keyframes float-motion {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-16px); }
        }
        @keyframes bounce-in {
          0% { transform: scale(0.8); opacity: 0; }
          50% { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-bounce-in {
          animation: bounce-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        @keyframes success-pulse {
          0% { transform: scale(0.5); opacity: 0; }
          50% { transform: scale(1.1); }
          70% { transform: scale(0.95); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes success-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(255, 184, 0, 0.4); }
          50% { box-shadow: 0 0 60px rgba(255, 184, 0, 0.8), 0 0 100px rgba(255, 184, 0, 0.4); }
        }
        @keyframes checkmark-draw {
          0% { stroke-dashoffset: 24; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes celebration-ring {
          0% { transform: translate(-50%, -50%) scale(0.8); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
        }
        .animate-success-pulse {
          animation: success-pulse 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        .animate-success-glow {
          animation: success-glow 2s ease-in-out infinite;
        }
        .animate-checkmark {
          stroke-dasharray: 24;
          stroke-dashoffset: 24;
          animation: checkmark-draw 0.4s ease-out 0.3s forwards;
        }
        .animate-ring {
          animation: celebration-ring 0.8s ease-out forwards;
        }
      `}</style>

      <div
        className="relative w-full h-screen overflow-hidden"
        style={{
          backgroundColor: colors.baseBg,
        }}
      >
        {/* Background Decorative Layer */}
        <div
          className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden"
          style={{
            perspective: "1200px",
          }}
        >
          {/* Blur orbs - animated background */}
          <div className="absolute -top-1/3 -left-1/4 w-96 h-96 bg-[var(--color-accent)]/10 rounded-full blur-3xl opacity-20 animate-spin-slow" />
          <div className="absolute -bottom-1/4 -right-1/4 w-96 h-96 bg-[var(--color-accent)]/10 rounded-full blur-3xl opacity-15 animate-spin-slow-reverse" />
          <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-[var(--color-accent)]/5 rounded-full blur-3xl opacity-10 -translate-x-1/2 -translate-y-1/2" />

          {/* Floating app icons */}
          <div className="absolute inset-0 w-full h-full">
            {apps.map((app, idx) => {
              const angle = (idx / apps.length) * 360
              const radius = 280
              const x = Math.cos((angle * Math.PI) / 180) * radius
              const y = Math.sin((angle * Math.PI) / 180) * radius

              return (
                <div
                  key={app.name}
                  className="absolute opacity-20 hover:opacity-40 transition-opacity duration-300 group"
                  style={{
                    left: "50%",
                    top: "50%",
                    transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                  }}
                >
                  <div
                    className="w-16 h-16 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 flex items-center justify-center group-hover:border-white/20 transition-all"
                    style={{
                      animation: `float-motion 4s ease-in-out infinite`,
                      animationDelay: `${app.delay}s`,
                    }}
                  >
                    <Image
                      src={app.logo}
                      alt={app.name}
                      width={40}
                      height={40}
                      className="w-8 h-8 object-contain filter brightness-0 invert"
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Gradient Overlay */}
        <div
          className="absolute inset-0 z-10 pointer-events-none"
          style={{
            background: `linear-gradient(to top, ${colors.baseBg} 15%, rgba(12, 12, 12, 0.8) 45%, transparent 100%)`,
          }}
        />

        {/* Content Container */}
        <div className="relative z-20 w-full h-full flex flex-col items-center justify-center px-4 py-20">
          <div className="flex flex-col items-center text-center space-y-8 max-w-2xl">
            {/* Logo/Icon */}
            <div className="w-16 h-16 rounded-2xl shadow-lg overflow-hidden ring-1 ring-white/10 flex items-center justify-center bg-gradient-to-br from-[var(--color-accent)]/20 to-[var(--color-accent)]/10">
              <svg className="w-8 h-8 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>

            {/* Heading */}
            <div>
              <h1
                className="text-[clamp(2.75rem,5.5vw,5.5rem)] font-bold text-center tracking-tight leading-[1.2]"
                style={{ color: colors.textMain }}
              >
                Unify your AI brain
              </h1>
              <p className="text-base md:text-lg mt-6" style={{ color: colors.textSecondary }}>
                Connect all your tools. Give Claude the full context of your business.
              </p>
            </div>

            {/* Form / Success Container */}
            <div className="w-full max-w-md mt-8 h-16 relative perspective-1000">
              {/* Confetti Canvas */}
              <canvas
                ref={canvasRef}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] pointer-events-none z-50"
              />

              {/* SUCCESS STATE */}
              <div
                className={`absolute inset-0 flex items-center justify-center rounded-2xl transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${
                  status === "success"
                    ? "opacity-100 scale-100 rotate-x-0 animate-success-pulse animate-success-glow"
                    : "opacity-0 scale-95 -rotate-x-90 pointer-events-none"
                }`}
                style={{ backgroundColor: colors.success }}
              >
                {/* Celebration rings */}
                {status === "success" && (
                  <>
                    <div
                      className="absolute top-1/2 left-1/2 w-full h-full rounded-full border-2 border-emerald-400 animate-ring"
                      style={{ animationDelay: "0s" }}
                    />
                    <div
                      className="absolute top-1/2 left-1/2 w-full h-full rounded-full border-2 border-emerald-300 animate-ring"
                      style={{ animationDelay: "0.15s" }}
                    />
                    <div
                      className="absolute top-1/2 left-1/2 w-full h-full rounded-full border-2 border-emerald-200 animate-ring"
                      style={{ animationDelay: "0.3s" }}
                    />
                  </>
                )}
                <div
                  className={`flex items-center gap-2 text-white font-semibold text-lg ${
                    status === "success" ? "animate-bounce-in" : ""
                  }`}
                >
                  <div className="bg-white/20 p-1 rounded-full">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        className={status === "success" ? "animate-checkmark" : ""}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <span>You are on the list!</span>
                </div>
              </div>

              {/* FORM STATE */}
              <form
                onSubmit={handleSubmit}
                className={`relative w-full h-full group transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${
                  status === "success"
                    ? "opacity-0 scale-95 rotate-x-90 pointer-events-none"
                    : "opacity-100 scale-100 rotate-x-0"
                }`}
              >
                <input
                  type="email"
                  required
                  placeholder="your@email.com"
                  value={email}
                  disabled={status === "loading"}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-full pl-6 pr-32 rounded-2xl outline-none transition-all duration-200 placeholder-zinc-600 disabled:opacity-70 disabled:cursor-not-allowed text-sm md:text-base"
                  style={{
                    backgroundColor: colors.inputBg,
                    color: colors.textMain,
                    boxShadow: `inset 0 0 0 1px ${colors.inputShadow}`,
                  }}
                />

                <div className="absolute top-2 right-2 bottom-2">
                  <button
                    type="submit"
                    disabled={status === "loading"}
                    className="h-full px-6 rounded-xl font-medium text-white transition-all active:scale-95 hover:brightness-110 disabled:hover:brightness-100 disabled:active:scale-100 disabled:cursor-wait flex items-center justify-center whitespace-nowrap text-sm md:text-base"
                    style={{ backgroundColor: colors.accent }}
                  >
                    {status === "loading" ? (
                      <svg
                        className="animate-spin h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                    ) : (
                      "Join Waitlist"
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Footer Text */}
            <p className="text-xs md:text-sm mt-6" style={{ color: colors.textSecondary }}>
              Get early access. First 100 get 20% lifetime discount.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

