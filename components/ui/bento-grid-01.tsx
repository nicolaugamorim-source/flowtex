"use client"

import React from "react"
import { motion } from "framer-motion"
import { Brain, MessageSquare, Cpu, History, Plug, Lock } from "lucide-react"

export function BentoGrid01() {
  return (
    <section className="bg-[#080C12] px-6 py-24 flex items-center justify-center">
      <div className="max-w-7xl w-full mx-auto">
        <motion.h2
          className="text-[clamp(2.5rem,5vw,5rem)] font-bold text-[#F8FAFC] mb-16 leading-tight"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          Built for founders who move fast
        </motion.h2>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 auto-rows-[200px]">

          {/* 1. One brain - Tall (2x2) */}
          <motion.div
            className="md:col-span-2 md:row-span-2 bg-gradient-to-br from-[#00D4A4]/15 to-[#00D4A4]/5 border border-[#00D4A4]/10 rounded-xl p-8 flex flex-col hover:border-[#00D4A4]/30 transition-colors cursor-pointer overflow-hidden"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.02, backgroundColor: "rgba(212, 212, 216, 0.08)" }}
          >
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="mb-6"
            >
              <Brain className="w-8 h-8 text-[#00D4A4]" />
            </motion.div>
            <div className="flex-1">
              <h3 className="text-xl text-[#F8FAFC] font-semibold mb-3">One brain for your entire business</h3>
              <p className="text-[#7A96AA] text-sm leading-relaxed">Connect Notion, Gmail, GitHub, Slack and more. Flowtex aggregates everything into one place and keeps your context updated automatically — no manual work.</p>
            </div>
          </motion.div>

          {/* 2. Manage in plain language - Standard (2x1) */}
          <motion.div
            className="md:col-span-2 bg-gradient-to-br from-[#00D4A4]/15 to-[#00D4A4]/5 border border-[#00D4A4]/10 rounded-xl p-8 flex flex-col hover:border-[#00D4A4]/30 transition-colors cursor-pointer overflow-hidden"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            whileHover={{ scale: 0.98 }}
          >
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="mb-4"
            >
              <MessageSquare className="w-8 h-8 text-[#00D4A4]" />
            </motion.div>
            <div className="flex-1">
              <h3 className="text-xl text-[#F8FAFC] font-semibold mb-2">Manage everything in plain language</h3>
              <p className="text-[#7A96AA] text-sm leading-relaxed">Ask about any project, client, or task. Update your Notion, send emails, create tasks — all through one chat, without opening 6 different apps.</p>
            </div>
          </motion.div>

          {/* 3. Best AI for every job - Tall (2x2) */}
          <motion.div
            className="md:col-span-2 md:row-span-2 bg-gradient-to-br from-[#00D4A4]/10 to-[#00D4A4]/5 border border-[#00D4A4]/10 rounded-xl p-6 flex flex-col hover:border-[#00D4A4]/30 transition-colors cursor-pointer overflow-hidden"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.02, boxShadow: "0 25px 50px -12px rgba(212, 212, 216, 0.1)" }}
          >
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="mb-6"
            >
              <Cpu className="w-8 h-8 text-[#00D4A4]" />
            </motion.div>
            <div className="flex-1">
              <h3 className="text-xl text-[#F8FAFC] font-semibold mb-3">The best AI for every job</h3>
              <p className="text-[#7A96AA] text-sm leading-relaxed">Claude for code. GPT for writing. Flowtex routes each task to the right model automatically — all with your full business context present.</p>
            </div>
          </motion.div>

          {/* 4. Memory - Standard (2x1) */}
          <motion.div
            className="md:col-span-2 bg-gradient-to-br from-[#00D4A4]/15 to-[#00D4A4]/5 border border-[#00D4A4]/10 rounded-xl p-8 flex flex-col hover:border-[#00D4A4]/30 transition-colors cursor-pointer overflow-hidden"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 0.98 }}
          >
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="mb-4"
            >
              <History className="w-8 h-8 text-[#00D4A4]" />
            </motion.div>
            <div className="flex-1">
              <h3 className="text-xl text-[#F8FAFC] font-semibold mb-2">Memory that grows with you</h3>
              <p className="text-[#7A96AA] text-sm leading-relaxed">Every decision, update, and conversation is stored. Your context gets richer over time — ask anything about your business, anytime.</p>
            </div>
          </motion.div>

          {/* 5. Works with your stack - Wide (3x1) */}
          <motion.div
            className="md:col-span-3 bg-gradient-to-br from-[#00D4A4]/15 to-[#00D4A4]/5 border border-[#00D4A4]/10 rounded-xl p-8 flex flex-col hover:border-[#00D4A4]/30 transition-colors cursor-pointer overflow-hidden"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 0.98 }}
          >
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="mb-4"
            >
              <Plug className="w-8 h-8 text-[#00D4A4]" />
            </motion.div>
            <div className="flex-1">
              <h3 className="text-xl text-[#F8FAFC] font-semibold mb-2">Works with your stack</h3>
              <p className="text-[#7A96AA] text-sm leading-relaxed">Connects with the tools you already use. No migration, no new workflow — Flowtex fits in.</p>
            </div>
          </motion.div>

          {/* 6. You own your context - Wide (3x1) */}
          <motion.div
            className="md:col-span-3 bg-gradient-to-br from-[#00D4A4]/15 to-[#00D4A4]/5 border border-[#00D4A4]/10 rounded-xl p-8 flex flex-col hover:border-[#00D4A4]/30 transition-colors cursor-pointer overflow-hidden"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            whileHover={{ scale: 0.98 }}
          >
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="mb-4"
            >
              <Lock className="w-8 h-8 text-[#00D4A4]" />
            </motion.div>
            <div className="flex-1">
              <h3 className="text-xl text-[#F8FAFC] font-semibold mb-2">You own your context</h3>
              <p className="text-[#7A96AA] text-sm leading-relaxed">Your business data stays yours. Flowtex never trains on your data and gives you full control over what's connected and what's not.</p>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  )
}

