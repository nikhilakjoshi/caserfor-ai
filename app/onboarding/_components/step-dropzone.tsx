"use client"

import { FileText, Loader2, Paperclip } from "lucide-react"
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

export function StepDropzone({ clientId, onUpdate, onAttachmentAdded, attachments }: Props) {
  const { onDrop, uploading, parsing, error, pendingFields, applySelectedFields, dismissPendingFields } = useDocumentUpload({
    clientId,
    onUpdate,
    onAttachmentAdded,
  })

  return (
    <div className="border-t pt-6 mt-6 space-y-4">
      {attachments.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Paperclip className="h-3.5 w-3.5" />
            <span>{attachments.length} uploaded file{attachments.length !== 1 ? "s" : ""}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {attachments.map((att) => (
              <div
                key={att.id}
                className="flex items-center gap-1.5 rounded bg-gray-50 border px-2 py-1 text-xs"
              >
                <FileText className="h-3 w-3 text-muted-foreground" />
                <span className="truncate max-w-[180px]">{att.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {(uploading || parsing) ? (
        <div className="flex items-center gap-2 py-4 px-4 bg-gray-50 rounded border border-dashed text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>{uploading ? "Uploading..." : "Extracting information..."}</span>
        </div>
      ) : (
        <FileDropzone
          onDrop={onDrop}
          maxSize={25 * 1024 * 1024}
          multiple={true}
          disabled={uploading || parsing}
          idleText="Drop files here to add information"
          hint="PDF, DOCX, or TXT -- uploads are parsed to auto-fill your profile"
          className="py-6"
        />
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}

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
