"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function OnboardingPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadDraft() {
      try {
        const res = await fetch("/api/onboarding/draft")
        if (!res.ok) throw new Error("Failed to load draft")
        const data = await res.json()
        router.replace(`/onboarding/steps/${data.currentStep || 1}`)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load")
      }
    }
    loadDraft()
  }, [router])

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-sm text-red-500">{error}</p>
        <button
          className="text-sm underline"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  )
}
