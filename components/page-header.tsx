"use client"

import { useSyncExternalStore } from "react"
import { createPortal } from "react-dom"

interface PageHeaderProps {
  title: string
}

function getContainer() {
  if (typeof document === "undefined") return null
  return document.getElementById("page-header")
}

function subscribe(callback: () => void) {
  // Portal target is static, only need initial render
  callback()
  return () => {}
}

export function PageHeader({ title }: PageHeaderProps) {
  const container = useSyncExternalStore(subscribe, getContainer, () => null)

  if (!container) {
    return null
  }

  return createPortal(
    <h1 className="text-lg font-semibold">{title}</h1>,
    container
  )
}
