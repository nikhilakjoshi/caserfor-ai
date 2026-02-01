"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Upload, FileText, Loader2, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { ResumeParseResult } from "@/lib/resume-parser"

interface Props {
  clientId: string
  onUpdate: (fields: Record<string, unknown>) => void
  onParsed?: (result: ResumeParseResult) => void
}

export function StepResumeUpload({ clientId, onUpdate, onParsed }: Props) {
  const [uploading, setUploading] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [uploaded, setUploaded] = useState(false)
  const [parsed, setParsed] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [parseResult, setParseResult] = useState<ResumeParseResult | null>(null)
  const [fieldCount, setFieldCount] = useState(0)

  const onDrop = useCallback(async (files: File[]) => {
    if (files.length === 0) return
    const file = files[0]
    setUploading(true)
    setError(null)
    setFileName(file.name)
    setParsed(false)
    setParseResult(null)

    try {
      const formData = new FormData()
      formData.append("files", file)
      formData.append("categories", "resume")

      const res = await fetch(`/api/onboarding/${clientId}/upload`, {
        method: "POST",
        body: formData,
      })
      if (!res.ok) throw new Error("Upload failed")
      const docs = await res.json()
      setUploaded(true)
      setUploading(false)

      // Trigger resume parsing
      if (docs.length > 0) {
        setParsing(true)
        try {
          const parseRes = await fetch(`/api/onboarding/${clientId}/parse-resume`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ documentId: docs[0].id }),
          })
          if (parseRes.ok) {
            const result: ResumeParseResult = await parseRes.json()
            setParseResult(result)
            setParsed(true)
            onParsed?.(result)

            // Build fields to update, only for high-enough confidence values
            const fields: Record<string, unknown> = {}
            const confidenceMap: Record<string, number> = {}
            let count = 0

            const simpleFields = [
              "firstName", "lastName", "email", "phone",
              "citizenship", "fieldOfExpertise", "currentEmployer",
              "majorAchievementDetails",
            ] as const

            for (const key of simpleFields) {
              const field = result[key]
              if (field.value !== null && field.confidence > 0.3) {
                fields[key] = field.value
                confidenceMap[key] = field.confidence
                count++
              }
            }

            if (result.education.value && result.education.value.length > 0 && result.education.confidence > 0.3) {
              fields.education = result.education.value
              confidenceMap.education = result.education.confidence
              count++
            }

            if (result.hasMajorAchievement.value !== null && result.hasMajorAchievement.confidence > 0.3) {
              fields.hasMajorAchievement = result.hasMajorAchievement.value
              confidenceMap.hasMajorAchievement = result.hasMajorAchievement.confidence
              count++
            }

            setFieldCount(count)

            if (Object.keys(fields).length > 0) {
              // Store confidence data in metadata for UI display
              fields._resumeConfidence = confidenceMap
              onUpdate(fields)
            }
          }
        } catch (parseErr) {
          console.error("Resume parsing failed:", parseErr)
          // Non-fatal - file is still uploaded
        } finally {
          setParsing(false)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed")
      setUploading(false)
    }
  }, [clientId, onUpdate, onParsed])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "text/plain": [".txt"],
    },
    maxFiles: 1,
    maxSize: 25 * 1024 * 1024,
    disabled: uploading || parsing,
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Resume Upload</h2>
        <p className="text-sm text-muted-foreground">
          Upload your resume to auto-fill your profile. This step is optional.
        </p>
      </div>

      {uploaded ? (
        <div className="flex flex-col items-center gap-3 py-12 bg-gray-50 rounded border border-dashed">
          {parsing ? (
            <>
              <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
              <div className="text-center">
                <p className="text-sm font-medium">Parsing resume...</p>
                <p className="text-xs text-muted-foreground">{fileName}</p>
              </div>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-10 w-10 text-green-600" />
              <div className="text-center">
                <p className="text-sm font-medium">Resume uploaded</p>
                <p className="text-xs text-muted-foreground">{fileName}</p>
                {parsed && (
                  <p className="text-xs text-green-600 mt-1">
                    {fieldCount > 0
                      ? `${fieldCount} field${fieldCount !== 1 ? "s" : ""} auto-filled from resume`
                      : "No fields could be extracted"}
                  </p>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={() => { setUploaded(false); setFileName(null); setParsed(false); setParseResult(null) }}>
                Upload different file
              </Button>
            </>
          )}
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={`flex flex-col items-center gap-3 py-12 rounded border-2 border-dashed cursor-pointer transition-colors ${
            isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-muted-foreground/50"
          }`}
        >
          <input {...getInputProps()} />
          {uploading ? (
            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
          ) : (
            <Upload className="h-10 w-10 text-muted-foreground" />
          )}
          <div className="text-center">
            <p className="text-sm font-medium">
              {uploading ? "Uploading..." : "Drop your resume here or click to browse"}
            </p>
            <p className="text-xs text-muted-foreground">PDF, DOCX, or TXT (max 25MB)</p>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      {parseResult && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Extracted fields preview:</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {parseResult.firstName.value && (
              <FieldPreview label="First Name" value={parseResult.firstName.value} confidence={parseResult.firstName.confidence} />
            )}
            {parseResult.lastName.value && (
              <FieldPreview label="Last Name" value={parseResult.lastName.value} confidence={parseResult.lastName.confidence} />
            )}
            {parseResult.email.value && (
              <FieldPreview label="Email" value={parseResult.email.value} confidence={parseResult.email.confidence} />
            )}
            {parseResult.fieldOfExpertise.value && (
              <FieldPreview label="Field" value={parseResult.fieldOfExpertise.value} confidence={parseResult.fieldOfExpertise.confidence} />
            )}
            {parseResult.currentEmployer.value && (
              <FieldPreview label="Employer" value={parseResult.currentEmployer.value} confidence={parseResult.currentEmployer.confidence} />
            )}
            {parseResult.education.value && parseResult.education.value.length > 0 && (
              <FieldPreview
                label="Education"
                value={parseResult.education.value.map(e => `${e.degree}, ${e.institution}`).join("; ")}
                confidence={parseResult.education.confidence}
              />
            )}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <FileText className="h-3.5 w-3.5" />
        <span>Your resume will be parsed to pre-fill subsequent steps. You can override any auto-filled field.</span>
      </div>
    </div>
  )
}

function FieldPreview({ label, value, confidence }: { label: string; value: string; confidence: number }) {
  const color = confidence >= 0.8 ? "text-green-700" : confidence >= 0.5 ? "text-yellow-700" : "text-red-700"
  return (
    <div className="bg-gray-50 rounded px-2 py-1.5 border">
      <span className="text-muted-foreground">{label}:</span>{" "}
      <span className="font-medium">{value}</span>
      <span className={`ml-1 ${color}`}>({Math.round(confidence * 100)}%)</span>
    </div>
  )
}
