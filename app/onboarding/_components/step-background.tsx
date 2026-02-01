"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { step4Schema, type Step4Data } from "@/app/onboarding/_lib/onboarding-schema"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Plus, X } from "lucide-react"
import type { ClientData, ResumeConfidence } from "@/app/onboarding/_lib/use-onboarding"
import { ConfidenceBadge } from "./confidence-badge"

interface Props {
  data: ClientData
  onUpdate: (fields: Record<string, unknown>) => void
  resumeConfidence?: ResumeConfidence
}

export function StepBackground({ data, onUpdate, resumeConfidence = {} }: Props) {
  const { register, watch, setValue, formState: { errors } } = useForm<Step4Data>({
    resolver: zodResolver(step4Schema),
    defaultValues: {
      citizenship: data.citizenship || "",
      fieldOfExpertise: data.fieldOfExpertise || "",
      currentEmployer: data.currentEmployer || "",
      dateOfBirth: data.dateOfBirth || "",
      education: (data.education as Step4Data["education"]) || [],
    },
    mode: "onBlur",
  })

  const education = watch("education") || []

  function handleBlur(field: keyof Step4Data) {
    const value = watch(field)
    onUpdate({ [field]: value })
  }

  function addEducation() {
    const updated = [...education, { institution: "", degree: "", year: "" }]
    setValue("education", updated)
    onUpdate({ education: updated })
  }

  function removeEducation(index: number) {
    const updated = education.filter((_, i) => i !== index)
    setValue("education", updated)
    onUpdate({ education: updated })
  }

  function updateEducation(index: number, field: string, value: string) {
    const updated = [...education]
    updated[index] = { ...updated[index], [field]: value }
    setValue("education", updated)
    onUpdate({ education: updated })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Background</h2>
        <p className="text-sm text-muted-foreground">Citizenship, education, and professional background</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Label htmlFor="citizenship">Citizenship</Label>
            {resumeConfidence.citizenship && <ConfidenceBadge confidence={resumeConfidence.citizenship} />}
          </div>
          <Input id="citizenship" {...register("citizenship")} onBlur={() => handleBlur("citizenship")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dateOfBirth">Date of Birth</Label>
          <Input id="dateOfBirth" type="date" {...register("dateOfBirth")} onBlur={() => handleBlur("dateOfBirth")} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Label htmlFor="fieldOfExpertise">Field of Expertise *</Label>
            {resumeConfidence.fieldOfExpertise && <ConfidenceBadge confidence={resumeConfidence.fieldOfExpertise} />}
          </div>
          <Input id="fieldOfExpertise" {...register("fieldOfExpertise")} onBlur={() => handleBlur("fieldOfExpertise")} />
          {errors.fieldOfExpertise && <p className="text-xs text-red-500">{errors.fieldOfExpertise.message}</p>}
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Label htmlFor="currentEmployer">Current Employer</Label>
            {resumeConfidence.currentEmployer && <ConfidenceBadge confidence={resumeConfidence.currentEmployer} />}
          </div>
          <Input id="currentEmployer" {...register("currentEmployer")} onBlur={() => handleBlur("currentEmployer")} />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Label>Education</Label>
            {resumeConfidence.education && <ConfidenceBadge confidence={resumeConfidence.education} />}
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addEducation}>
            <Plus className="h-3 w-3 mr-1" /> Add
          </Button>
        </div>
        {education.map((edu, i) => (
          <div key={i} className="grid grid-cols-3 gap-2 items-end">
            <Input
              placeholder="Institution"
              value={edu.institution}
              onChange={(e) => updateEducation(i, "institution", e.target.value)}
            />
            <Input
              placeholder="Degree"
              value={edu.degree}
              onChange={(e) => updateEducation(i, "degree", e.target.value)}
            />
            <div className="flex gap-1">
              <Input
                placeholder="Year"
                value={edu.year}
                onChange={(e) => updateEducation(i, "year", e.target.value)}
              />
              <Button type="button" variant="ghost" size="icon" onClick={() => removeEducation(i)}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
