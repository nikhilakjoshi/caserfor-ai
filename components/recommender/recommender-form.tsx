"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet"
import type { Recommender } from "./recommender-list"

const recommenderSchema = z.object({
  name: z.string().min(1, "Name is required"),
  title: z.string().optional(),
  organization: z.string().optional(),
  relationship: z.string().optional(),
  linkedinUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  notes: z.string().optional(),
})

type RecommenderFormData = z.infer<typeof recommenderSchema>

interface RecommenderFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  recommender?: Recommender | null
  onSubmit: (data: RecommenderFormData) => void
  isSubmitting?: boolean
}

export function RecommenderForm({
  open,
  onOpenChange,
  recommender,
  onSubmit,
  isSubmitting,
}: RecommenderFormProps) {
  const isEdit = !!recommender

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RecommenderFormData>({
    resolver: zodResolver(recommenderSchema),
    values: recommender
      ? {
          name: recommender.name,
          title: recommender.title ?? "",
          organization: recommender.organization ?? "",
          relationship: recommender.relationship ?? "",
          linkedinUrl: recommender.linkedinUrl ?? "",
          email: recommender.email ?? "",
          phone: recommender.phone ?? "",
          notes: recommender.notes ?? "",
        }
      : undefined,
  })

  function handleFormSubmit(data: RecommenderFormData) {
    onSubmit(data)
    if (!isEdit) reset()
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Edit Recommender" : "Add Recommender"}</SheetTitle>
          <SheetDescription>
            {isEdit
              ? "Update recommender details."
              : "Add a new recommender to this case."}
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={handleSubmit(handleFormSubmit)}
          className="flex flex-col gap-4 px-4"
        >
          <div className="space-y-1.5">
            <Label htmlFor="name">Name *</Label>
            <Input id="name" {...register("name")} placeholder="Full name" />
            {errors.name && (
              <p className="text-xs text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="title">Title</Label>
              <Input id="title" {...register("title")} placeholder="Job title" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="organization">Organization</Label>
              <Input
                id="organization"
                {...register("organization")}
                placeholder="Company / university"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="relationship">Relationship</Label>
            <Input
              id="relationship"
              {...register("relationship")}
              placeholder="e.g. Former supervisor, collaborator"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
            <Input
              id="linkedinUrl"
              {...register("linkedinUrl")}
              placeholder="https://linkedin.com/in/..."
            />
            {errors.linkedinUrl && (
              <p className="text-xs text-red-500">{errors.linkedinUrl.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="email@example.com"
              />
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" {...register("phone")} placeholder="+1 (555) 000-0000" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...register("notes")}
              placeholder="Additional context about this recommender..."
              rows={3}
            />
          </div>

          <SheetFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "Saving..."
                : isEdit
                  ? "Update Recommender"
                  : "Add Recommender"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
