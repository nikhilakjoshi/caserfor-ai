"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Upload, FileText, Loader2, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Props {
  clientId: string
}

export function StepResumeUpload({ clientId }: Props) {
  const [uploading, setUploading] = useState(false)
  const [uploaded, setUploaded] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const onDrop = useCallback(async (files: File[]) => {
    if (files.length === 0) return
    const file = files[0]
    setUploading(true)
    setError(null)
    setFileName(file.name)

    try {
      const formData = new FormData()
      formData.append("files", file)
      formData.append("categories", "resume")

      const res = await fetch(`/api/onboarding/${clientId}/upload`, {
        method: "POST",
        body: formData,
      })
      if (!res.ok) throw new Error("Upload failed")
      setUploaded(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }, [clientId])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "text/plain": [".txt"],
    },
    maxFiles: 1,
    maxSize: 25 * 1024 * 1024,
    disabled: uploading,
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Resume Upload</h2>
        <p className="text-sm text-muted-foreground">
          Upload your resume to help pre-fill your profile. This step is optional.
        </p>
      </div>

      {uploaded ? (
        <div className="flex flex-col items-center gap-3 py-12 bg-gray-50 rounded border border-dashed">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
          <div className="text-center">
            <p className="text-sm font-medium">Resume uploaded</p>
            <p className="text-xs text-muted-foreground">{fileName}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => { setUploaded(false); setFileName(null) }}>
            Upload different file
          </Button>
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

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <FileText className="h-3.5 w-3.5" />
        <span>Resume parsing will be available in a future update. For now, the file is stored in your vault.</span>
      </div>
    </div>
  )
}
