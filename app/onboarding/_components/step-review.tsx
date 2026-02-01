"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Send, Pencil } from "lucide-react"
import type { ClientData } from "@/app/onboarding/_lib/use-onboarding"

interface Props {
  data: ClientData
  clientId: string
  onFlush: () => Promise<void>
  onSave: (fields: Record<string, unknown>) => Promise<void>
}

export function StepReview({ data, clientId, onFlush, onSave }: Props) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // If already submitted, redirect to evaluation page
  if (data.status !== "draft") {
    router.push(`/evaluation/${clientId}`)
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Redirecting to evaluation...</p>
      </div>
    )
  }

  async function handleSubmit() {
    setSubmitting(true)
    setError(null)
    try {
      await onFlush()
      await onSave({ currentStep: 10 })
      const res = await fetch(`/api/onboarding/${clientId}/submit`, {
        method: "POST",
      })
      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error || "Submission failed")
      }
      router.push(`/evaluation/${clientId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed")
    } finally {
      setSubmitting(false)
    }
  }

  function editLink(step: number) {
    return (
      <button
        onClick={() => router.push(`/onboarding/steps/${step}`)}
        className="text-xs text-primary hover:underline flex items-center gap-1"
      >
        <Pencil className="h-3 w-3" /> Edit
      </button>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Review & Submit</h2>
        <p className="text-sm text-muted-foreground">
          Review the information below and submit for eligibility evaluation
        </p>
      </div>

      <div className="space-y-4">
        <SummarySection title="Basic Info" editAction={editLink(2)}>
          <SummaryRow label="Name" value={[data.firstName, data.lastName].filter(Boolean).join(" ")} />
          <SummaryRow label="Email" value={data.email} />
          <SummaryRow label="Phone" value={data.phone} />
          <SummaryRow label="Consent" value={data.consentToProcess ? "Yes" : "No"} />
        </SummarySection>

        <SummarySection title="Background" editAction={editLink(4)}>
          <SummaryRow label="Citizenship" value={data.citizenship} />
          <SummaryRow label="Field" value={data.fieldOfExpertise} />
          <SummaryRow label="Employer" value={data.currentEmployer} />
          <SummaryRow label="DOB" value={data.dateOfBirth} />
          {(data.education as { institution: string; degree: string; year: string }[])?.length > 0 && (
            <SummaryRow
              label="Education"
              value={(data.education as { institution: string; degree: string; year: string }[])
                .map((e) => `${e.degree} - ${e.institution} (${e.year})`)
                .join("; ")}
            />
          )}
        </SummarySection>

        <SummarySection title="Achievement" editAction={editLink(6)}>
          <SummaryRow
            label="Major"
            value={data.hasMajorAchievement ? "Yes" : "No"}
          />
          {data.majorAchievementDetails && (
            <SummaryRow label="Details" value={data.majorAchievementDetails} />
          )}
        </SummarySection>

        <SummarySection title="Immigration" editAction={editLink(7)}>
          <SummaryRow label="Current Status" value={data.currentImmigrationStatus} />
          <SummaryRow label="Desired" value={data.desiredStatus} />
          <SummaryRow label="Intent Type" value={data.usIntentType} />
          <SummaryRow label="Intent Details" value={data.usIntentDetails} />
          {data.previousApplications && (
            <SummaryRow label="Prior Apps" value={data.previousApplications} />
          )}
        </SummarySection>

        <SummarySection title="Circumstances" editAction={editLink(8)}>
          <SummaryRow label="Urgency" value={data.urgency} />
          <SummaryRow label="Timeline" value={data.idealTimeline} />
          <SummaryRow label="Reason" value={data.urgencyReason} />
          {data.specialCircumstances && (
            <SummaryRow label="Special" value={data.specialCircumstances} />
          )}
        </SummarySection>

        <SummarySection title="Preferences" editAction={editLink(9)}>
          <SummaryRow label="Comms" value={data.communicationPreference} />
          <SummaryRow label="Timezone" value={data.timezone} />
          {(data.altCategories as string[])?.length > 0 && (
            <div className="flex gap-1 items-center">
              <span className="text-xs text-muted-foreground w-28 shrink-0">Alt Categories</span>
              <div className="flex gap-1">
                {(data.altCategories as string[]).map((c) => (
                  <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>
                ))}
              </div>
            </div>
          )}
        </SummarySection>
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 p-3 rounded">{error}</p>
      )}

      <div className="flex justify-center pt-4">
        <Button onClick={handleSubmit} disabled={submitting} size="lg">
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Send className="h-4 w-4 mr-2" />
          )}
          Submit for Evaluation
        </Button>
      </div>
    </div>
  )
}

function SummarySection({ title, editAction, children }: { title: string; editAction?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-gray-50 rounded p-4 space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">{title}</h3>
        {editAction}
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="flex text-sm">
      <span className="text-muted-foreground w-28 shrink-0">{label}</span>
      <span className="break-words">{value}</span>
    </div>
  )
}
