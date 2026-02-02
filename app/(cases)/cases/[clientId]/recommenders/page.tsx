"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { StatusPipeline } from "@/components/recommender/status-pipeline"
import { AISuggestionsPanel } from "@/components/recommender/ai-suggestions-panel"
import { RecommenderList, type Recommender } from "@/components/recommender/recommender-list"
import { RecommenderForm } from "@/components/recommender/recommender-form"
import { RecommenderDetail, type RecommenderAttachment } from "@/components/recommender/recommender-detail"
import { Loader2, Plus } from "lucide-react"
import { useRole } from "@/components/role-provider"

export default function RecommendersPage() {
  const params = useParams()
  const clientId = params.clientId as string
  const { role } = useRole()
  const isLawyer = role === "lawyer" || role === "admin"

  const [recommenders, setRecommenders] = useState<Recommender[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [formEdit, setFormEdit] = useState<Recommender | null>(null)
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailTarget, setDetailTarget] = useState<Recommender | null>(null)
  const [attachments, setAttachments] = useState<RecommenderAttachment[]>([])

  const fetchRecommenders = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/cases/${clientId}/recommenders`)
      if (res.ok) setRecommenders(await res.json())
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [clientId])

  useEffect(() => { fetchRecommenders() }, [fetchRecommenders])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSubmit = async (data: any) => {
    setFormSubmitting(true)
    try {
      const url = formEdit
        ? `/api/cases/${clientId}/recommenders/${formEdit.id}`
        : `/api/cases/${clientId}/recommenders`
      const method = formEdit ? "PATCH" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        setFormOpen(false)
        setFormEdit(null)
        fetchRecommenders()
      }
    } finally {
      setFormSubmitting(false)
    }
  }

  const handleDelete = async (rec: Recommender) => {
    if (!confirm(`Delete recommender ${rec.name}?`)) return
    await fetch(`/api/cases/${clientId}/recommenders/${rec.id}`, { method: "DELETE" })
    fetchRecommenders()
  }

  const handleStatusChange = async (id: string, status: string) => {
    await fetch(`/api/cases/${clientId}/recommenders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    fetchRecommenders()
  }

  const handleAccept = async (rec: Recommender) => {
    await fetch(`/api/cases/${clientId}/recommenders/${rec.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "identified" }),
    })
    fetchRecommenders()
  }

  const handleDismiss = async (recommenderId: string) => {
    await fetch(`/api/cases/${clientId}/recommenders/${recommenderId}`, { method: "DELETE" })
    fetchRecommenders()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Recommenders</h2>
        {isLawyer && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setFormEdit(null); setFormOpen(true) }}
          >
            <Plus className="mr-1 h-3 w-3" />
            Add Recommender
          </Button>
        )}
      </div>

      <StatusPipeline recommenders={recommenders} />

      {isLawyer && (
        <AISuggestionsPanel
          clientId={clientId}
          recommenders={recommenders}
          onAccept={handleAccept}
          onDismiss={handleDismiss}
        />
      )}

      {recommenders.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No recommenders yet.
        </p>
      ) : (
        <RecommenderList
          recommenders={recommenders}
          onEdit={(rec) => { setFormEdit(rec); setFormOpen(true) }}
          onDelete={handleDelete}
        />
      )}

      <RecommenderForm
        open={formOpen}
        onOpenChange={(open) => { setFormOpen(open); if (!open) setFormEdit(null) }}
        recommender={formEdit}
        onSubmit={handleSubmit}
        isSubmitting={formSubmitting}
      />

      <RecommenderDetail
        open={detailOpen}
        onOpenChange={setDetailOpen}
        recommender={detailTarget}
        clientId={clientId}
        attachments={attachments}
        onStatusChange={handleStatusChange}
        onAttachmentUploaded={fetchRecommenders}
        onAttachmentDeleted={() => fetchRecommenders()}
      />
    </div>
  )
}
