"use client"

import { Badge } from "@/components/ui/badge"

interface CriterionResult {
  score: number
  analysis: string
  evidence: string[]
}

interface EligibilityReport {
  verdict: string
  summary: string
  criteria: Record<string, CriterionResult>
}

interface Props {
  report: EligibilityReport
}

const VERDICT_COLORS: Record<string, string> = {
  strong: "bg-green-100 text-green-800 border-green-200",
  moderate: "bg-yellow-100 text-yellow-800 border-yellow-200",
  weak: "bg-orange-100 text-orange-800 border-orange-200",
  insufficient: "bg-red-100 text-red-800 border-red-200",
}

function ScoreBar({ score }: { score: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <div
          key={n}
          className={`h-2 w-4 rounded-sm ${
            n <= score ? "bg-primary" : "bg-muted"
          }`}
        />
      ))}
    </div>
  )
}

export function ReviewSummary({ report }: Props) {
  const verdictClass = VERDICT_COLORS[report.verdict] || VERDICT_COLORS.insufficient

  return (
    <div className="space-y-6">
      <div className="text-center space-y-3">
        <h2 className="text-lg font-semibold">Eligibility Assessment</h2>
        <Badge className={`text-sm px-4 py-1 ${verdictClass}`}>
          {report.verdict.charAt(0).toUpperCase() + report.verdict.slice(1)}
        </Badge>
      </div>

      <div className="bg-gray-50 rounded p-4">
        <p className="text-sm">{report.summary}</p>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-medium">Per-Criterion Breakdown</h3>
        {Object.entries(report.criteria).map(([criterion, result]) => (
          <div key={criterion} className="border rounded p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium capitalize">
                {criterion.replace(/-/g, " ")}
              </span>
              <ScoreBar score={result.score} />
            </div>
            <p className="text-xs text-muted-foreground">{result.analysis}</p>
            {result.evidence.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {result.evidence.map((e, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {e}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
