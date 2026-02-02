"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CaseCard, type CaseData } from "@/components/lawyer/case-card"
import { DashboardChat } from "@/components/lawyer/dashboard-chat"
import {
  Briefcase,
  ClipboardList,
  FileText,
  UserX,
  Loader2,
  ArrowRight,
} from "lucide-react"

interface Stats {
  activeCases: number
  pendingReview: number
  draftsInProgress: number
  unassigned: number
}

export function LawyerDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [cases, setCases] = useState<CaseData[]>([])
  const [userId, setUserId] = useState("")
  const [loading, setLoading] = useState(true)
  const [assigning, setAssigning] = useState(false)
  const [prefillText, setPrefillText] = useState("")

  useEffect(() => {
    Promise.all([
      fetch("/api/lawyer/dashboard/stats").then((r) => r.json()),
      fetch("/api/lawyer/cases?page=1&pageSize=6").then((r) => r.json()),
      fetch("/api/auth/session").then((r) => r.json()),
    ]).then(([statsData, casesData, session]) => {
      setStats(statsData)
      setCases(casesData.cases || [])
      setUserId(session?.user?.id || "")
      setLoading(false)
    })
  }, [])

  const handleAssign = useCallback(
    async (clientId: string) => {
      setAssigning(true)
      try {
        await fetch(`/api/lawyer/cases/${clientId}/assign`, { method: "POST" })
        // Refresh cases
        const res = await fetch("/api/lawyer/cases?page=1&pageSize=6")
        const data = await res.json()
        setCases(data.cases || [])
      } finally {
        setAssigning(false)
      }
    },
    [],
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const statCards = [
    {
      label: "Active Cases",
      value: stats?.activeCases ?? 0,
      icon: Briefcase,
    },
    {
      label: "Pending Review",
      value: stats?.pendingReview ?? 0,
      icon: ClipboardList,
    },
    {
      label: "Drafts in Progress",
      value: stats?.draftsInProgress ?? 0,
      icon: FileText,
    },
    {
      label: "Unassigned",
      value: stats?.unassigned ?? 0,
      icon: UserX,
    },
  ]

  return (
    <div className="space-y-8">
      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {s.label}
              </CardTitle>
              <s.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent cases */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent Cases</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/cases">
              View All Cases <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>

        {cases.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              <p>No cases yet. Cases appear here once applicants submit their intake.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cases.map((c) => (
              <CaseCard
                key={c.id}
                data={c}
                currentUserId={userId}
                onAssign={handleAssign}
                assigning={assigning}
              />
            ))}
          </div>
        )}
      </div>

      {/* Dashboard assistant */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Assistant</h2>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPrefillText("Summarize my pending cases")}
          >
            Summarize pending
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPrefillText("Which cases need attention?")}
          >
            Cases needing attention
          </Button>
        </div>
        <DashboardChat prefillText={prefillText} />
      </div>
    </div>
  )
}
