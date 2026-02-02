"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DashboardChat } from "@/components/lawyer/dashboard-chat"
import { CaseTable } from "@/components/lawyer/case-table"
import {
  Briefcase,
  ClipboardCheck,
  FileEdit,
  UserX,
  Loader2,
} from "lucide-react"

interface DashboardStats {
  activeCases: number
  pendingReview: number
  draftsInProgress: number
  unassigned: number
}

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return "Good morning"
  if (h < 18) return "Good afternoon"
  return "Good evening"
}

const quickActions = [
  "Summarize all my active cases",
  "Check upcoming deadlines",
  "Show draft status across cases",
  "Which cases need gap analysis?",
]

const statCards = [
  { key: "activeCases" as const, label: "Active Cases", icon: Briefcase },
  {
    key: "pendingReview" as const,
    label: "Pending Review",
    icon: ClipboardCheck,
  },
  {
    key: "draftsInProgress" as const,
    label: "Drafts In Progress",
    icon: FileEdit,
  },
  { key: "unassigned" as const, label: "Unassigned", icon: UserX },
]

export default function LawyerDashboardPage() {
  const [userName, setUserName] = useState("")
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [chatPrefill, setChatPrefill] = useState("")

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((d) => {
        if (d?.user?.name) setUserName(d.user.name)
      })
      .catch(() => {})

    fetch("/api/lawyer/dashboard/stats")
      .then((r) => r.json())
      .then((d) => {
        if (d && !d.error) setStats(d)
      })
      .catch(() => {})
  }, [])

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <h1 className="text-2xl font-semibold text-center">
        {getGreeting()}
        {userName ? `, ${userName}` : ""}
      </h1>

      {/* Chat input */}
      <DashboardChat prefillText={chatPrefill} />

      {/* Quick action buttons */}
      <div className="flex flex-wrap justify-center gap-2">
        {quickActions.map((text) => (
          <Button
            key={text}
            variant="outline"
            size="sm"
            onClick={() => setChatPrefill(text)}
          >
            {text}
          </Button>
        ))}
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map(({ key, label, icon: Icon }) => (
          <Card key={key}>
            <CardContent className="flex items-center gap-4 py-4">
              <div className="rounded-md bg-muted p-2">
                <Icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                {stats ? (
                  <p className="text-2xl font-semibold">{stats[key]}</p>
                ) : (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mt-1" />
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Case table */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Cases</h2>
        <CaseTable />
      </div>
    </div>
  )
}
