"use client"

import { type Recommender, type RecommenderStatus } from "./recommender-list"

const stages: { key: RecommenderStatus; label: string; color: string }[] = [
  { key: "suggested", label: "Suggested", color: "bg-gray-400" },
  { key: "identified", label: "Identified", color: "bg-blue-400" },
  { key: "contacted", label: "Contacted", color: "bg-yellow-400" },
  { key: "confirmed", label: "Confirmed", color: "bg-green-400" },
  { key: "letter_drafted", label: "Drafted", color: "bg-purple-400" },
  { key: "letter_finalized", label: "Finalized", color: "bg-emerald-400" },
]

interface StatusPipelineProps {
  recommenders: Recommender[]
}

export function StatusPipeline({ recommenders }: StatusPipelineProps) {
  const counts = new Map<RecommenderStatus, number>()
  for (const stage of stages) counts.set(stage.key, 0)
  for (const rec of recommenders) {
    counts.set(rec.status, (counts.get(rec.status) ?? 0) + 1)
  }

  return (
    <div className="flex items-center gap-1 overflow-x-auto py-2">
      {stages.map((stage, i) => {
        const count = counts.get(stage.key) ?? 0
        return (
          <div key={stage.key} className="flex items-center">
            <div className="flex flex-col items-center min-w-[80px]">
              <div
                className={`${stage.color} text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-semibold`}
              >
                {count}
              </div>
              <span className="text-xs text-muted-foreground mt-1 text-center">
                {stage.label}
              </span>
            </div>
            {i < stages.length - 1 && (
              <div className="w-6 h-0.5 bg-muted -mt-4" />
            )}
          </div>
        )
      })}
    </div>
  )
}
