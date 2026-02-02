"use client"

import { useState, useCallback } from "react"
import type { ResumeParseResult } from "@/lib/resume-parser"

export interface UploadedAttachment {
  id: string
  name: string
  fileType: string
  createdAt: string
}

export interface PendingField {
  key: string
  label: string
  value: unknown
  confidence: number
  selected: boolean
}

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

interface UseDocumentUploadOptions {
  clientId: string
  onUpdate: (fields: Record<string, unknown>) => void
  onAttachmentAdded?: (attachment: UploadedAttachment) => void
}

export function useDocumentUpload({ clientId, onUpdate, onAttachmentAdded }: UseDocumentUploadOptions) {
  const [uploading, setUploading] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingFields, setPendingFields] = useState<PendingField[] | null>(null)

  function applySelectedFields(fields: PendingField[]) {
    const selected = fields.filter(f => f.selected)
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

  const onDrop = useCallback(async (files: File[]) => {
    if (files.length === 0) return
    setUploading(true)
    setError(null)
    setPendingFields(null)

    try {
      const formData = new FormData()
      for (const file of files) {
        formData.append("files", file)
      }

      const res = await fetch(`/api/onboarding/${clientId}/upload`, {
        method: "POST",
        body: formData,
      })
      if (!res.ok) throw new Error("Upload failed")
      const docs = await res.json()
      setUploading(false)

      for (const doc of docs) {
        onAttachmentAdded?.({
          id: doc.id,
          name: doc.name,
          fileType: doc.fileType,
          createdAt: doc.createdAt,
        })
      }

      if (docs.length > 0) {
        setParsing(true)
        try {
          const allPending: PendingField[] = []

          for (const doc of docs) {
            const parseRes = await fetch(`/api/onboarding/${clientId}/parse-resume`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ documentId: doc.id }),
            })
            if (!parseRes.ok) continue

            const result: ResumeParseResult = await parseRes.json()

            const simpleFields = [
              "firstName", "lastName", "email", "phone",
              "citizenship", "fieldOfExpertise", "currentEmployer",
              "majorAchievementDetails",
            ] as const

            for (const key of simpleFields) {
              const field = result[key]
              if (field.value !== null && field.confidence > 0.3) {
                allPending.push({
                  key,
                  label: FIELD_LABELS[key] || key,
                  value: field.value,
                  confidence: field.confidence,
                  selected: true,
                })
              }
            }

            if (result.education.value && result.education.value.length > 0 && result.education.confidence > 0.3) {
              allPending.push({
                key: "education",
                label: "Education",
                value: result.education.value,
                confidence: result.education.confidence,
                selected: true,
              })
            }

            if (result.hasMajorAchievement.value !== null && result.hasMajorAchievement.confidence > 0.3) {
              allPending.push({
                key: "hasMajorAchievement",
                label: "Major Achievement",
                value: result.hasMajorAchievement.value,
                confidence: result.hasMajorAchievement.confidence,
                selected: true,
              })
            }
          }

          // Deduplicate by key, keep highest confidence
          const byKey = new Map<string, PendingField>()
          for (const f of allPending) {
            const existing = byKey.get(f.key)
            if (!existing || f.confidence > existing.confidence) {
              byKey.set(f.key, f)
            }
          }

          const deduped = Array.from(byKey.values())
          if (deduped.length > 0) {
            setPendingFields(deduped)
          }
        } catch (parseErr) {
          console.error("Document parsing failed:", parseErr)
        } finally {
          setParsing(false)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed")
      setUploading(false)
    }
  }, [clientId, onUpdate, onAttachmentAdded])

  return {
    onDrop,
    uploading,
    parsing,
    error,
    pendingFields,
    applySelectedFields,
    dismissPendingFields,
  }
}
