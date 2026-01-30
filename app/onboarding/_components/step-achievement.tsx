"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { step2Schema, type Step2Data } from "@/app/onboarding/_lib/onboarding-schema"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { ClientData } from "@/app/onboarding/_lib/use-onboarding"

interface Props {
  data: ClientData
  onUpdate: (fields: Record<string, unknown>) => void
}

export function StepAchievement({ data, onUpdate }: Props) {
  const { register, watch } = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      hasMajorAchievement: data.hasMajorAchievement ?? false,
      majorAchievementDetails: data.majorAchievementDetails || "",
    },
  })

  const hasMajor = watch("hasMajorAchievement")

  function handleBlur(field: keyof Step2Data) {
    onUpdate({ [field]: watch(field) })
  }

  function toggleMajor() {
    const next = !hasMajor
    onUpdate({ hasMajorAchievement: next })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Major Achievement</h2>
        <p className="text-sm text-muted-foreground">
          Has the applicant received a one-time major achievement (e.g. Nobel Prize, Pulitzer, Olympic medal)?
        </p>
      </div>

      <div className="space-y-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={hasMajor || false}
            onChange={toggleMajor}
            className="h-4 w-4 rounded border-gray-300"
          />
          <span className="text-sm">Yes, applicant has a major one-time achievement</span>
        </label>

        {hasMajor && (
          <div className="space-y-1.5">
            <Label htmlFor="majorAchievementDetails">Describe the achievement</Label>
            <Textarea
              id="majorAchievementDetails"
              rows={6}
              placeholder="Describe the achievement, including when it was received, the granting body, and its significance..."
              {...register("majorAchievementDetails")}
              onBlur={() => handleBlur("majorAchievementDetails")}
            />
          </div>
        )}
      </div>
    </div>
  )
}
