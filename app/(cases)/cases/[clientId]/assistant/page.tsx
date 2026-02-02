"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ExternalLink, Loader2 } from "lucide-react"

export default function AssistantPage() {
  const params = useParams()
  const clientId = params.clientId as string

  const [vault, setVault] = useState<{ id: string; name: string } | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchVault = useCallback(async () => {
    try {
      const res = await fetch(`/api/cases/${clientId}`)
      if (!res.ok) return
      const data = await res.json()
      setVault(data.vault ?? null)
    } finally {
      setLoading(false)
    }
  }, [clientId])

  useEffect(() => { fetchVault() }, [fetchVault])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!vault) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No vault associated with this case. Cannot use assistant without documents.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">AI Assistant</h2>
      <p className="text-sm text-muted-foreground">
        Open the AI assistant scoped to this client&apos;s vault to ask questions about their case.
      </p>
      <Button variant="outline" size="sm" asChild>
        <Link href={`/assistant?vault=${vault.id}&vaultName=${encodeURIComponent(vault.name)}&autoSelectAll=1`}>
          <ExternalLink className="mr-1 h-3 w-3" />
          Open Assistant
        </Link>
      </Button>
    </div>
  )
}
