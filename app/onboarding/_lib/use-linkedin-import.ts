"use client"

import { useState, useCallback } from "react"
import type { ResumeParseResult } from "@/lib/resume-parser"
import type { PendingField, UploadedAttachment } from "./use-document-upload"

const FIELD_LABELS: Record<string, string> = {
  firstName: "First Name",
  lastName: "Last Name",
  email: "Email",
  phone: "Phone",
  citizenship: "Citizenship",
  fieldOfExpertise: "Field of Expertise",
  currentEmployer: "Current Employer",
  majorAchievementDetails: "Achievement Details",
  education: "Education",
  hasMajorAchievement: "Major Achievement",
}

interface UseLinkedInImportOptions {
  clientId: string
  onUpdate: (fields: Record<string, unknown>) => void
  onAttachmentAdded?: (attachment: UploadedAttachment) => void
}

export function useLinkedInImport({ clientId, onUpdate, onAttachmentAdded }: UseLinkedInImportOptions) {
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingFields, setPendingFields] = useState<PendingField[] | null>(null)

  const importFromLinkedIn = useCallback(async (url: string) => {
    setImporting(true)
    setError(null)
    setPendingFields(null)

    try {
      const res = await fetch(`/api/onboarding/${clientId}/linkedin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Could not import profile. Check the URL and try again.")
      }

      const { document, parsed } = (await res.json()) as {
        document: { id: string; name: string; fileType: string; createdAt: string }
        parsed: ResumeParseResult
      }

      onAttachmentAdded?.({
        id: document.id,
        name: document.name,
        fileType: document.fileType,
        createdAt: document.createdAt,
      })

      // Map to PendingField[]
      const fields: PendingField[] = []
      const simpleKeys = [
        "firstName", "lastName", "email", "phone",
        "citizenship", "fieldOfExpertise", "currentEmployer",
        "majorAchievementDetails",
      ] as const

      for (const key of simpleKeys) {
        const field = parsed[key]
        if (field.value !== null && field.confidence > 0.3) {
          fields.push({
            key,
            label: FIELD_LABELS[key] || key,
            value: field.value,
            confidence: field.confidence,
            selected: true,
          })
        }
      }

      if (parsed.education.value?.length && parsed.education.confidence > 0.3) {
        fields.push({
          key: "education",
          label: "Education",
          value: parsed.education.value,
          confidence: parsed.education.confidence,
          selected: true,
        })
      }

      if (parsed.hasMajorAchievement.value !== null && parsed.hasMajorAchievement.confidence > 0.3) {
        fields.push({
          key: "hasMajorAchievement",
          label: "Major Achievement",
          value: parsed.hasMajorAchievement.value,
          confidence: parsed.hasMajorAchievement.confidence,
          selected: true,
        })
      }

      if (fields.length > 0) {
        setPendingFields(fields)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed")
    } finally {
      setImporting(false)
    }
  }, [clientId, onAttachmentAdded])

  function applySelectedFields(fields: PendingField[]) {
    const selected = fields.filter((f) => f.selected)
    if (selected.length === 0) {
      setPendingFields(null)
      return
    }
    const update: Record<string, unknown> = {}
    const confidenceMap: Record<string, number> = {}
    for (const f of selected) {
      update[f.key] = f.value
      confidenceMap[f.key] = f.confidence
    }
    update._resumeConfidence = confidenceMap
    onUpdate(update)
    setPendingFields(null)
  }

  function dismissPendingFields() {
    setPendingFields(null)
  }

  return {
    importFromLinkedIn,
    importing,
    error,
    pendingFields,
    applySelectedFields,
    dismissPendingFields,
  }
}
