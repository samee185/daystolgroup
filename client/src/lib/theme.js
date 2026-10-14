import { useCallback, useSyncExternalStore } from 'react'

/**
 * Light and dark mode. The current theme lives on <html data-theme="…"> (set before paint by
 * public/theme-init.js), so CSS variables switch instantly and React only reads it.
 */

const KEY = 'daystol-theme'
const listeners = new Set()

const current = () => (document.documentElement.dataset.theme === 'light' ? 'light' : 'dark')

function apply(theme) {
  document.documentElement.dataset.theme = theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'light' ? '#F5F7FC' : '#0D1330')
  listeners.forEach((l) => l())
}

function hasSavedChoice() {
  try {
    return Boolean(localStorage.getItem(KEY))
  } catch {
    return false
  }
}

// Follow the device setting until the visitor picks a theme themselves
if (typeof window !== 'undefined' && window.matchMedia) {
  window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
    if (!hasSavedChoice()) apply(e.matches ? 'light' : 'dark')
  })
}

export function useTheme() {
  const theme = useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    current,
    () => 'dark',
  )

  const toggle = useCallback(() => {
    const next = current() === 'dark' ? 'light' : 'dark'
    try {
      localStorage.setItem(KEY, next)
    } catch {
      // private browsing: the switch still works until the tab closes
    }
    apply(next)
  }, [])

  return { theme, isDark: theme === 'dark', toggle }
}
