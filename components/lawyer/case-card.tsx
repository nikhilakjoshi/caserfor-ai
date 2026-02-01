"use client"

import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { UserPlus } from "lucide-react"

export interface CaseData {
  id: string
  firstName: string | null
  lastName: string | null
  email: string | null
  fieldOfExpertise: string | null
  status: string
  verdict: string | null
  criteriaCount: number
  assignedTo: { lawyerId: string; lawyerName: string | null }[]
  createdAt: string
  updatedAt: string
}

const verdictColors: Record<string, string> = {
  strong: "bg-green-100 text-green-800",
  moderate: "bg-yellow-100 text-yellow-800",
  weak: "bg-orange-100 text-orange-800",
  insufficient: "bg-red-100 text-red-800",
}

const statusLabels: Record<string, string> = {
  submitted: "Submitted",
  under_review: "Under Review",
  reviewed: "Reviewed",
  paid: "Paid",
}

export function CaseCard({
  data,
  currentUserId,
  onAssign,
  assigning,
}: {
  data: CaseData
  currentUserId: string
  onAssign: (clientId: string) => void
  assigning: boolean
}) {
  const name = [data.firstName, data.lastName].filter(Boolean).join(" ") || "Unnamed"
  const isAssignedToMe = data.assignedTo.some((a) => a.lawyerId === currentUserId)
  const isUnassigned = data.assignedTo.length === 0

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base leading-tight">
            <Link
              href={`/lawyer/cases/${data.id}`}
              className="hover:underline"
            >
              {name}
            </Link>
          </CardTitle>
          {data.verdict && (
            <Badge variant="outline" className={verdictColors[data.verdict] || ""}>
              {data.verdict}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-1 text-sm text-muted-foreground">
        {data.fieldOfExpertise && <p>{data.fieldOfExpertise}</p>}
        <p>{data.email}</p>
        <div className="flex items-center gap-2 pt-1">
          <Badge variant="secondary" className="text-xs">
            {statusLabels[data.status] || data.status}
          </Badge>
          {data.criteriaCount > 0 && (
            <span className="text-xs">{data.criteriaCount} criteria</span>
          )}
        </div>
        {data.assignedTo.length > 0 && (
          <p className="text-xs">
            Assigned: {data.assignedTo.map((a) => a.lawyerName || "Unknown").join(", ")}
          </p>
        )}
      </CardContent>
      <CardFooter className="pt-2">
        <div className="flex w-full items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {new Date(data.createdAt).toLocaleDateString()}
          </span>
          {isUnassigned && !isAssignedToMe && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAssign(data.id)}
              disabled={assigning}
            >
              <UserPlus className="mr-1 h-3 w-3" />
              {assigning ? "Assigning..." : "Assign to Me"}
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}
