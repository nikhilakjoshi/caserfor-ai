"use client"

import { useCallback, useRef, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import {
  Download,
  ExternalLink,
  FileText,
  Loader2,
  Paperclip,
  Trash2,
  Upload,
} from "lucide-react"
import type { Recommender, RecommenderStatus } from "./recommender-list"

export interface RecommenderAttachment {
  id: string
  name: string
  fileType: string
  storageKey: string
  createdAt: string
}

interface DraftLink {
  id: string
  title: string | null
  status: string
}

const statusConfig: Record<RecommenderStatus, { label: string; className: string }> = {
  suggested: { label: "Suggested", className: "bg-gray-100 text-gray-800" },
  identified: { label: "Identified", className: "bg-blue-100 text-blue-800" },
  contacted: { label: "Contacted", className: "bg-yellow-100 text-yellow-800" },
  confirmed: { label: "Confirmed", className: "bg-green-100 text-green-800" },
  letter_drafted: { label: "Letter Drafted", className: "bg-purple-100 text-purple-800" },
  letter_finalized: { label: "Finalized", className: "bg-emerald-100 text-emerald-800" },
}

const statusOrder: RecommenderStatus[] = [
  "suggested",
  "identified",
  "contacted",
  "confirmed",
  "letter_drafted",
  "letter_finalized",
]

interface RecommenderDetailProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  recommender: Recommender | null
  clientId: string
  attachments: RecommenderAttachment[]
  draft?: DraftLink | null
  onStatusChange?: (id: string, status: RecommenderStatus) => void
  onAttachmentUploaded?: () => void
  onAttachmentDeleted?: (attachmentId: string) => void
}

export function RecommenderDetail({
  open,
  onOpenChange,
  recommender,
  clientId,
  attachments,
  draft,
  onStatusChange,
  onAttachmentUploaded,
  onAttachmentDeleted,
}: RecommenderDetailProps) {
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleStatusChange = useCallback(
    (value: string) => {
      if (recommender && onStatusChange) {
        onStatusChange(recommender.id, value as RecommenderStatus)
      }
    },
    [recommender, onStatusChange]
  )

  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file || !recommender) return
      setUploading(true)
      try {
        const form = new FormData()
        form.append("file", file)
        const res = await fetch(
          `/api/cases/${clientId}/recommenders/${recommender.id}/attachments`,
          { method: "POST", body: form }
        )
        if (res.ok) {
          onAttachmentUploaded?.()
        }
      } finally {
        setUploading(false)
        if (fileInputRef.current) fileInputRef.current.value = ""
      }
    },
    [recommender, clientId, onAttachmentUploaded]
  )

  const handleDeleteAttachment = useCallback(
    async (attachmentId: string) => {
      if (!recommender) return
      setDeletingId(attachmentId)
      try {
        const res = await fetch(
          `/api/cases/${clientId}/recommenders/${recommender.id}/attachments/${attachmentId}`,
          { method: "DELETE" }
        )
        if (res.ok) {
          onAttachmentDeleted?.(attachmentId)
        }
      } finally {
        setDeletingId(null)
      }
    },
    [recommender, clientId, onAttachmentDeleted]
  )

  if (!recommender) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{recommender.name}</SheetTitle>
          <SheetDescription>
            {recommender.title}
            {recommender.title && recommender.organization && " at "}
            {recommender.organization}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-5 px-4">
          {/* Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Status</span>
            <Select
              value={recommender.status}
              onValueChange={handleStatusChange}
            >
              <SelectTrigger size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOrder.map((s) => (
                  <SelectItem key={s} value={s}>
                    <Badge variant="outline" className={statusConfig[s].className}>
                      {statusConfig[s].label}
                    </Badge>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Contact info */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Contact</h4>
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
              {recommender.email && (
                <>
                  <dt className="text-muted-foreground">Email</dt>
                  <dd>{recommender.email}</dd>
                </>
              )}
              {recommender.phone && (
                <>
                  <dt className="text-muted-foreground">Phone</dt>
                  <dd>{recommender.phone}</dd>
                </>
              )}
              {recommender.linkedinUrl && (
                <>
                  <dt className="text-muted-foreground">LinkedIn</dt>
                  <dd>
                    <a
                      href={recommender.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                    >
                      Profile
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </dd>
                </>
              )}
              {recommender.relationship && (
                <>
                  <dt className="text-muted-foreground">Relationship</dt>
                  <dd>{recommender.relationship}</dd>
                </>
              )}
            </dl>
            {!recommender.email &&
              !recommender.phone &&
              !recommender.linkedinUrl &&
              !recommender.relationship && (
                <p className="text-xs text-muted-foreground">No contact info added.</p>
              )}
          </div>

          {/* Criteria relevance */}
          {recommender.criteriaRelevance.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Criteria Relevance</h4>
                <div className="flex flex-wrap gap-1">
                  {recommender.criteriaRelevance.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* AI Reasoning */}
          {recommender.aiReasoning && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="text-sm font-medium">AI Reasoning</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {recommender.aiReasoning}
                </p>
              </div>
            </>
          )}

          {/* Notes */}
          {recommender.notes && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Notes</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {recommender.notes}
                </p>
              </div>
            </>
          )}

          {/* Linked draft */}
          {draft && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Recommendation Letter</h4>
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span>{draft.title || "Recommendation Letter"}</span>
                  <Badge variant="outline" className="text-xs">
                    {draft.status.replace("_", " ")}
                  </Badge>
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Attachments */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">
                Attachments ({attachments.length})
              </h4>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleUpload}
                />
                <Button
                  variant="outline"
                  size="sm"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploading ? (
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  ) : (
                    <Upload className="mr-1 h-3 w-3" />
                  )}
                  {uploading ? "Uploading..." : "Upload"}
                </Button>
              </div>
            </div>

            {attachments.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No attachments yet. Upload a CV, bio, or other documents.
              </p>
            ) : (
              <ul className="space-y-2">
                {attachments.map((att) => (
                  <li
                    key={att.id}
                    className="flex items-center justify-between rounded-md border p-2"
                  >
                    <div className="flex items-center gap-2 text-sm">
                      <Paperclip className="h-3 w-3 text-muted-foreground" />
                      <span className="truncate max-w-[200px]">{att.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        asChild
                      >
                        <a
                          href={`/api/vaults/presign?key=${encodeURIComponent(att.storageKey)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Download className="h-3 w-3" />
                        </a>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        disabled={deletingId === att.id}
                        onClick={() => handleDeleteAttachment(att.id)}
                      >
                        {deletingId === att.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
