'use client'

import posthog from 'posthog-js'
import { PostHogProvider as PHProvider, usePostHog } from 'posthog-js/react'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useRef, Suspense } from 'react'
import { supabase } from '@/lib/supabase'

const CONSENT_KEY = 'cookie_consent_given'
const PREFS_KEY = 'cookie_preferences'
const ANALYTICS_INDEX = 1

function hasAnalyticsConsent() {
  try {
    const consentGiven = localStorage.getItem(CONSENT_KEY) === 'true'
    if (!consentGiven) return false
    const prefs = JSON.parse(localStorage.getItem(PREFS_KEY) || '[]')
    // If there's no cookie banner wired up at all, default to allowing analytics.
    return Array.isArray(prefs) && prefs.length > ANALYTICS_INDEX ? !!prefs[ANALYTICS_INDEX] : true
  } catch {
    return true
  }
}

function appPageFromPathname(pathname: string): string | null {
  if (!pathname.startsWith('/app')) return null
  const segment = pathname.split('/')[2] || 'dashboard'
  const known = ['dashboard', 'inbox', 'kanban', 'clients', 'settings', 'integrations']
  return known.includes(segment) ? segment : segment || 'dashboard'
}

function PostHogPageView() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const posthogClient = usePostHog()

  useEffect(() => {
    if (!pathname || !posthogClient) return

    let url = window.origin + pathname
    const search = searchParams.toString()
    if (search) url += `?${search}`
    posthogClient.capture('$pageview', { '$current_url': url })

    const appPage = appPageFromPathname(pathname)
    if (appPage) {
      posthogClient.capture('page_viewed_app', { page: appPage })
    } else {
      posthogClient.capture('page_viewed', { path: pathname })
    }
  }, [pathname, searchParams, posthogClient])

  return null
}

function PostHogIdentifier() {
  const identifiedUserId = useRef<string | null>(null)

  useEffect(() => {
    const identify = async (userId: string, email?: string | null) => {
      if (identifiedUserId.current === userId) return
      identifiedUserId.current = userId

      const { data: profile } = await supabase
        .from('profiles')
        .select('business_name, subscription_status')
        .eq('id', userId)
        .single()

      posthog.identify(userId, {
        email: email ?? undefined,
        business_name: profile?.business_name ?? undefined,
        plan: profile?.subscription_status ?? undefined,
      })
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) identify(session.user.id, session.user.email)
    })

    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        identify(session.user.id, session.user.email)
      } else if (event === 'SIGNED_OUT') {
        identifiedUserId.current = null
        posthog.reset()
      }
    })

    return () => subscription.subscription.unsubscribe()
  }, [])

  return null
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const init = () => {
      if (posthog.__loaded) return
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
        ui_host: 'https://eu.posthog.com',
        capture_pageview: false,
        capture_pageleave: true,
      })
    }

    // No cookie banner present on a given page (e.g. it hasn't mounted yet) shouldn't
    // block analytics forever, but if consent was explicitly declined we must respect it.
    if (hasAnalyticsConsent()) init()

    const onConsentUpdated = () => {
      if (hasAnalyticsConsent()) init()
    }
    window.addEventListener('cookie-consent-updated', onConsentUpdated)
    return () => window.removeEventListener('cookie-consent-updated', onConsentUpdated)
  }, [])

  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      <PostHogIdentifier />
      {children}
    </PHProvider>
  )
}
