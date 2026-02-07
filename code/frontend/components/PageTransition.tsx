'use client'

import { useEffect, useState } from 'react'

interface PageTransitionProps {
  children: React.ReactNode
}

/**
 * Fade-in wrapper for page content.
 * Adds a quick slide-up + fade animation on mount.
 */
export function PageTransition({ children }: PageTransitionProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Small delay to ensure the DOM is ready
    requestAnimationFrame(() => setMounted(true))
  }, [])

  return (
    <div
      className={`transition-all duration-300 ease-out ${
        mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      }`}
    >
      {children}
    </div>
  )
}
