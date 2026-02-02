"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  AlertCircle,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  FileText,
  Loader2,
  Plus,
  RefreshCw,
} from "lucide-react"

interface DraftRecord {
  id: string
  documentType: string
  title: string | null
  status: string
  recommenderId: string | null
  updatedAt: string
  recommender: { name: string } | null
}

interface Recommender {
  id: string
  name: string
  title: string | null
  status: string
}

const DOCUMENT_TYPES = [
  { type: "petition_letter", label: "Petition Letter" },
  { type: "personal_statement", label: "Personal Statement" },
  { type: "recommendation_letter", label: "Recommendation Letters" },
  { type: "cover_letter", label: "Cover Letter" },
  { type: "exhibit_list", label: "Exhibit List" },
  { type: "table_of_contents", label: "Table of Contents" },
  { type: "rfe_response", label: "RFE Response" },
] as const

const statusColors: Record<string, string> = {
  not_started: "bg-gray-100 text-gray-700",
  generating: "bg-blue-100 text-blue-700",
  draft: "bg-yellow-100 text-yellow-700",
  in_review: "bg-purple-100 text-purple-700",
  final: "bg-green-100 text-green-700",
}

const statusLabels: Record<string, string> = {
  not_started: "Not Started",
  generating: "Generating",
  draft: "Draft",
  in_review: "In Review",
  final: "Final",
}

// Recommender statuses that qualify for letter drafting
const CONFIRMED_STATUSES = ["confirmed", "letter_drafted", "letter_finalized"]

export default function DraftsIndexPage() {
  const params = useParams()
  const clientId = params.clientId as string

  const [drafts, setDrafts] = useState<DraftRecord[]>([])
  const [recommenders, setRecommenders] = useState<Recommender[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState<string | null>(null)
  const [recExpanded, setRecExpanded] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [draftsRes, recRes] = await Promise.all([
        fetch(`/api/cases/${clientId}/drafts`),
        fetch(`/api/cases/${clientId}/recommenders`),
      ])
      if (!draftsRes.ok) throw new Error("Failed to fetch drafts")
      setDrafts(await draftsRes.json())
      if (recRes.ok) setRecommenders(await recRes.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load")
    } finally {
      setLoading(false)
    }
  }, [clientId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const getDraftForType = (type: string, recommenderId?: string) =>
    drafts.find(
      (d) =>
        d.documentType === type &&
        (recommenderId ? d.recommenderId === recommenderId : !d.recommenderId)
    )

  const handleCreate = async (
    documentType: string,
    recommenderId?: string
  ) => {
    const key = recommenderId ? `${documentType}-${recommenderId}` : documentType
    setCreating(key)
    try {
      const res = await fetch(`/api/cases/${clientId}/drafts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentType,
          ...(recommenderId && { recommenderId }),
        }),
      })
      if (res.ok || res.status === 409) {
        await fetchData()
      }
    } finally {
      setCreating(null)
    }
  }

  const confirmedRecommenders = recommenders.filter((r) =>
    CONFIRMED_STATUSES.includes(r.status)
  )

  const startedCount = DOCUMENT_TYPES.filter(
    (dt) =>
      dt.type !== "recommendation_letter" &&
      getDraftForType(dt.type)?.status !== "not_started" &&
      getDraftForType(dt.type) !== undefined
  ).length
  const finalizedCount = DOCUMENT_TYPES.filter(
    (dt) =>
      dt.type !== "recommendation_letter" &&
      getDraftForType(dt.type)?.status === "final"
  ).length
  const recDraftCount = confirmedRecommenders.filter(
    (r) => getDraftForType("recommendation_letter", r.id) !== undefined
  ).length

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-center">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button variant="outline" size="sm" onClick={fetchData}>
          <RefreshCw className="mr-1 h-3 w-3" />
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/cases/${clientId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold">Case Drafts</h1>
          <p className="text-sm text-muted-foreground">
            {startedCount + recDraftCount} of {6 + confirmedRecommenders.length}{" "}
            started, {finalizedCount} finalized
          </p>
        </div>
      </div>

      {/* Document type cards grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {DOCUMENT_TYPES.filter((dt) => dt.type !== "recommendation_letter").map(
          (dt) => {
            const draft = getDraftForType(dt.type)
            return (
              <Card key={dt.type}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-sm font-medium">
                      {dt.label}
                    </CardTitle>
                    {draft && (
                      <Badge
                        variant="secondary"
                        className={statusColors[draft.status] || ""}
                      >
                        {statusLabels[draft.status] || draft.status}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {draft ? (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">
                        Updated{" "}
                        {new Date(draft.updatedAt).toLocaleDateString()}
                      </p>
                      <Button variant="outline" size="sm" asChild>
                        <Link
                          href={`/cases/${clientId}/drafts/${draft.id}`}
                        >
                          <FileText className="mr-1 h-3 w-3" />
                          {draft.status === "not_started" ? "Edit" : "View"}
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={creating === dt.type}
                      onClick={() => handleCreate(dt.type)}
                    >
                      {creating === dt.type ? (
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      ) : (
                        <Plus className="mr-1 h-3 w-3" />
                      )}
                      Create
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          }
        )}
      </div>

      {/* Recommendation letters section */}
      <div className="space-y-3">
        <button
          className="flex items-center gap-2 text-sm font-medium hover:text-foreground/80"
          onClick={() => setRecExpanded(!recExpanded)}
        >
          {recExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
          Recommendation Letters
          <Badge variant="secondary" className="ml-1">
            {confirmedRecommenders.length} recommender
            {confirmedRecommenders.length !== 1 ? "s" : ""}
          </Badge>
        </button>

        {recExpanded && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {confirmedRecommenders.length === 0 ? (
              <p className="col-span-full text-sm text-muted-foreground py-4">
                No confirmed recommenders yet. Confirm recommenders to create
                recommendation letter drafts.
              </p>
            ) : (
              confirmedRecommenders.map((rec) => {
                const draft = getDraftForType(
                  "recommendation_letter",
                  rec.id
                )
                const key = `recommendation_letter-${rec.id}`
                return (
                  <Card key={rec.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-sm font-medium">
                            {rec.name}
                          </CardTitle>
                          {rec.title && (
                            <p className="text-xs text-muted-foreground">
                              {rec.title}
                            </p>
                          )}
                        </div>
                        {draft && (
                          <Badge
                            variant="secondary"
                            className={statusColors[draft.status] || ""}
                          >
                            {statusLabels[draft.status] || draft.status}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {draft ? (
                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground">
                            Updated{" "}
                            {new Date(draft.updatedAt).toLocaleDateString()}
                          </p>
                          <Button variant="outline" size="sm" asChild>
                            <Link
                              href={`/cases/${clientId}/drafts/${draft.id}`}
                            >
                              <FileText className="mr-1 h-3 w-3" />
                              {draft.status === "not_started"
                                ? "Edit"
                                : "View"}
                            </Link>
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={creating === key}
                          onClick={() =>
                            handleCreate("recommendation_letter", rec.id)
                          }
                        >
                          {creating === key ? (
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                          ) : (
                            <Plus className="mr-1 h-3 w-3" />
                          )}
                          Create
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        )}
      </div>
    </div>
  )
}
