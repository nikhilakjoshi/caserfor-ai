"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { step2Schema, type Step2Data } from "@/app/onboarding/_lib/onboarding-schema"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import type { ClientData, ResumeConfidence } from "@/app/onboarding/_lib/use-onboarding"
import type { UploadedAttachment } from "@/app/onboarding/_lib/use-document-upload"
import { ConfidenceBadge } from "./confidence-badge"
import { ExtractedFieldsModal } from "./extracted-fields-modal"
import { useLinkedInImport } from "@/app/onboarding/_lib/use-linkedin-import"

const LINKEDIN_RE = /linkedin\.com\/in\//i

interface Props {
  data: ClientData
  onUpdate: (fields: Record<string, unknown>) => void
  resumeConfidence?: ResumeConfidence
  clientId: string
  onAttachmentAdded?: (attachment: UploadedAttachment) => void
}

export function StepBasicInfo({ data, onUpdate, resumeConfidence = {}, clientId, onAttachmentAdded }: Props) {
  const [linkedInUrl, setLinkedInUrl] = useState("")
  const [urlError, setUrlError] = useState<string | null>(null)

  const { register, watch, setValue, formState: { errors } } = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      firstName: data.firstName || "",
      lastName: data.lastName || "",
      email: data.email || "",
      phone: data.phone || "",
      consentToProcess: data.consentToProcess ?? false,
    },
    mode: "onBlur",
  })

  // Sync form when parent data changes (e.g. after applying extracted fields)
  useEffect(() => {
    setValue("firstName", data.firstName || "")
    setValue("lastName", data.lastName || "")
    setValue("email", data.email || "")
    setValue("phone", data.phone || "")
    setValue("consentToProcess", data.consentToProcess ?? false)
  }, [data.firstName, data.lastName, data.email, data.phone, data.consentToProcess, setValue])

  const {
    importFromLinkedIn,
    importing,
    error: importError,
    pendingFields,
    applySelectedFields,
    dismissPendingFields,
  } = useLinkedInImport({ clientId, onUpdate, onAttachmentAdded })

  function handleBlur(field: keyof Step2Data) {
    const value = watch(field)
    onUpdate({ [field]: value })
  }

  function handleConsent(checked: boolean) {
    setValue("consentToProcess", checked)
    onUpdate({ consentToProcess: checked })
  }

  function handleImport() {
    setUrlError(null)
    if (!LINKEDIN_RE.test(linkedInUrl)) {
      setUrlError("Enter a valid LinkedIn profile URL (linkedin.com/in/...)")
      return
    }
    importFromLinkedIn(linkedInUrl)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Basic Information</h2>
        <p className="text-sm text-muted-foreground">Your name and contact details</p>
      </div>

      {/* LinkedIn import */}
      <div className="rounded-md border p-4 space-y-2 bg-muted/30">
        <Label htmlFor="linkedinUrl">Import from LinkedIn</Label>
        <div className="flex gap-2">
          <Input
            id="linkedinUrl"
            placeholder="https://linkedin.com/in/..."
            value={linkedInUrl}
            onChange={(e) => setLinkedInUrl(e.target.value)}
            disabled={importing}
          />
          <Button
            type="button"
            variant="secondary"
            onClick={handleImport}
            disabled={importing || !linkedInUrl}
          >
            {importing ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Importing...
              </>
            ) : (
              "Import"
            )}
          </Button>
        </div>
        {(urlError || importError) && (
          <p className="text-xs text-red-500">{urlError || importError}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Label htmlFor="firstName">First Name *</Label>
            {resumeConfidence.firstName && <ConfidenceBadge confidence={resumeConfidence.firstName} />}
          </div>
          <Input id="firstName" {...register("firstName")} onBlur={() => handleBlur("firstName")} />
          {errors.firstName && <p className="text-xs text-red-500">{errors.firstName.message}</p>}
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Label htmlFor="lastName">Last Name *</Label>
            {resumeConfidence.lastName && <ConfidenceBadge confidence={resumeConfidence.lastName} />}
          </div>
          <Input id="lastName" {...register("lastName")} onBlur={() => handleBlur("lastName")} />
          {errors.lastName && <p className="text-xs text-red-500">{errors.lastName.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Label htmlFor="email">Email *</Label>
            {resumeConfidence.email && <ConfidenceBadge confidence={resumeConfidence.email} />}
          </div>
          <Input id="email" type="email" {...register("email")} onBlur={() => handleBlur("email")} />
          {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Label htmlFor="phone">Phone</Label>
            {resumeConfidence.phone && <ConfidenceBadge confidence={resumeConfidence.phone} />}
          </div>
          <Input id="phone" {...register("phone")} onBlur={() => handleBlur("phone")} />
        </div>
      </div>

      <div className="border-t pt-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-gray-300"
            checked={watch("consentToProcess") ?? false}
            onChange={(e) => handleConsent(e.target.checked)}
          />
          <div>
            <span className="text-sm font-medium">I consent to data processing</span>
            <p className="text-xs text-muted-foreground">
              I agree to have my information processed for the purpose of EB-1A eligibility evaluation.
            </p>
          </div>
        </label>
      </div>

      {pendingFields && (
        <ExtractedFieldsModal
          fields={pendingFields}
          onApply={applySelectedFields}
          onDismiss={dismissPendingFields}
        />
      )}
    </div>
  )
}
