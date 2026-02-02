"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { FileText, MoreHorizontal, Pencil, Trash2 } from "lucide-react"

export type RecommenderStatus =
  | "suggested"
  | "identified"
  | "contacted"
  | "confirmed"
  | "letter_drafted"
  | "letter_finalized"

export type RecommenderSourceType = "manual" | "ai_suggested" | "linkedin_extract"

export interface Recommender {
  id: string
  name: string
  title?: string | null
  organization?: string | null
  relationship?: string | null
  linkedinUrl?: string | null
  email?: string | null
  phone?: string | null
  notes?: string | null
  status: RecommenderStatus
  sourceType: RecommenderSourceType
  aiReasoning?: string | null
  criteriaRelevance: string[]
  createdAt: string
  updatedAt: string
  _count?: { attachments: number }
}

const statusConfig: Record<RecommenderStatus, { label: string; className: string }> = {
  suggested: { label: "Suggested", className: "bg-gray-100 text-gray-800" },
  identified: { label: "Identified", className: "bg-blue-100 text-blue-800" },
  contacted: { label: "Contacted", className: "bg-yellow-100 text-yellow-800" },
  confirmed: { label: "Confirmed", className: "bg-green-100 text-green-800" },
  letter_drafted: { label: "Letter Drafted", className: "bg-purple-100 text-purple-800" },
  letter_finalized: { label: "Finalized", className: "bg-emerald-100 text-emerald-800" },
}

const DRAFT_ELIGIBLE_STATUSES: RecommenderStatus[] = [
  "confirmed",
  "letter_drafted",
  "letter_finalized",
]

interface RecommenderListProps {
  recommenders: Recommender[]
  onEdit?: (recommender: Recommender) => void
  onDelete?: (recommender: Recommender) => void
  onDraftLetter?: (recommender: Recommender) => void
}

export function RecommenderList({ recommenders, onEdit, onDelete, onDraftLetter }: RecommenderListProps) {
  if (recommenders.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No recommenders yet. Add one manually or use AI suggestions.
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Title / Organization</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Criteria</TableHead>
          <TableHead className="w-[50px]" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {recommenders.map((rec) => {
          const status = statusConfig[rec.status]
          return (
            <TableRow key={rec.id}>
              <TableCell>
                <div className="font-medium">{rec.name}</div>
                {rec.relationship && (
                  <div className="text-xs text-muted-foreground">{rec.relationship}</div>
                )}
              </TableCell>
              <TableCell>
                {rec.title && <div>{rec.title}</div>}
                {rec.organization && (
                  <div className="text-sm text-muted-foreground">{rec.organization}</div>
                )}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={status.className}>
                  {status.label}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {rec.criteriaRelevance.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onDraftLetter && DRAFT_ELIGIBLE_STATUSES.includes(rec.status) && (
                      <DropdownMenuItem onClick={() => onDraftLetter(rec)}>
                        <FileText className="mr-2 h-4 w-4" />
                        Draft Letter
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => onEdit?.(rec)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDelete?.(rec)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
