"use client"

import { useState, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { FileText, X } from "lucide-react"
import { FileDropzone } from "@/components/ui/file-dropzone"
import type { ClientData } from "@/app/onboarding/_lib/use-onboarding"

const EVIDENCE_TYPES = [
  "Resume/CV",
  "Award certificates",
  "Recommendation letters",
  "Published articles",
  "Press coverage",
  "Membership documents",
  "Pay stubs/offer letters",
  "Patent documents",
  "Citation reports",
  "Conference programs",
]

interface UploadedDoc {
  id: string
  name: string
  size: number
}

interface Props {
  data: ClientData
  onUpdate: (fields: Record<string, unknown>) => void
  clientId: string
}

export function StepDocsTimeline({ data, onUpdate, clientId }: Props) {
  const [uploading, setUploading] = useState(false)
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDoc[]>([])
  const [uploadError, setUploadError] = useState<string | null>(null)

  const checklist = (data.evidenceChecklist as string[]) || []

  function toggleEvidence(item: string) {
    const updated = checklist.includes(item)
      ? checklist.filter((c) => c !== item)
      : [...checklist, item]
    onUpdate({ evidenceChecklist: updated })
  }

  const onDrop = useCallback(
    async (files: File[]) => {
      setUploading(true)
      setUploadError(null)
      try {
        const formData = new FormData()
        for (const file of files) {
          if (file.size > 25 * 1024 * 1024) {
            setUploadError(`${file.name} exceeds 25MB limit`)
            continue
          }
          formData.append("files", file)
        }
        if (!formData.has("files")) {
          setUploading(false)
          return
        }
        const res = await fetch(`/api/onboarding/${clientId}/upload`, {
          method: "POST",
          body: formData,
        })
        if (!res.ok) throw new Error("Upload failed")
        const docs = await res.json()
        const newDocs = (Array.isArray(docs) ? docs : [docs]).map(
          (d: { id: string; name: string; sizeBytes: number }) => ({
            id: d.id,
            name: d.name,
            size: d.sizeBytes,
          })
        )
        setUploadedDocs((prev) => [...prev, ...newDocs])
      } catch {
        setUploadError("Upload failed. Please try again.")
      } finally {
        setUploading(false)
      }
    },
    [clientId]
  )


  function handleBlur(field: string) {
    const el = document.getElementById(field) as HTMLInputElement | HTMLTextAreaElement | null
    if (el) onUpdate({ [field]: el.value })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Documents & Timeline</h2>
        <p className="text-sm text-muted-foreground">
          Upload supporting evidence and provide timeline information
        </p>
      </div>

      {/* Evidence checklist */}
      <div className="space-y-2">
        <Label>Evidence Available (check all that apply)</Label>
        <div className="grid grid-cols-2 gap-2">
          {EVIDENCE_TYPES.map((item) => (
            <label key={item} className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={checklist.includes(item)}
                onChange={() => toggleEvidence(item)}
                className="h-4 w-4 rounded border-gray-300"
              />
              {item}
            </label>
          ))}
        </div>
      </div>

      {/* File upload */}
      <div className="space-y-2">
        <Label>Upload Documents</Label>
        <FileDropzone
          onDrop={onDrop}
          loading={uploading}
        />
        {uploadError && <p className="text-xs text-red-500">{uploadError}</p>}
        {uploadedDocs.length > 0 && (
          <div className="space-y-1">
            {uploadedDocs.map((doc) => (
              <div key={doc.id} className="flex items-center gap-2 text-sm py-1">
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="truncate">{doc.name}</span>
                <span className="text-xs text-muted-foreground shrink-0">
                  {(doc.size / 1024).toFixed(0)} KB
                </span>
                <button
                  onClick={() => setUploadedDocs((prev) => prev.filter((d) => d.id !== doc.id))}
                  className="ml-auto shrink-0"
                >
                  <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="space-y-3 border-t pt-4">
        <h3 className="text-sm font-medium">Timeline & Preferences</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="urgency">Urgency</Label>
            <Input
              id="urgency"
              placeholder="e.g. Standard, Expedited, Premium Processing"
              defaultValue={data.urgency || ""}
              onBlur={() => handleBlur("urgency")}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="idealTimeline">Ideal Timeline</Label>
            <Input
              id="idealTimeline"
              placeholder="e.g. 6 months, ASAP"
              defaultValue={data.idealTimeline || ""}
              onBlur={() => handleBlur("idealTimeline")}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="priorConsultations">Prior Consultations</Label>
          <Textarea
            id="priorConsultations"
            rows={2}
            placeholder="Have you consulted other attorneys? Any prior filings?"
            defaultValue={data.priorConsultations || ""}
            onBlur={() => handleBlur("priorConsultations")}
          />
        </div>
      </div>

      {/* Alternative categories */}
      <div className="space-y-2 border-t pt-4">
        <Label>Also consider for these categories</Label>
        <div className="flex gap-4">
          {["EB1B", "EB2-NIW"].map((cat) => {
            const alts = (data.altCategories as string[]) || []
            return (
              <label key={cat} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={alts.includes(cat)}
                  onChange={() => {
                    const updated = alts.includes(cat)
                      ? alts.filter((c) => c !== cat)
                      : [...alts, cat]
                    onUpdate({ altCategories: updated })
                  }}
                  className="h-4 w-4 rounded border-gray-300"
                />
                {cat}
              </label>
            )
          })}
        </div>
      </div>
    </div>
  )
}
