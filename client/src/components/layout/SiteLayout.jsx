import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router'
import SiteHeader from './SiteHeader.jsx'
import SiteFooter from './SiteFooter.jsx'
import ContactShortcuts from './ContactShortcuts.jsx'

export default function SiteLayout() {
  const { pathname, hash } = useLocation()

  // Start each new page at the top, or at the #section the link points to once it has rendered
  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0)
      return undefined
    }
    const t = setTimeout(() => {
      try {
        document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView({ behavior: 'smooth' })
      } catch {
        // malformed hash: stay where we are
      }
    }, 150)
    return () => clearTimeout(t)
  }, [pathname, hash])

  return (
    <div className="flex min-h-svh flex-col">
      <a href="#main" className="sr-only z-50 rounded-full bg-white px-4 py-2 font-bold text-midnight focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
        Skip to content
      </a>
      <SiteHeader />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <SiteFooter />
      <ContactShortcuts />
    </div>
  )
}
