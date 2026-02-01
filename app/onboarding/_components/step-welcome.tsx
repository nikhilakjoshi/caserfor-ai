"use client"

import { CheckCircle2 } from "lucide-react"

const PROCESS_STEPS = [
  { title: "Basic Information", desc: "Name, contact, and consent" },
  { title: "Resume Upload", desc: "Optional - auto-fills your profile" },
  { title: "Background", desc: "Citizenship, education, expertise" },
  { title: "EB-1A Evidence", desc: "Per-criterion qualification details" },
  { title: "Achievement", desc: "Major awards or recognition" },
  { title: "Immigration", desc: "Current status and US intent" },
  { title: "Circumstances", desc: "Timeline and special factors" },
  { title: "Preferences", desc: "Communication and alternatives" },
  { title: "Review & Submit", desc: "Final review and evaluation" },
]

export function StepWelcome() {
  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold">Welcome to EB-1A Eligibility Evaluation</h2>
        <p className="text-muted-foreground">
          We will collect information about your qualifications to evaluate your
          EB-1A extraordinary ability visa eligibility. This takes about 15-20 minutes.
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          What we will collect
        </h3>
        <div className="grid gap-2">
          {PROCESS_STEPS.map((s, i) => (
            <div key={i} className="flex items-start gap-3 bg-gray-50 rounded p-3">
              <CheckCircle2 className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <span className="text-sm font-medium">{s.title}</span>
                <span className="text-sm text-muted-foreground"> - {s.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Your data is saved automatically. You can leave and resume at any time.
      </p>
    </div>
  )
}
