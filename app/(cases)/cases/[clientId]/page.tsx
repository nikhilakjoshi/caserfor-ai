"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Loader2 } from "lucide-react"

interface CaseOverview {
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
  } | null
  criteriaResponded: string[]
  assignedTo: { lawyerId: string; lawyerName: string | null }[]
  createdAt: string
  updatedAt: string
}

const statusLabels: Record<string, string> = {
  submitted: "Submitted",
  under_review: "Under Review",
  reviewed: "Reviewed",
  paid: "Paid",
}

const verdictColors: Record<string, string> = {
  strong: "bg-green-100 text-green-800",
  moderate: "bg-yellow-100 text-yellow-800",
  weak: "bg-orange-100 text-orange-800",
  insufficient: "bg-red-100 text-red-800",
}

export default function CaseOverviewPage() {
  const params = useParams()
  const clientId = params.clientId as string

  const [data, setData] = useState<CaseOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCase = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/cases/${clientId}`)
      if (!res.ok) {
        if (res.status === 403) throw new Error("Not authorized")
        if (res.status === 404) throw new Error("Case not found")
        throw new Error("Failed to fetch case")
      }
      setData(await res.json())
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }, [clientId])

  useEffect(() => {
    fetchCase()
  }, [fetchCase])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-destructive">
        <AlertCircle className="h-5 w-5" />
        <span>{error ?? "Case not found"}</span>
      </div>
    )
  }

  const fullName = [data.firstName, data.lastName].filter(Boolean).join(" ") || "Unnamed"

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">{fullName}</h1>
          <Badge variant="outline">
            {statusLabels[data.status] ?? data.status}
          </Badge>
          {data.eligibilityReport?.verdict && (
            <Badge className={verdictColors[data.eligibilityReport.verdict] ?? ""}>
              {data.eligibilityReport.verdict}
            </Badge>
          )}
        </div>
        {data.fieldOfExpertise && (
          <p className="text-sm text-muted-foreground">{data.fieldOfExpertise}</p>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Email</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{data.email ?? "N/A"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Citizenship</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{data.citizenship ?? "N/A"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Employer</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{data.currentEmployer ?? "N/A"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Criteria Responded</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{data.criteriaResponded.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Vault</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{data.vault?.name ?? "No vault"}</p>
          </CardContent>
        </Card>

        {data.assignedTo.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Assigned Lawyers</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                {data.assignedTo.map((a) => a.lawyerName ?? "Unknown").join(", ")}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Eligibility summary */}
      {data.eligibilityReport?.summary && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Eligibility Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {data.eligibilityReport.summary}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
