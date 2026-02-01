"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { step2Schema, type Step2Data } from "@/app/onboarding/_lib/onboarding-schema"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { ClientData } from "@/app/onboarding/_lib/use-onboarding"

interface Props {
  data: ClientData
  onUpdate: (fields: Record<string, unknown>) => void
}

export function StepBasicInfo({ data, onUpdate }: Props) {
  const { register, watch, formState: { errors } } = useForm<Step2Data>({
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

  function handleBlur(field: keyof Step2Data) {
    const value = watch(field)
    onUpdate({ [field]: value })
  }

  function handleConsent(checked: boolean) {
    onUpdate({ consentToProcess: checked })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Basic Information</h2>
        <p className="text-sm text-muted-foreground">Your name and contact details</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="firstName">First Name *</Label>
          <Input id="firstName" {...register("firstName")} onBlur={() => handleBlur("firstName")} />
          {errors.firstName && <p className="text-xs text-red-500">{errors.firstName.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lastName">Last Name *</Label>
          <Input id="lastName" {...register("lastName")} onBlur={() => handleBlur("lastName")} />
          {errors.lastName && <p className="text-xs text-red-500">{errors.lastName.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email *</Label>
          <Input id="email" type="email" {...register("email")} onBlur={() => handleBlur("email")} />
          {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone</Label>
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
    </div>
  )
}
