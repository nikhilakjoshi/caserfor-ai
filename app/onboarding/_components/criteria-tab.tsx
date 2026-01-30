"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import type { CriterionConfig } from "@/app/onboarding/_lib/criteria-questions"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Check, Loader2 } from "lucide-react"

interface Props {
  config: CriterionConfig
  clientId: string
  initialResponses: Record<string, unknown>
  onSave: (data: Record<string, unknown>) => void
}

export function CriteriaTab({ config, clientId, initialResponses, onSave }: Props) {
  const [values, setValues] = useState<Record<string, unknown>>(initialResponses)
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle")
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const doSave = useCallback(async (data: Record<string, unknown>) => {
    setSaveState("saving")
    try {
      const res = await fetch(`/api/onboarding/${clientId}/criteria`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ criterion: config.slug, responses: data }),
      })
      if (!res.ok) throw new Error("Save failed")
      onSave(data)
      setSaveState("saved")
      setTimeout(() => setSaveState("idle"), 2000)
    } catch {
      setSaveState("idle")
    }
  }, [clientId, config.slug, onSave])

  function handleChange(key: string, value: unknown) {
    const updated = { ...values, [key]: value }
    setValues(updated)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => doSave(updated), 1500)
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">{config.label}</h3>
          <p className="text-xs text-muted-foreground">{config.description}</p>
        </div>
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          {saveState === "saving" && <Loader2 className="h-3 w-3 animate-spin" />}
          {saveState === "saved" && <Check className="h-3 w-3 text-green-600" />}
          {saveState === "saving" ? "Saving..." : saveState === "saved" ? "Saved" : ""}
        </span>
      </div>

      {config.questions.map((q) => (
        <div key={q.key} className="space-y-1.5">
          <Label htmlFor={q.key}>{q.label}</Label>
          {q.type === "textarea" ? (
            <Textarea
              id={q.key}
              rows={3}
              placeholder={q.placeholder}
              value={(values[q.key] as string) || ""}
              onChange={(e) => handleChange(q.key, e.target.value)}
            />
          ) : q.type === "boolean" ? (
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={!!values[q.key]}
                onChange={(e) => handleChange(q.key, e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <span className="text-sm">Yes</span>
            </label>
          ) : (
            <Input
              id={q.key}
              type={q.type === "number" ? "number" : "text"}
              placeholder={q.placeholder}
              value={(values[q.key] as string) || ""}
              onChange={(e) => handleChange(q.key, e.target.value)}
            />
          )}
        </div>
      ))}
    </div>
  )
}
