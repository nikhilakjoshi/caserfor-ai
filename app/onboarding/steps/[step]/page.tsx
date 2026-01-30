"use client"

import { useParams, useRouter } from "next/navigation"
import { useOnboarding } from "@/app/onboarding/_lib/use-onboarding"
import { OnboardingShell } from "@/app/onboarding/_components/onboarding-shell"
import { StepPersonal } from "@/app/onboarding/_components/step-personal"
import { StepAchievement } from "@/app/onboarding/_components/step-achievement"
import { StepCriteria } from "@/app/onboarding/_components/step-criteria"
import { StepImpact } from "@/app/onboarding/_components/step-impact"
import { StepDocsTimeline } from "@/app/onboarding/_components/step-docs-timeline"
import { StepReview } from "@/app/onboarding/_components/step-review"
import { Loader2 } from "lucide-react"

export default function StepPage() {
  const params = useParams()
  const router = useRouter()
  const step = parseInt(params.step as string, 10)

  const {
    clientData,
    loading,
    error,
    saveStatus,
    updateFields,
    goToStep,
    flushAndSave,
    saveDraft,
  } = useOnboarding()

  if (isNaN(step) || step < 1 || step > 6) {
    router.replace("/onboarding")
    return null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !clientData) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-sm text-red-500">{error || "Failed to load"}</p>
        <button
          className="text-sm underline"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    )
  }

  function renderStep() {
    if (!clientData) return null
    switch (step) {
      case 1:
        return <StepPersonal data={clientData} onUpdate={updateFields} />
      case 2:
        return <StepAchievement data={clientData} onUpdate={updateFields} />
      case 3:
        return <StepCriteria clientId={clientData.id} />
      case 4:
        return <StepImpact data={clientData} onUpdate={updateFields} />
      case 5:
        return (
          <StepDocsTimeline
            data={clientData}
            onUpdate={updateFields}
            clientId={clientData.id}
          />
        )
      case 6:
        return (
          <StepReview
            data={clientData}
            clientId={clientData.id}
            onFlush={flushAndSave}
            onSave={saveDraft}
          />
        )
      default:
        return null
    }
  }

  return (
    <OnboardingShell
      currentStep={step}
      onBack={() => goToStep(step - 1)}
      onNext={() => goToStep(step + 1)}
      saveStatus={saveStatus}
    >
      {renderStep()}
    </OnboardingShell>
  )
}
