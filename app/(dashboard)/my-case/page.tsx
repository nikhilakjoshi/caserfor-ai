"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Plus, UserPlus, FileText, Eye, Pencil } from "lucide-react"
import { RecommenderList, type Recommender } from "@/components/recommender/recommender-list"
import { RecommenderForm } from "@/components/recommender/recommender-form"

interface MyCase {
  id: string
  firstName: string | null
  lastName: string | null
  email: string | null
  fieldOfExpertise: string | null
  status: string
}

interface DraftRecord {
  id: string
  documentType: string
  title: string | null
  status: string
  recommenderId: string | null
  updatedAt: string
  recommender: { name: string } | null
}

const docTypeLabels: Record<string, string> = {
  petition_letter: "Petition Letter",
  personal_statement: "Personal Statement",
  recommendation_letter: "Recommendation Letter",
  cover_letter: "Cover Letter",
  exhibit_list: "Exhibit List",
  table_of_contents: "Table of Contents",
  rfe_response: "RFE Response",
}

const statusColors: Record<string, string> = {
  not_started: "bg-gray-100 text-gray-700",
  generating: "bg-blue-100 text-blue-700",
  draft: "bg-yellow-100 text-yellow-700",
  in_review: "bg-purple-100 text-purple-700",
  final: "bg-green-100 text-green-700",
}

const draftStatusLabels: Record<string, string> = {
  not_started: "Not Started",
  generating: "Generating",
  draft: "Draft",
  in_review: "In Review",
  final: "Final",
}

const statusLabels: Record<string, string> = {
  submitted: "Submitted",
  under_review: "Under Review",
  reviewed: "Reviewed",
  paid: "Paid",
}

export default function MyCasePage() {
  const [myCase, setMyCase] = useState<MyCase | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [recommenders, setRecommenders] = useState<Recommender[]>([])
  const [recLoading, setRecLoading] = useState(false)
  const [recFormOpen, setRecFormOpen] = useState(false)
  const [recFormEdit, setRecFormEdit] = useState<Recommender | null>(null)
  const [recFormSubmitting, setRecFormSubmitting] = useState(false)

  const [drafts, setDrafts] = useState<DraftRecord[]>([])
  const [draftsLoading, setDraftsLoading] = useState(false)

  const fetchCase = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/my-case")
      if (res.status === 404) {
        setError("No case found. Complete your intake to see your case here.")
        return
      }
      if (!res.ok) throw new Error("Failed to load case")
      setMyCase(await res.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load case")
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchRecommenders = useCallback(async () => {
    if (!myCase) return
    setRecLoading(true)
    try {
      const res = await fetch(`/api/cases/${myCase.id}/recommenders`)
      if (res.ok) setRecommenders(await res.json())
    } catch {
      // silent
    } finally {
      setRecLoading(false)
    }
  }, [myCase])

  useEffect(() => {
    fetchCase()
  }, [fetchCase])

  const fetchDrafts = useCallback(async () => {
    if (!myCase) return
    setDraftsLoading(true)
    try {
      const res = await fetch(`/api/cases/${myCase.id}/drafts`)
      if (res.ok) setDrafts(await res.json())
    } catch {
      // silent
    } finally {
      setDraftsLoading(false)
    }
  }, [myCase])

  useEffect(() => {
    if (myCase) {
      fetchRecommenders()
      fetchDrafts()
    }
  }, [myCase, fetchRecommenders, fetchDrafts])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleRecSubmit = async (data: any) => {
    if (!myCase) return
    setRecFormSubmitting(true)
    try {
      const url = recFormEdit
        ? `/api/cases/${myCase.id}/recommenders/${recFormEdit.id}`
        : `/api/cases/${myCase.id}/recommenders`
      const method = recFormEdit ? "PATCH" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        setRecFormOpen(false)
        setRecFormEdit(null)
        fetchRecommenders()
      }
    } finally {
      setRecFormSubmitting(false)
    }
  }

  const handleRecDelete = async (rec: Recommender) => {
    if (!myCase) return
    if (!confirm(`Delete recommender ${rec.name}?`)) return
    await fetch(`/api/cases/${myCase.id}/recommenders/${rec.id}`, {
      method: "DELETE",
    })
    fetchRecommenders()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !myCase) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-2 text-muted-foreground">
        <p>{error || "No case found."}</p>
      </div>
    )
  }

  const name = [myCase.firstName, myCase.lastName].filter(Boolean).join(" ") || "My Case"

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Case header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{name}</h1>
          {myCase.fieldOfExpertise && (
            <p className="text-sm text-muted-foreground">{myCase.fieldOfExpertise}</p>
          )}
        </div>
        <Badge variant="outline">
          {statusLabels[myCase.status] || myCase.status}
        </Badge>
      </div>

      {/* Recommenders section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Recommenders
          </CardTitle>
          <Button
            size="sm"
            onClick={() => {
              setRecFormEdit(null)
              setRecFormOpen(true)
            }}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </CardHeader>
        <CardContent>
          {recLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <RecommenderList
              recommenders={recommenders}
              onEdit={(rec) => {
                setRecFormEdit(rec)
                setRecFormOpen(true)
              }}
              onDelete={handleRecDelete}
            />
          )}
          <p className="text-xs text-muted-foreground mt-4">
            Add people who can write recommendation letters for your case.
            Your lawyer will manage the letter drafting process.
          </p>
        </CardContent>
      </Card>

      {/* Drafts section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Drafts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {draftsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : drafts.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              No drafts yet. Your lawyer will create drafts for your case.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {drafts.map((draft) => {
                const isPersonalStatement = draft.documentType === "personal_statement"
                const label = docTypeLabels[draft.documentType] || draft.documentType
                const displayTitle = draft.documentType === "recommendation_letter" && draft.recommender
                  ? `${label} - ${draft.recommender.name}`
                  : draft.title || label
                return (
                  <div
                    key={draft.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{displayTitle}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[draft.status] || "bg-gray-100 text-gray-700"}`}>
                          {draftStatusLabels[draft.status] || draft.status}
                        </span>
                      </div>
                    </div>
                    {isPersonalStatement ? (
                      <Link href={`/cases/${myCase.id}/drafts/${draft.id}`}>
                        <Button size="sm" variant="outline">
                          <Pencil className="h-3.5 w-3.5 mr-1" />
                          Edit
                        </Button>
                      </Link>
                    ) : (
                      <Link href={`/cases/${myCase.id}/drafts/${draft.id}`}>
                        <Button size="sm" variant="ghost">
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          View
                        </Button>
                      </Link>
                    )}
                  </div>
                )
              })}
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-4">
            You can edit your Personal Statement. Other drafts are view-only.
          </p>
        </CardContent>
      </Card>

      <RecommenderForm
        open={recFormOpen}
        onOpenChange={setRecFormOpen}
        recommender={recFormEdit}
        onSubmit={handleRecSubmit}
        isSubmitting={recFormSubmitting}
      />
    </div>
  )
}
