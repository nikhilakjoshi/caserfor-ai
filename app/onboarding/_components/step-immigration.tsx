"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { step7Schema, type Step7Data } from "@/app/onboarding/_lib/onboarding-schema"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { ClientData } from "@/app/onboarding/_lib/use-onboarding"

interface Props {
  data: ClientData
  onUpdate: (fields: Record<string, unknown>) => void
}

export function StepImmigration({ data, onUpdate }: Props) {
  const { register, watch } = useForm<Step7Data>({
    resolver: zodResolver(step7Schema),
    defaultValues: {
      currentImmigrationStatus: data.currentImmigrationStatus || "",
      desiredStatus: data.desiredStatus || "",
      previousApplications: data.previousApplications || "",
      usIntentType: data.usIntentType || "",
      usIntentDetails: data.usIntentDetails || "",
    },
    mode: "onBlur",
  })

  function handleBlur(field: keyof Step7Data) {
    const value = watch(field)
    onUpdate({ [field]: value })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Immigration Details</h2>
        <p className="text-sm text-muted-foreground">Current immigration status and US intent</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="currentImmigrationStatus">Current Immigration Status</Label>
          <Input
            id="currentImmigrationStatus"
            placeholder="e.g. H-1B, F-1, O-1"
            {...register("currentImmigrationStatus")}
            onBlur={() => handleBlur("currentImmigrationStatus")}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="desiredStatus">Desired Status</Label>
          <Input
            id="desiredStatus"
            placeholder="e.g. EB-1A, Green Card"
            {...register("desiredStatus")}
            onBlur={() => handleBlur("desiredStatus")}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="previousApplications">Previous Applications</Label>
        <textarea
          id="previousApplications"
          className="flex min-h-[80px] w-full rounded border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="Describe any previous immigration applications or petitions"
          {...register("previousApplications")}
          onBlur={() => handleBlur("previousApplications")}
        />
      </div>

      <div className="border-t pt-4 space-y-4">
        <h3 className="text-sm font-medium">US Intent</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="usIntentType">Intent Type</Label>
            <Input
              id="usIntentType"
              placeholder="e.g. Employment, Research"
              {...register("usIntentType")}
              onBlur={() => handleBlur("usIntentType")}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="usIntentDetails">Details</Label>
            <Input
              id="usIntentDetails"
              placeholder="Additional context"
              {...register("usIntentDetails")}
              onBlur={() => handleBlur("usIntentDetails")}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
