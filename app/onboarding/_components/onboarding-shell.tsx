"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ChevronLeft, ChevronRight, Loader2, Check, AlertCircle, RotateCcw } from "lucide-react"

const STEP_LABELS = [
  "Welcome",
  "Basic Info",
  "Documents",
  "Background",
  "Evidence",
  "Achievement",
  "Immigration",
  "Circumstances",
  "Preferences",
  "Review",
]

interface OnboardingShellProps {
  currentStep: number
  totalSteps?: number
  onBack: () => void
  onNext: () => void
  canGoNext?: boolean
  saveStatus?: "saved" | "saving" | "error" | "idle"
  onStartOver?: () => Promise<void>
  children: React.ReactNode
}

export function OnboardingShell({
  currentStep,
  totalSteps = 10,
  onBack,
  onNext,
  canGoNext = true,
  saveStatus = "idle",
  onStartOver,
  children,
}: OnboardingShellProps) {
  const progress = (currentStep / totalSteps) * 100
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [resetting, setResetting] = useState(false)

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Step {currentStep} of {totalSteps}</span>
          <span className="flex items-center gap-1.5 text-xs">
            {saveStatus === "saving" && (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                Saving...
              </>
            )}
            {saveStatus === "saved" && (
              <>
                <Check className="h-3 w-3 text-green-600" />
                Saved
              </>
            )}
            {saveStatus === "error" && (
              <>
                <AlertCircle className="h-3 w-3 text-red-500" />
                Save failed
              </>
            )}
          </span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        {/* Step labels */}
        <div className="flex justify-between overflow-x-auto gap-1">
          {STEP_LABELS.map((label, i) => (
            <span
              key={label}
              className={`text-xs ${
                i + 1 === currentStep
                  ? "text-foreground font-medium"
                  : i + 1 < currentStep
                  ? "text-muted-foreground"
                  : "text-muted-foreground/50"
              }`}
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="min-h-[400px]">{children}</div>

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t">
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onBack}
            disabled={currentStep <= 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          {onStartOver && currentStep > 1 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground text-xs"
              onClick={() => setConfirmOpen(true)}
              disabled={resetting}
            >
              {resetting ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <RotateCcw className="h-3 w-3 mr-1" />
              )}
              Start Over
            </Button>
          )}
        </div>
        {currentStep < totalSteps ? (
          <Button onClick={onNext} disabled={!canGoNext}>
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : null}
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Start over?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete all your answers, uploaded documents, and evaluation results. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={resetting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={resetting}
              onClick={async (e) => {
                e.preventDefault()
                setResetting(true)
                try {
                  await onStartOver?.()
                } finally {
                  setResetting(false)
                  setConfirmOpen(false)
                }
              }}
            >
              {resetting && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Delete and start over
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
