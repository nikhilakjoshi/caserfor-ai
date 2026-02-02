"use client"

import { FileText, Loader2, CheckCircle2 } from "lucide-react"
import { FileDropzone } from "@/components/ui/file-dropzone"
import { useDocumentUpload, type UploadedAttachment } from "@/app/onboarding/_lib/use-document-upload"
import { ExtractedFieldsModal } from "./extracted-fields-modal"
import type { Attachment } from "@/app/onboarding/_lib/use-onboarding"

interface Props {
  clientId: string
  onUpdate: (fields: Record<string, unknown>) => void
  onAttachmentAdded: (attachment: UploadedAttachment) => void
  attachments: Attachment[]
}

export function StepResumeUpload({ clientId, onUpdate, onAttachmentAdded, attachments }: Props) {
  const {
    onDrop,
    uploading,
    parsing,
    error,
    pendingFields,
    applySelectedFields,
    dismissPendingFields,
  } = useDocumentUpload({ clientId, onUpdate, onAttachmentAdded })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Upload Documents</h2>
        <p className="text-sm text-muted-foreground">
          Upload your resume, CV, or any supporting documents. Files are parsed to auto-fill your profile.
        </p>
      </div>

      {(uploading || parsing) ? (
        <div className="flex flex-col items-center gap-3 py-12 bg-gray-50 rounded border border-dashed">
          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
          <div className="text-center">
            <p className="text-sm font-medium">
              {uploading ? "Uploading..." : "Extracting information..."}
            </p>
          </div>
        </div>
      ) : (
        <FileDropzone
          onDrop={onDrop}
          maxSize={25 * 1024 * 1024}
          multiple={true}
          disabled={uploading || parsing}
          idleText="Drop files here or click to browse"
          hint="PDF, DOCX, or TXT (max 25MB) -- resumes, CVs, awards, publications, etc."
          className="py-12"
        />
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      {attachments.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Uploaded files</p>
          <div className="space-y-1">
            {attachments.map((att) => (
              <div key={att.id} className="flex items-center gap-2 bg-gray-50 rounded border px-3 py-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                <span className="truncate">{att.name}</span>
                <span className="text-xs text-muted-foreground uppercase ml-auto">{att.fileType}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <FileText className="h-3.5 w-3.5" />
        <span>Documents are stored securely and used to pre-fill subsequent steps. You can override any auto-filled field.</span>
      </div>

      {pendingFields && (
        <ExtractedFieldsModal
          fields={pendingFields}
          onApply={applySelectedFields}
          onDismiss={dismissPendingFields}
        />
      )}
    </div>
  )
}
