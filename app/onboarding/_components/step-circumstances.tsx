"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { step8Schema, type Step8Data } from "@/app/onboarding/_lib/onboarding-schema"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { ClientData } from "@/app/onboarding/_lib/use-onboarding"

interface Props {
  data: ClientData
  onUpdate: (fields: Record<string, unknown>) => void
}

export function StepCircumstances({ data, onUpdate }: Props) {
  const { register, watch } = useForm<Step8Data>({
    resolver: zodResolver(step8Schema),
    defaultValues: {
      urgencyReason: data.urgencyReason || "",
      specialCircumstances: data.specialCircumstances || "",
      urgency: data.urgency || "",
      idealTimeline: data.idealTimeline || "",
    },
    mode: "onBlur",
  })

  function handleBlur(field: keyof Step8Data) {
    const value = watch(field)
    onUpdate({ [field]: value })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Circumstances & Timeline</h2>
        <p className="text-sm text-muted-foreground">Timeline preferences and special factors</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="urgency">Urgency Level</Label>
          <Input
            id="urgency"
            placeholder="e.g. High, Medium, Low"
            {...register("urgency")}
            onBlur={() => handleBlur("urgency")}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="idealTimeline">Ideal Timeline</Label>
          <Input
            id="idealTimeline"
            placeholder="e.g. 3 months, 6 months"
            {...register("idealTimeline")}
            onBlur={() => handleBlur("idealTimeline")}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="urgencyReason">Reason for Urgency</Label>
        <textarea
          id="urgencyReason"
          className="flex min-h-[80px] w-full rounded border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="Explain why this timeline is important"
          {...register("urgencyReason")}
          onBlur={() => handleBlur("urgencyReason")}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="specialCircumstances">Special Circumstances</Label>
        <textarea
          id="specialCircumstances"
          className="flex min-h-[80px] w-full rounded border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="Any other factors we should know about"
          {...register("specialCircumstances")}
          onBlur={() => handleBlur("specialCircumstances")}
        />
      </div>
    </div>
  )
}
