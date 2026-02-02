"use client"

import { useParams, useRouter } from "next/navigation"
import { useOnboarding } from "@/app/onboarding/_lib/use-onboarding"
import { OnboardingShell } from "@/app/onboarding/_components/onboarding-shell"
import { StepWelcome } from "@/app/onboarding/_components/step-welcome"
import { StepBasicInfo } from "@/app/onboarding/_components/step-basic-info"
import { StepResumeUpload } from "@/app/onboarding/_components/step-resume-upload"
import { StepBackground } from "@/app/onboarding/_components/step-background"
import { StepCriteria } from "@/app/onboarding/_components/step-criteria"
import { StepAchievement } from "@/app/onboarding/_components/step-achievement"
import { StepImmigration } from "@/app/onboarding/_components/step-immigration"
import { StepCircumstances } from "@/app/onboarding/_components/step-circumstances"
import { StepPreferences } from "@/app/onboarding/_components/step-preferences"
import { StepReview } from "@/app/onboarding/_components/step-review"
import { StepDropzone } from "@/app/onboarding/_components/step-dropzone"
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
    resumeConfidence,
    attachments,
    addAttachment,
  } = useOnboarding()

  if (isNaN(step) || step < 1 || step > 10) {
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

  const showDropzone = step >= 2 && step <= 9 && step !== 3

  function renderStep() {
    if (!clientData) return null
    switch (step) {
      case 1:
        return <StepWelcome />
      case 2:
        return <StepBasicInfo data={clientData} onUpdate={updateFields} resumeConfidence={resumeConfidence} />
      case 3:
        return (
          <StepResumeUpload
            clientId={clientData.id}
            onUpdate={updateFields}
            onAttachmentAdded={addAttachment}
            attachments={attachments}
          />
        )
      case 4:
        return <StepBackground data={clientData} onUpdate={updateFields} resumeConfidence={resumeConfidence} />
      case 5:
        return <StepCriteria clientId={clientData.id} />
      case 6:
        return <StepAchievement data={clientData} onUpdate={updateFields} />
      case 7:
        return <StepImmigration data={clientData} onUpdate={updateFields} />
      case 8:
        return <StepCircumstances data={clientData} onUpdate={updateFields} />
      case 9:
        return <StepPreferences data={clientData} onUpdate={updateFields} />
      case 10:
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

  async function handleStartOver() {
    if (!clientData) return
    const res = await fetch(`/api/onboarding/${clientData.id}/reset`, { method: "POST" })
    if (!res.ok) throw new Error("Reset failed")
    router.replace("/onboarding")
  }

  return (
    <OnboardingShell
      currentStep={step}
      onBack={() => goToStep(step - 1)}
      onNext={() => goToStep(step + 1)}
      saveStatus={saveStatus}
      onStartOver={handleStartOver}
    >
      {renderStep()}
      {showDropzone && (
        <StepDropzone
          clientId={clientData.id}
          onUpdate={updateFields}
          onAttachmentAdded={addAttachment}
          attachments={attachments}
        />
      )}
    </OnboardingShell>
  )
}
