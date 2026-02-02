"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import type { PendingField } from "@/app/onboarding/_lib/use-document-upload"

interface Props {
  fields: PendingField[]
  onApply: (fields: PendingField[]) => void
  onDismiss: () => void
}

export function ExtractedFieldsModal({ fields: initialFields, onApply, onDismiss }: Props) {
  const [fields, setFields] = useState<PendingField[]>(initialFields)

  function toggle(key: string) {
    setFields(prev =>
      prev.map(f => f.key === key ? { ...f, selected: !f.selected } : f)
    )
  }

  function toggleAll(selected: boolean) {
    setFields(prev => prev.map(f => ({ ...f, selected })))
  }

  const selectedCount = fields.filter(f => f.selected).length

  function formatValue(field: PendingField): string {
    if (field.key === "education" && Array.isArray(field.value)) {
      return (field.value as { degree: string; institution: string }[])
        .map(e => `${e.degree}, ${e.institution}`)
        .join("; ")
    }
    if (field.key === "hasMajorAchievement") {
      return field.value ? "Yes" : "No"
    }
    return String(field.value ?? "")
  }

  function confidenceColor(c: number) {
    if (c >= 0.8) return "text-green-700"
    if (c >= 0.5) return "text-yellow-700"
    return "text-red-700"
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onDismiss() }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Extracted Information</DialogTitle>
          <DialogDescription>
            Select which fields to add to your profile. Existing values will be overwritten.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1 max-h-[400px] overflow-y-auto">
          <div className="flex items-center justify-between px-1 pb-2 border-b">
            <button
              type="button"
              className="text-xs text-muted-foreground hover:underline"
              onClick={() => toggleAll(selectedCount < fields.length)}
            >
              {selectedCount < fields.length ? "Select all" : "Deselect all"}
            </button>
            <span className="text-xs text-muted-foreground">
              {selectedCount} of {fields.length} selected
            </span>
          </div>

          {fields.map((field) => (
            <label
              key={field.key}
              className="flex items-start gap-3 rounded px-2 py-2.5 hover:bg-gray-50 cursor-pointer"
            >
              <Checkbox
                checked={field.selected}
                onCheckedChange={() => toggle(field.key)}
                className="mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{field.label}</span>
                  <span className={`text-xs ${confidenceColor(field.confidence)}`}>
                    {Math.round(field.confidence * 100)}%
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {formatValue(field)}
                </p>
              </div>
            </label>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onDismiss}>
            Skip
          </Button>
          <Button onClick={() => onApply(fields)} disabled={selectedCount === 0}>
            Apply {selectedCount > 0 ? `(${selectedCount})` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
