"use client"

import { useState, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Send } from "lucide-react"
import type { ClientData } from "@/app/onboarding/_lib/use-onboarding"
import { ReviewSummary } from "./review-summary"

interface EligibilityReport {
  verdict: string
  summary: string
  criteria: Record<string, { score: number; analysis: string; evidence: string[] }>
}

interface Props {
  data: ClientData
  clientId: string
  onFlush: () => Promise<void>
  onSave: (fields: Record<string, unknown>) => Promise<void>
}

export function StepReview({ data, clientId, onFlush, onSave }: Props) {
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(data.status !== "draft")
  const [report, setReport] = useState<EligibilityReport | null>(null)
  const [polling, setPolling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pollReport = useCallback(async () => {
    try {
      const res = await fetch(`/api/onboarding/${clientId}/report`)
      if (!res.ok) return
      const body = await res.json()
      if (body.report) {
        setReport(body.report)
        setPolling(false)
      } else if (body.status === "reviewed") {
        setReport(body.report)
        setPolling(false)
      }
    } catch {
      // Keep polling
    }
  }, [clientId])

  useEffect(() => {
    if (!polling) return
    const interval = setInterval(pollReport, 4000)
    pollReport() // immediate first check
    return () => clearInterval(interval)
  }, [polling, pollReport])

  // Check for existing report on mount if already submitted
  useEffect(() => {
    if (submitted && !report) {
      setPolling(true)
    }
  }, [submitted, report])

  async function handleSubmit() {
    setSubmitting(true)
    setError(null)
    try {
      await onFlush()
      await onSave({ currentStep: 6 })
      const res = await fetch(`/api/onboarding/${clientId}/submit`, {
        method: "POST",
      })
      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error || "Submission failed")
      }
      setSubmitted(true)
      setPolling(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed")
    } finally {
      setSubmitting(false)
    }
  }

  if (report) {
    return <ReviewSummary report={report} />
  }

  if (submitted && polling) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Evaluating eligibility...</p>
        <p className="text-xs text-muted-foreground">This may take a few moments</p>
      </div>
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

      {/* Summary sections */}
      <div className="space-y-4">
        <SummarySection title="Personal">
          <SummaryRow label="Name" value={[data.firstName, data.lastName].filter(Boolean).join(" ")} />
          <SummaryRow label="Email" value={data.email} />
          <SummaryRow label="Field" value={data.fieldOfExpertise} />
          <SummaryRow label="Citizenship" value={data.citizenship} />
          <SummaryRow label="Employer" value={data.currentEmployer} />
        </SummarySection>

        <SummarySection title="Achievement">
          <SummaryRow
            label="Major Achievement"
            value={data.hasMajorAchievement ? "Yes" : "No"}
          />
          {data.majorAchievementDetails && (
            <SummaryRow label="Details" value={data.majorAchievementDetails} />
          )}
        </SummarySection>

        <SummarySection title="Impact & Standing">
          <SummaryRow label="Standing" value={data.standingLevel} />
          <SummaryRow label="Recognition" value={data.recognitionScope} />
          <SummaryRow label="Following" value={data.socialFollowing} />
        </SummarySection>

        <SummarySection title="Timeline">
          <SummaryRow label="Urgency" value={data.urgency} />
          <SummaryRow label="Timeline" value={data.idealTimeline} />
          {(data.altCategories as string[])?.length > 0 && (
            <div className="flex gap-1 items-center">
              <span className="text-xs text-muted-foreground w-24">Alt Categories</span>
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

function SummarySection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-50 rounded p-4 space-y-2">
      <h3 className="text-sm font-medium">{title}</h3>
      <div className="space-y-1">{children}</div>
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="flex text-sm">
      <span className="text-muted-foreground w-24 shrink-0">{label}</span>
      <span>{value}</span>
    </div>
  )
}
