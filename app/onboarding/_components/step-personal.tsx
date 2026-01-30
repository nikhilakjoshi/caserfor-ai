"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { step1Schema, type Step1Data } from "@/app/onboarding/_lib/onboarding-schema"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Plus, X } from "lucide-react"
import type { ClientData } from "@/app/onboarding/_lib/use-onboarding"

interface Props {
  data: ClientData
  onUpdate: (fields: Record<string, unknown>) => void
}

export function StepPersonal({ data, onUpdate }: Props) {
  const { register, watch, setValue, formState: { errors } } = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      firstName: data.firstName || "",
      lastName: data.lastName || "",
      email: data.email || "",
      phone: data.phone || "",
      dateOfBirth: data.dateOfBirth || "",
      citizenship: data.citizenship || "",
      fieldOfExpertise: data.fieldOfExpertise || "",
      currentEmployer: data.currentEmployer || "",
      usIntentType: data.usIntentType || "",
      usIntentDetails: data.usIntentDetails || "",
      education: (data.education as Step1Data["education"]) || [],
    },
    mode: "onBlur",
  })

  const education = watch("education") || []

  function handleBlur(field: keyof Step1Data) {
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
        <h2 className="text-lg font-semibold">Personal Background</h2>
        <p className="text-sm text-muted-foreground">Basic information about the applicant</p>
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

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="dateOfBirth">Date of Birth</Label>
          <Input id="dateOfBirth" type="date" {...register("dateOfBirth")} onBlur={() => handleBlur("dateOfBirth")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="citizenship">Citizenship</Label>
          <Input id="citizenship" {...register("citizenship")} onBlur={() => handleBlur("citizenship")} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="fieldOfExpertise">Field of Expertise *</Label>
          <Input id="fieldOfExpertise" {...register("fieldOfExpertise")} onBlur={() => handleBlur("fieldOfExpertise")} />
          {errors.fieldOfExpertise && <p className="text-xs text-red-500">{errors.fieldOfExpertise.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="currentEmployer">Current Employer</Label>
          <Input id="currentEmployer" {...register("currentEmployer")} onBlur={() => handleBlur("currentEmployer")} />
        </div>
      </div>

      {/* Education */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Education</Label>
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

      {/* US Intent */}
      <div className="space-y-3 border-t pt-4">
        <h3 className="text-sm font-medium">US Intent</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="usIntentType">Intent Type</Label>
            <Input id="usIntentType" placeholder="e.g. Employment, Research" {...register("usIntentType")} onBlur={() => handleBlur("usIntentType")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="usIntentDetails">Details</Label>
            <Input id="usIntentDetails" placeholder="Additional context" {...register("usIntentDetails")} onBlur={() => handleBlur("usIntentDetails")} />
          </div>
        </div>
      </div>
    </div>
  )
}
