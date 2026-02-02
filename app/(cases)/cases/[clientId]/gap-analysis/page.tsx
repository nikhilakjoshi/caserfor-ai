"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { GapAnalysisView } from "@/components/lawyer/gap-analysis-view"
import { AlertCircle, Loader2, RefreshCw } from "lucide-react"

interface GapAnalysisData {
  id: string
  overallStrength: string
  summary: string
  criteria: Array<{
    slug: string
    label: string
    strength: number
    existingEvidence: string[]
    gaps: string[]
    recommendations: string[]
  }>
  priorityActions: string[]
  createdAt: string
}

export default function GapAnalysisPage() {
  const params = useParams()
  const clientId = params.clientId as string

  const [data, setData] = useState<GapAnalysisData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [hasVault, setHasVault] = useState<boolean | null>(null)

  const fetchGap = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Check if client has a vault
      const caseRes = await fetch(`/api/cases/${clientId}`)
      if (caseRes.ok) {
        const caseData = await caseRes.json()
        setHasVault(!!caseData.vault)
        if (!caseData.vault) { setLoading(false); return }
      }

      const res = await fetch(`/api/lawyer/cases/${clientId}/gap-analysis`)
      if (res.status === 404) { setData(null); return }
      if (!res.ok) throw new Error("Failed to fetch gap analysis")
      setData(await res.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch")
    } finally {
      setLoading(false)
    }
  }, [clientId])

  useEffect(() => { fetchGap() }, [fetchGap])

  // Poll when refreshing
  useEffect(() => {
    if (!refreshing) return
    const interval = setInterval(async () => {
      const res = await fetch(`/api/lawyer/cases/${clientId}/gap-analysis`)
      if (res.ok) {
        const newData = await res.json()
        if (!data || newData.createdAt !== data.createdAt) {
          setData(newData)
          setRefreshing(false)
        }
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [refreshing, clientId, data])

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await fetch(`/api/lawyer/cases/${clientId}/gap-analysis/refresh`, { method: "POST" })
    } catch {
      setRefreshing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (hasVault === false) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-muted-foreground">
          No vault associated with this case. Gap analysis requires documents to analyze.
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <AlertCircle className="h-6 w-6 text-destructive" />
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button variant="outline" size="sm" onClick={fetchGap}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Gap Analysis</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={`mr-1 h-3 w-3 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Analyzing..." : data ? "Re-analyze" : "Run Analysis"}
        </Button>
      </div>

      {refreshing && !data && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-2">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">Running gap analysis...</p>
          </div>
        </div>
      )}

      {!data && !refreshing && (
        <div className="py-12 text-center">
          <p className="text-sm text-muted-foreground mb-3">
            No gap analysis has been run for this case yet.
          </p>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            Run Analysis
          </Button>
        </div>
      )}

      {data && <GapAnalysisView data={data} />}
    </div>
  )
}
