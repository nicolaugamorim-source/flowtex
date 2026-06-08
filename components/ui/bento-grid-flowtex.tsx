"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Lock, Brain, MessageSquare, Cpu, History, Plug } from "lucide-react"

function TypeTester() {
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const interval = setInterval(() => {
      setScale((prev) => (prev === 1 ? 1.5 : 1))
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex items-center justify-center h-full">
      <motion.span
        className="font-serif text-6xl md:text-8xl text-[#00D4A4] font-medium"
        animate={{ scale }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        ∞
      </motion.span>
    </div>
  )
}

function LayoutAnimation() {
  const [layout, setLayout] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setLayout((prev) => (prev + 1) % 3)
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  const layouts = ["grid-cols-2", "grid-cols-3", "grid-cols-1"]

  return (
    <div className="h-full flex items-center justify-center">
      <motion.div
        className={`grid ${layouts[layout]} gap-1.5 w-full max-w-[140px] h-full`}
        layout
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="bg-[#00D4A4]/20 rounded-md h-5 w-full"
            layout
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          />
        ))}
      </motion.div>
    </div>
  )
}

function SpeedIndicator() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 500)
    return () => clearTimeout(timeout)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <div className="h-10 flex items-center justify-center overflow-hidden relative w-full">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loader"
              className="h-8 w-24 bg-[#00D4A4]/10 rounded"
              initial={{ opacity: 0.5 }}
              animate={{ opacity: [0.4, 0.7, 0.4] }}
              exit={{ opacity: 0, y: -20, position: 'absolute' }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          ) : (
            <motion.span
              key="text"
              initial={{ y: 20, opacity: 0, filter: "blur(5px)" }}
              animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
              className="text-3xl md:text-4xl font-sans font-medium text-[#00D4A4]"
            >
              20x
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      <span className="text-sm text-[#7A96AA]">Faster</span>
      <div className="w-full max-w-[120px] h-1.5 bg-[#00D4A4]/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-[#00D4A4] rounded-full"
          initial={{ width: 0 }}
          animate={{ width: loading ? 0 : "100%" }}
          transition={{ type: "spring", stiffness: 100, damping: 15, mass: 1 }}
        />
      </div>
    </div>
  )
}

function SecurityBadge() {
  const [shields, setShields] = useState([
    { id: 1, active: false },
    { id: 2, active: false },
    { id: 3, active: false }
  ])

  useEffect(() => {
    const interval = setInterval(() => {
      setShields(prev => {
        const nextIndex = prev.findIndex(s => !s.active)
        if (nextIndex === -1) {
          return prev.map(() => ({ id: Math.random(), active: false }))
        }
        return prev.map((s, i) => i === nextIndex ? { ...s, active: true } : s)
      })
    }, 800)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex items-center justify-center h-full gap-2">
      {shields.map((shield) => (
        <motion.div
          key={shield.id}
          className={`w-12 h-12 rounded-lg flex items-center justify-center ${
            shield.active ? 'bg-[#00D4A4]/20' : 'bg-[#00D4A4]/5'
          }`}
          animate={{ scale: shield.active ? 1.1 : 1 }}
          transition={{ duration: 0.3 }}
        >
          <Lock className={`w-5 h-5 ${shield.active ? 'text-[#00D4A4]' : 'text-[#7A96AA]'}`} />
        </motion.div>
      ))}
    </div>
  )
}

function GlobalNetwork() {
  const [pulses] = useState([0, 1, 2, 3, 4])

  return (
    <div className="flex items-center justify-center h-full relative">
      <Globe className="w-16 h-16 text-[#00D4A4]/80 z-10" />
      {pulses.map((pulse) => (
        <motion.div
          key={pulse}
          className="absolute w-16 h-16 border-2 border-[#00D4A4]/30 rounded-full"
          initial={{ scale: 0.5, opacity: 1 }}
          animate={{ scale: 3, opacity: 0 }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay: pulse * 0.8,
            ease: "easeOut"
          }}
        />
      ))}
    </div>
  )
}

export function BentoGridFlowtex() {
  return (
    <section className="bg-[#080C12] px-6 py-24 flex items-center justify-center">
      <div className="max-w-7xl w-full mx-auto">
        {/* Title */}
        <motion.h2
          className="text-[clamp(2.5rem,5vw,5rem)] font-bold text-[#F8FAFC] mb-16 leading-tight"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          Built for founders who move fast
        </motion.h2>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 auto-rows-[140px]">

          {/* 1. Integration */}
          <motion.div
            className="md:col-span-2 md:row-span-2 bg-gradient-to-br from-[#00D4A4]/15 to-[#00D4A4]/5 border border-[#00D4A4]/10 rounded-xl p-8 flex flex-col hover:border-[#00D4A4]/30 transition-colors cursor-pointer overflow-hidden"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.02, backgroundColor: "rgba(212, 212, 216, 0.08)" }}
          />

          {/* 2. Context */}
          <motion.div
            className="md:col-span-2 bg-gradient-to-br from-[#00D4A4]/15 to-[#00D4A4]/5 border border-[#00D4A4]/10 rounded-xl p-8 flex flex-col hover:border-[#00D4A4]/30 transition-colors cursor-pointer overflow-hidden"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            whileHover={{ scale: 0.98 }}
          />

          {/* 3. Smart Routing */}
          <motion.div
            className="md:col-span-2 md:row-span-2 bg-gradient-to-br from-[#00D4A4]/10 to-[#00D4A4]/5 border border-[#00D4A4]/10 rounded-xl p-6 flex flex-col hover:border-[#00D4A4]/30 transition-colors cursor-pointer overflow-hidden"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.02, boxShadow: "0 25px 50px -12px rgba(212, 212, 216, 0.1)" }}
          />

          {/* 4. Chat */}
          <motion.div
            className="md:col-span-1 bg-gradient-to-br from-[#00D4A4]/15 to-[#00D4A4]/5 border border-[#00D4A4]/10 rounded-xl p-8 flex flex-col hover:border-[#00D4A4]/30 transition-colors cursor-pointer overflow-hidden"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 0.98 }}
          />

          {/* 5. Security & Focus */}
          <motion.div
            className="md:col-span-1 bg-gradient-to-br from-[#00D4A4]/15 to-[#00D4A4]/5 border border-[#00D4A4]/10 rounded-xl p-8 flex flex-col hover:border-[#00D4A4]/30 transition-colors cursor-pointer overflow-hidden"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 0.98 }}
          />

          {/* 6. Global CDN */}
          <motion.div
            className="md:col-span-2 bg-gradient-to-br from-[#00D4A4]/15 to-[#00D4A4]/5 border border-[#00D4A4]/10 rounded-xl p-8 flex flex-col hover:border-[#00D4A4]/30 transition-colors cursor-pointer overflow-hidden"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            whileHover={{ scale: 0.98 }}
          />

        </div>
      </div>
    </section>
  )
}

