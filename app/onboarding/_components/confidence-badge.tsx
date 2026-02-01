"use client"

import { cn } from "@/lib/utils"

interface Props {
  confidence: number
  className?: string
}

export function ConfidenceBadge({ confidence, className }: Props) {
  if (confidence === 0) return null

  const label =
    confidence >= 0.8 ? "High" : confidence >= 0.5 ? "Medium" : "Low"
  const color =
    confidence >= 0.8
      ? "bg-green-100 text-green-700"
      : confidence >= 0.5
        ? "bg-yellow-100 text-yellow-700"
        : "bg-red-100 text-red-700"

  return (
    <span
      className={cn(
        "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium",
        color,
        className
      )}
    >
      {label} confidence
    </span>
  )
}
