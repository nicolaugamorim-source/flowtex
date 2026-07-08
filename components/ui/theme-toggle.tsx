'use client'
import { useTheme } from 'next-themes'
import { Sun, Moon } from 'lucide-react'
import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const { setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [isDark, setIsDark] = useState(true)

  useEffect(() => {
    setMounted(true)
    const current = document.documentElement.getAttribute('data-theme') ?? 'dark'
    setIsDark(current === 'dark')
  }, [])

  if (!mounted) return null

  const handleThemeChange = async () => {
    const newTheme = isDark ? 'light' : 'dark'

    // Update DOM attribute and localStorage
    document.documentElement.setAttribute('data-theme', newTheme)
    localStorage.setItem('flowtex-theme', newTheme)

    // Keep next-themes in sync
    setTheme(newTheme)

    setIsDark(!isDark)

    // Save preference to Supabase
    try {
      await fetch('/api/user/theme', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: newTheme }),
      })
    } catch (error) {
      console.error('Failed to save theme preference:', error)
    }
  }

  return (
    <button
      onClick={handleThemeChange}
      className="relative flex items-center w-12 h-6 rounded-full transition-colors duration-200"
      style={{
        backgroundColor: isDark ? 'var(--color-accent)' : 'var(--color-border-default)'
      }}
    >
      <span
        className="absolute flex items-center justify-center w-5 h-5 rounded-full bg-white shadow transition-transform duration-200"
        style={{ transform: isDark ? 'translateX(26px)' : 'translateX(2px)' }}
      >
        {isDark
          ? <Moon size={10} color="var(--color-text-primary)" />
          : <Sun size={10} color="var(--color-warning)" />
        }
      </span>
    </button>
  )
}
