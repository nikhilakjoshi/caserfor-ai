"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GapAnalysisView } from "@/components/lawyer/gap-analysis-view"
import {
  AlertCircle,
  ArrowLeft,
  ExternalLink,
  Loader2,
  RefreshCw,
} from "lucide-react"
import Link from "next/link"

interface CaseDetail {
  id: string
  firstName: string | null
  lastName: string | null
  email: string | null
  fieldOfExpertise: string | null
  citizenship: string | null
  currentEmployer: string | null
  status: string
  vault: { id: string; name: string } | null
  eligibilityReport: {
    verdict: string
    summary: string
    criteria: unknown
  } | null
  criteriaResponded: string[]
  assignedTo: { lawyerId: string; lawyerName: string | null }[]
  createdAt: string
  updatedAt: string
}

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

const verdictColors: Record<string, string> = {
  strong: "bg-green-100 text-green-800",
  moderate: "bg-yellow-100 text-yellow-800",
  weak: "bg-orange-100 text-orange-800",
  insufficient: "bg-red-100 text-red-800",
}

const statusLabels: Record<string, string> = {
  submitted: "Submitted",
  under_review: "Under Review",
  reviewed: "Reviewed",
  paid: "Paid",
}

export default function CaseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const clientId = params.clientId as string

  const [caseData, setCaseData] = useState<CaseDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [gapData, setGapData] = useState<GapAnalysisData | null>(null)
  const [gapLoading, setGapLoading] = useState(false)
  const [gapError, setGapError] = useState<string | null>(null)
  const [gapRefreshing, setGapRefreshing] = useState(false)

  const fetchCase = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/lawyer/cases/${clientId}`)
      if (!res.ok) {
        if (res.status === 403) throw new Error("Not authorized to view this case")
        if (res.status === 404) throw new Error("Case not found")
        throw new Error("Failed to fetch case")
      }
      setCaseData(await res.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch case")
    } finally {
      setLoading(false)
    }
  }, [clientId])

  const fetchGapAnalysis = useCallback(async () => {
    setGapLoading(true)
    setGapError(null)
    try {
      const res = await fetch(`/api/lawyer/cases/${clientId}/gap-analysis`)
      if (res.status === 404) {
        setGapData(null)
        return
      }
      if (!res.ok) throw new Error("Failed to fetch gap analysis")
      setGapData(await res.json())
    } catch (err) {
      setGapError(err instanceof Error ? err.message : "Failed to fetch gap analysis")
    } finally {
      setGapLoading(false)
    }
  }, [clientId])

  useEffect(() => {
    fetchCase()
    fetchGapAnalysis()
  }, [fetchCase, fetchGapAnalysis])

  // Poll for gap analysis when refreshing
  useEffect(() => {
    if (!gapRefreshing) return
    const interval = setInterval(async () => {
      const res = await fetch(`/api/lawyer/cases/${clientId}/gap-analysis`)
      if (res.ok) {
        const data = await res.json()
        // Check if newer than what we have
        if (!gapData || data.createdAt !== gapData.createdAt) {
          setGapData(data)
          setGapRefreshing(false)
        }
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [gapRefreshing, clientId, gapData])

  const handleRefreshGap = async () => {
    setGapRefreshing(true)
    try {
      await fetch(`/api/lawyer/cases/${clientId}/gap-analysis/refresh`, {
        method: "POST",
      })
    } catch {
      setGapRefreshing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !caseData) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-center">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-sm text-muted-foreground">{error || "Case not found"}</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchCase}>
            <RefreshCw className="mr-1 h-3 w-3" />
            Retry
          </Button>
          <Button variant="outline" size="sm" onClick={() => router.push("/lawyer/dashboard")}>
            <ArrowLeft className="mr-1 h-3 w-3" />
            Back
          </Button>
        </div>
      </div>
    )
  }

  const name = [caseData.firstName, caseData.lastName].filter(Boolean).join(" ") || "Unnamed"

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/lawyer/dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold">{name}</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {caseData.fieldOfExpertise && <span>{caseData.fieldOfExpertise}</span>}
            {caseData.email && (
              <>
                <span>-</span>
                <span>{caseData.email}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {statusLabels[caseData.status] || caseData.status}
          </Badge>
          {caseData.eligibilityReport && (
            <Badge variant="outline" className={verdictColors[caseData.eligibilityReport.verdict] || ""}>
              {caseData.eligibilityReport.verdict}
            </Badge>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="gap-analysis">
        <TabsList>
          <TabsTrigger value="vault">Vault</TabsTrigger>
          <TabsTrigger value="gap-analysis">Gap Analysis</TabsTrigger>
          <TabsTrigger value="assistant">Assistant</TabsTrigger>
        </TabsList>

        {/* Vault tab */}
        <TabsContent value="vault" className="mt-4">
          {caseData.vault ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium">{caseData.vault.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    Client document vault
                  </p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/vault/${caseData.vault.id}`}>
                    <ExternalLink className="mr-1 h-3 w-3" />
                    Open Vault
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No vault associated with this case.
            </p>
          )}
        </TabsContent>

        {/* Gap analysis tab */}
        <TabsContent value="gap-analysis" className="mt-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Gap Analysis</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshGap}
                disabled={gapRefreshing}
              >
                <RefreshCw className={`mr-1 h-3 w-3 ${gapRefreshing ? "animate-spin" : ""}`} />
                {gapRefreshing ? "Analyzing..." : gapData ? "Re-analyze" : "Run Analysis"}
              </Button>
            </div>

            {gapRefreshing && !gapData && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center space-y-2">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto" />
                  <p className="text-sm text-muted-foreground">Running gap analysis...</p>
                </div>
              </div>
            )}

            {gapLoading && !gapRefreshing && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {gapError && !gapLoading && (
              <div className="flex flex-col items-center gap-3 py-12 text-center">
                <AlertCircle className="h-6 w-6 text-destructive" />
                <p className="text-sm text-muted-foreground">{gapError}</p>
                <Button variant="outline" size="sm" onClick={fetchGapAnalysis}>
                  Retry
                </Button>
              </div>
            )}

            {!gapLoading && !gapError && !gapData && !gapRefreshing && (
              <div className="py-12 text-center">
                <p className="text-sm text-muted-foreground mb-3">
                  No gap analysis has been run for this case yet.
                </p>
                <Button variant="outline" size="sm" onClick={handleRefreshGap}>
                  Run Analysis
                </Button>
              </div>
            )}

            {gapData && <GapAnalysisView data={gapData} />}
          </div>
        </TabsContent>

        {/* Assistant tab */}
        <TabsContent value="assistant" className="mt-4">
          {caseData.vault ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Open the AI assistant scoped to this client&apos;s vault to ask questions about their case.
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/assistant?vault=${caseData.vault.id}&vaultName=${encodeURIComponent(caseData.vault.name)}`}>
                  <ExternalLink className="mr-1 h-3 w-3" />
                  Open Assistant
                </Link>
              </Button>
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No vault associated with this case. Cannot use assistant without documents.
            </p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
