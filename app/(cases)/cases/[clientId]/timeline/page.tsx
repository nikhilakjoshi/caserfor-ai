"use client"

import { Clock } from "lucide-react"

export default function TimelinePage() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <Clock className="h-10 w-10 text-muted-foreground mb-4" />
      <h2 className="text-lg font-semibold mb-2">Timeline</h2>
      <p className="text-sm text-muted-foreground">
        Case timeline is coming soon.
      </p>
    </div>
  )
}
