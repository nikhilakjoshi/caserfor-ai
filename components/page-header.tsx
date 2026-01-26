"use client"

import { useLayoutEffect, useRef } from "react"
import { createPortal } from "react-dom"

interface PageHeaderProps {
  title: string
}

export function PageHeader({ title }: PageHeaderProps) {
  const containerRef = useRef<HTMLElement | null>(null)

  // Use useLayoutEffect to avoid hydration mismatch - runs synchronously after DOM mutations
  useLayoutEffect(() => {
    containerRef.current = document.getElementById("page-header")
  }, [])

  // On first render before layout effect runs, container is null
  // After layout effect, we need a way to trigger re-render - use a trick with key or just render conditionally
  if (typeof window === "undefined") {
    return null
  }

  const container = document.getElementById("page-header")
  if (!container) {
    return null
  }

  return createPortal(
    <h1 className="text-lg font-semibold">{title}</h1>,
    container
  )
}
