import { Button } from "@/components/ui/button"
import { CookieButton } from "@/components/ui/cookie-button"

interface FooterProps {
  logo: React.ReactNode
  brandName: string
  socialLinks: Array<{
    icon: React.ReactNode
    href: string
    label: string
  }>
  mainLinks: Array<{
    href: string
    label: string
  }>
  legalLinks: Array<{
    href: string
    label: string
  }>
  copyright: {
    text: string
    license?: string
  }
  showCookieButton?: boolean
}

export function Footer({
  logo,
  brandName,
  socialLinks,
  mainLinks,
  legalLinks,
  copyright,
  showCookieButton = true,
}: FooterProps) {
  return (
    <footer className="pb-6 pt-16 lg:pb-8 lg:pt-24 bg-[var(--color-bg-base)]">
      <div className="px-4 lg:px-8">
        <div className="md:flex md:items-start md:justify-between">
          <div className="flex items-center gap-x-4 flex-wrap">
            <a
              href="/"
              className="flex items-center gap-x-2"
              aria-label={brandName}
            >
              {logo}
              <span className="font-bold text-xl text-[var(--color-text-primary)]">{brandName}</span>
            </a>
            <a href="https://smollaunch.com" target="_blank" rel="noopener">
              <img src="https://smollaunch.com/badges/featured.svg" alt="Flowtex — Featured on Smol Launch" loading="lazy" width="250" height="60" />
            </a>
          </div>
          <ul className="flex list-none mt-6 md:mt-0 space-x-3">
            {socialLinks.map((link, i) => (
              <li key={i}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-full text-[var(--color-accent)] hover:bg-[var(--color-bg-card)]"
                  asChild
                >
                  <a href={link.href} target="_blank" aria-label={link.label}>
                    {link.icon}
                  </a>
                </Button>
              </li>
            ))}
          </ul>
        </div>
        <div className="border-t border-[var(--color-border-default)] mt-6 pt-6 md:mt-4 md:pt-8 lg:grid lg:grid-cols-10">
          <div className="lg:mt-0 lg:col-[4/11]">
            <ul className="list-none flex flex-wrap -my-1 -mx-3 lg:justify-end">
              {mainLinks.map((link, i) => (
                <li key={i} className="my-1 mx-3 shrink-0">
                  <a
                    href={link.href}
                    className="text-sm text-[var(--color-text-muted)] underline-offset-4 hover:underline"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
              {legalLinks.map((link, i) => (
                <li key={i} className="my-1 mx-3 shrink-0">
                  <a
                    href={link.href}
                    className="text-sm text-[var(--color-text-muted)] underline-offset-4 hover:underline"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
              {showCookieButton && (
                <li className="my-1 mx-3 shrink-0">
                  <CookieButton />
                </li>
              )}
            </ul>
          </div>
          <div className="mt-6 text-sm leading-6 text-[var(--color-text-muted)] whitespace-nowrap lg:mt-0 lg:row-[1/3] lg:col-[1/4]">
            <div>{copyright.text}</div>
            {copyright.license && <div>{copyright.license}</div>}
          </div>
        </div>
      </div>
    </footer>
  )
}
