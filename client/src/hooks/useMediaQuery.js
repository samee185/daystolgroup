import { useSyncExternalStore } from 'react'

/** true while the media query matches, e.g. useMediaQuery('(min-width: 768px)'). */
export function useMediaQuery(query) {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query)
      mql.addEventListener('change', onChange)
      return () => mql.removeEventListener('change', onChange)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}

export const useIsDesktop = () => useMediaQuery('(min-width: 768px)')
export const useFinePointer = () => useMediaQuery('(hover: hover) and (pointer: fine)')
export const usePrefersReducedMotion = () => useMediaQuery('(prefers-reduced-motion: reduce)')
