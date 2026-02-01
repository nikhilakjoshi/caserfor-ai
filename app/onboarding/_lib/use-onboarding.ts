"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"

export interface ClientData {
  id: string
  firstName?: string | null
  lastName?: string | null
  email?: string | null
  phone?: string | null
  dateOfBirth?: string | null
  citizenship?: string | null
  fieldOfExpertise?: string | null
  education?: { institution: string; degree: string; year: string }[] | null
  currentEmployer?: string | null
  usIntentType?: string | null
  usIntentDetails?: string | null
  hasMajorAchievement?: boolean | null
  majorAchievementDetails?: string | null
  socialFollowing?: string | null
  keynotes?: string | null
  recommenders?: { name: string; title: string; relationship: string }[] | null
  selfAssessment?: string | null
  standingLevel?: string | null
  recognitionScope?: string | null
  evidenceChecklist?: string[] | null
  urgency?: string | null
  idealTimeline?: string | null
  priorConsultations?: string | null
  altCategories?: string[] | null
  consentToProcess?: boolean | null
  currentImmigrationStatus?: string | null
  desiredStatus?: string | null
  previousApplications?: string | null
  urgencyReason?: string | null
  specialCircumstances?: string | null
  communicationPreference?: string | null
  timezone?: string | null
  currentStep: number
  status: string
  vaultId?: string | null
  vault?: { id: string; name: string } | null
}

export interface CriterionResponseData {
  id: string
  criterion: string
  responses: Record<string, unknown>
}

export function useOnboarding() {
  const router = useRouter()
  const [clientData, setClientData] = useState<ClientData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingUpdatesRef = useRef<Record<string, unknown>>({})

  // Load draft on mount
  useEffect(() => {
    async function loadDraft() {
      try {
        const res = await fetch("/api/onboarding/draft")
        if (!res.ok) throw new Error("Failed to load draft")
        const data = await res.json()
        setClientData(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load")
      } finally {
        setLoading(false)
      }
    }
    loadDraft()
  }, [])

  const saveDraft = useCallback(async (fields: Record<string, unknown>) => {
    setSaveStatus("saving")
    try {
      const res = await fetch("/api/onboarding/draft", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      })
      if (!res.ok) throw new Error("Save failed")
      const updated = await res.json()
      setClientData(updated)
      setSaveStatus("saved")
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(() => setSaveStatus("idle"), 2000)
    } catch {
      setSaveStatus("error")
    }
  }, [])

  const updateFields = useCallback(
    (fields: Record<string, unknown>) => {
      // Merge into pending updates
      pendingUpdatesRef.current = { ...pendingUpdatesRef.current, ...fields }
      // Update local state immediately
      setClientData((prev) =>
        prev ? { ...prev, ...fields } : prev
      )
      // Debounced auto-save (2s)
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
      autoSaveTimerRef.current = setTimeout(() => {
        const pending = pendingUpdatesRef.current
        pendingUpdatesRef.current = {}
        if (Object.keys(pending).length > 0) {
          saveDraft(pending)
        }
      }, 2000)
    },
    [saveDraft]
  )

  const flushAndSave = useCallback(async () => {
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
    const pending = pendingUpdatesRef.current
    pendingUpdatesRef.current = {}
    if (Object.keys(pending).length > 0) {
      await saveDraft(pending)
    }
  }, [saveDraft])

  const goToStep = useCallback(
    async (step: number) => {
      await flushAndSave()
      await saveDraft({ currentStep: step })
      router.push(`/onboarding/steps/${step}`)
    },
    [flushAndSave, saveDraft, router]
  )

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
    }
  }, [])

  return {
    clientData,
    loading,
    error,
    saveStatus,
    updateFields,
    goToStep,
    flushAndSave,
    saveDraft,
  }
}
