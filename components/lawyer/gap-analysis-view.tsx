"use client"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface CriterionGap {
  slug: string
  label: string
  strength: number
  existingEvidence: string[]
  gaps: string[]
  recommendations: string[]
}

interface GapAnalysisData {
  id: string
  overallStrength: string
  summary: string
  criteria: CriterionGap[]
  priorityActions: string[]
  createdAt: string
}

const strengthColors: Record<number, string> = {
  1: "bg-red-100 text-red-800",
  2: "bg-orange-100 text-orange-800",
  3: "bg-yellow-100 text-yellow-800",
  4: "bg-green-100 text-green-800",
  5: "bg-emerald-100 text-emerald-800",
}

const overallColors: Record<string, string> = {
  strong: "bg-green-100 text-green-800",
  moderate: "bg-yellow-100 text-yellow-800",
  weak: "bg-orange-100 text-orange-800",
  insufficient: "bg-red-100 text-red-800",
}

export function GapAnalysisView({ data }: { data: GapAnalysisData }) {
  return (
    <div className="space-y-6">
      {/* Overall summary */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Badge variant="outline" className={overallColors[data.overallStrength] || ""}>
            {data.overallStrength}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {new Date(data.createdAt).toLocaleString()}
          </span>
        </div>
        <p className="text-sm text-muted-foreground whitespace-pre-line">{data.summary}</p>
      </div>

      {/* Priority actions */}
      {data.priorityActions.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Priority Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              {data.priorityActions.map((action, i) => (
                <li key={i}>{action}</li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      {/* Per-criterion breakdown */}
      <div className="space-y-3">
        {data.criteria.map((c) => (
          <Card key={c.slug}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">{c.label}</CardTitle>
                <Badge variant="outline" className={strengthColors[c.strength] || ""}>
                  {c.strength}/5
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {c.existingEvidence.length > 0 && (
                <div>
                  <p className="font-medium text-xs mb-1">Evidence</p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
                    {c.existingEvidence.map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                </div>
              )}
              {c.gaps.length > 0 && (
                <div>
                  <p className="font-medium text-xs mb-1">Gaps</p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
                    {c.gaps.map((g, i) => (
                      <li key={i}>{g}</li>
                    ))}
                  </ul>
                </div>
              )}
              {c.recommendations.length > 0 && (
                <div>
                  <p className="font-medium text-xs mb-1">Recommendations</p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
                    {c.recommendations.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
