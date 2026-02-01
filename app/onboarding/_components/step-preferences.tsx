"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { step9Schema, type Step9Data } from "@/app/onboarding/_lib/onboarding-schema"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { ClientData } from "@/app/onboarding/_lib/use-onboarding"

const ALT_CATEGORIES = ["EB-1B", "EB-2 NIW", "O-1A", "O-1B"]

interface Props {
  data: ClientData
  onUpdate: (fields: Record<string, unknown>) => void
}

export function StepPreferences({ data, onUpdate }: Props) {
  const { register, watch, setValue } = useForm<Step9Data>({
    resolver: zodResolver(step9Schema),
    defaultValues: {
      communicationPreference: data.communicationPreference || "",
      timezone: data.timezone || "",
      altCategories: (data.altCategories as string[]) || [],
    },
    mode: "onBlur",
  })

  const altCategories = watch("altCategories") || []

  function handleBlur(field: keyof Step9Data) {
    const value = watch(field)
    onUpdate({ [field]: value })
  }

  function toggleAltCategory(cat: string) {
    const updated = altCategories.includes(cat)
      ? altCategories.filter((c) => c !== cat)
      : [...altCategories, cat]
    setValue("altCategories", updated)
    onUpdate({ altCategories: updated })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Preferences</h2>
        <p className="text-sm text-muted-foreground">Communication preferences and alternative categories</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="communicationPreference">Communication Preference</Label>
          <Input
            id="communicationPreference"
            placeholder="e.g. Email, Phone, Video call"
            {...register("communicationPreference")}
            onBlur={() => handleBlur("communicationPreference")}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="timezone">Timezone</Label>
          <Input
            id="timezone"
            placeholder="e.g. EST, PST, UTC+5:30"
            {...register("timezone")}
            onBlur={() => handleBlur("timezone")}
          />
        </div>
      </div>

      <div className="space-y-3">
        <Label>Alternative Categories of Interest</Label>
        <p className="text-xs text-muted-foreground">
          Select any alternative visa categories you would also like to explore
        </p>
        <div className="flex flex-wrap gap-2">
          {ALT_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => toggleAltCategory(cat)}
              className={`px-3 py-1.5 text-sm rounded border transition-colors ${
                altCategories.includes(cat)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-input hover:bg-muted"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
