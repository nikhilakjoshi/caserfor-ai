"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ClientVaultDocuments } from "@/components/lawyer/client-vault-documents"
import { ExternalLink, Loader2 } from "lucide-react"

export default function VaultPage() {
  const params = useParams()
  const clientId = params.clientId as string

  const [vaultId, setVaultId] = useState<string | null>(null)
  const [vaultName, setVaultName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchVault = useCallback(async () => {
    try {
      const res = await fetch(`/api/cases/${clientId}`)
      if (!res.ok) return
      const data = await res.json()
      setVaultId(data.vault?.id ?? null)
      setVaultName(data.vault?.name ?? null)
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

  if (!vaultId) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No vault associated with this case.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Documents</h2>
          {vaultName && (
            <p className="text-xs text-muted-foreground">{vaultName}</p>
          )}
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/vault/${vaultId}`}>
            <ExternalLink className="mr-1 h-3 w-3" />
            Full Vault View
          </Link>
        </Button>
      </div>
      <ClientVaultDocuments vaultId={vaultId} readOnly />
    </div>
  )
}
