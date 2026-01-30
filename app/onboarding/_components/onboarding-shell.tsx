"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Loader2, Check, AlertCircle } from "lucide-react"

const STEP_LABELS = [
  "Personal",
  "Achievement",
  "Criteria",
  "Impact",
  "Documents",
  "Review",
]

interface OnboardingShellProps {
  currentStep: number
  totalSteps?: number
  onBack: () => void
  onNext: () => void
  canGoNext?: boolean
  saveStatus?: "saved" | "saving" | "error" | "idle"
  children: React.ReactNode
}

export function OnboardingShell({
  currentStep,
  totalSteps = 6,
  onBack,
  onNext,
  canGoNext = true,
  saveStatus = "idle",
  children,
}: OnboardingShellProps) {
  const progress = (currentStep / totalSteps) * 100

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
        <div className="flex justify-between">
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
        <Button
          variant="outline"
          onClick={onBack}
          disabled={currentStep <= 1}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        {currentStep < totalSteps ? (
          <Button onClick={onNext} disabled={!canGoNext}>
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : null}
      </div>
    </div>
  )
}
