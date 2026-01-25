"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"

interface PageHeaderProps {
  title: string
}

export function PageHeader({ title }: PageHeaderProps) {
  const [container, setContainer] = useState<HTMLElement | null>(null)

  useEffect(() => {
    setContainer(document.getElementById("page-header"))
  }, [])

  if (!container) {
    return null
  }

  return createPortal(
    <h1 className="text-lg font-semibold">{title}</h1>,
    container
  )
}
