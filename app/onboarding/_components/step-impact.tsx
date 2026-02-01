"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { impactSchema, type ImpactData } from "@/app/onboarding/_lib/onboarding-schema"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Plus, X } from "lucide-react"
import type { ClientData } from "@/app/onboarding/_lib/use-onboarding"

interface Props {
  data: ClientData
  onUpdate: (fields: Record<string, unknown>) => void
}

export function StepImpact({ data, onUpdate }: Props) {
  const { register, watch, setValue } = useForm<ImpactData>({
    resolver: zodResolver(impactSchema),
    defaultValues: {
      socialFollowing: data.socialFollowing || "",
      keynotes: data.keynotes || "",
      recommenders: (data.recommenders as ImpactData["recommenders"]) || [],
      selfAssessment: data.selfAssessment || "",
      standingLevel: data.standingLevel || "",
      recognitionScope: data.recognitionScope || "",
    },
  })

  const recommenders = watch("recommenders") || []

  function handleBlur(field: keyof ImpactData) {
    onUpdate({ [field]: watch(field) })
  }

  function addRecommender() {
    const updated = [...recommenders, { name: "", title: "", relationship: "" }]
    setValue("recommenders", updated)
    onUpdate({ recommenders: updated })
  }

  function removeRecommender(index: number) {
    const updated = recommenders.filter((_, i) => i !== index)
    setValue("recommenders", updated)
    onUpdate({ recommenders: updated })
  }

  function updateRecommender(index: number, field: string, value: string) {
    const updated = [...recommenders]
    updated[index] = { ...updated[index], [field]: value }
    setValue("recommenders", updated)
    onUpdate({ recommenders: updated })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Impact & Standing</h2>
        <p className="text-sm text-muted-foreground">
          Information about the applicant&apos;s professional impact and standing
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="socialFollowing">Social/Professional Following</Label>
          <Input
            id="socialFollowing"
            placeholder="e.g. 50K LinkedIn, 10K Twitter"
            {...register("socialFollowing")}
            onBlur={() => handleBlur("socialFollowing")}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="standingLevel">Standing Level</Label>
          <Input
            id="standingLevel"
            placeholder="e.g. National, International"
            {...register("standingLevel")}
            onBlur={() => handleBlur("standingLevel")}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="recognitionScope">Recognition Scope</Label>
        <Input
          id="recognitionScope"
          placeholder="e.g. Industry-wide, Global"
          {...register("recognitionScope")}
          onBlur={() => handleBlur("recognitionScope")}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="keynotes">Keynote Speeches & Collaborations</Label>
        <Textarea
          id="keynotes"
          rows={3}
          placeholder="List keynote speeches, notable collaborations, invited talks..."
          {...register("keynotes")}
          onBlur={() => handleBlur("keynotes")}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="selfAssessment">Self-Assessment</Label>
        <Textarea
          id="selfAssessment"
          rows={4}
          placeholder="In your own words, why does this applicant qualify for EB1A?"
          {...register("selfAssessment")}
          onBlur={() => handleBlur("selfAssessment")}
        />
      </div>

      {/* Recommenders */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Recommenders</Label>
          <Button type="button" variant="outline" size="sm" onClick={addRecommender}>
            <Plus className="h-3 w-3 mr-1" /> Add
          </Button>
        </div>
        {recommenders.map((rec, i) => (
          <div key={i} className="grid grid-cols-3 gap-2 items-end">
            <Input
              placeholder="Name"
              value={rec.name}
              onChange={(e) => updateRecommender(i, "name", e.target.value)}
            />
            <Input
              placeholder="Title/Position"
              value={rec.title}
              onChange={(e) => updateRecommender(i, "title", e.target.value)}
            />
            <div className="flex gap-1">
              <Input
                placeholder="Relationship"
                value={rec.relationship}
                onChange={(e) => updateRecommender(i, "relationship", e.target.value)}
              />
              <Button type="button" variant="ghost" size="icon" onClick={() => removeRecommender(i)}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
