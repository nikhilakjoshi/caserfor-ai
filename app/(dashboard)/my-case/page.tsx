"use client"

import { useCallback, useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Plus, UserPlus } from "lucide-react"
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

  useEffect(() => {
    if (myCase) fetchRecommenders()
  }, [myCase, fetchRecommenders])

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
