"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, RefreshCw, Scale } from "lucide-react"
import { ReviewSummary } from "@/app/onboarding/_components/review-summary"

const APPROVAL_PROBABILITY: Record<string, string> = {
  strong: "~85%",
  moderate: "~60%",
  weak: "~30%",
  insufficient: "~10%",
}

const VERDICT_MESSAGING: Record<string, string> = {
  strong: "Your profile demonstrates strong alignment with EB1A criteria.",
  moderate: "Your profile shows promise but may benefit from additional evidence in key areas.",
  weak: "Your profile needs strengthening in several criteria before filing.",
  insufficient: "We recommend building more evidence before pursuing an EB1A petition.",
}

interface EligibilityReport {
  verdict: string
  summary: string
  criteria: Record<string, { score: number; analysis: string; evidence: string[] }>
}

export default function EvaluationPage() {
  const params = useParams<{ clientId: string }>()
  const searchParams = useSearchParams()
  const router = useRouter()
  const clientId = params.clientId

  const [report, setReport] = useState<EligibilityReport | null>(null)
  const [clientStatus, setClientStatus] = useState<string | null>(null)
  const [polling, setPolling] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const paymentParam = searchParams.get("payment")

  const fetchReport = useCallback(async () => {
    try {
      const res = await fetch(`/api/onboarding/${clientId}/report`)
      if (!res.ok) {
        if (res.status === 404) {
          setError("Client not found")
          setPolling(false)
          setLoading(false)
          return
        }
        throw new Error("Failed to fetch report")
      }
      const body = await res.json()
      setClientStatus(body.status)

      if (body.report) {
        setReport(body.report)
        setPolling(false)
      } else if (body.status === "reviewed" || body.status === "paid") {
        // Report should exist but didn't come back - stop polling
        setPolling(false)
      }
      setLoading(false)
    } catch {
      setError("Failed to load evaluation results")
      setPolling(false)
      setLoading(false)
    }
  }, [clientId])

  useEffect(() => {
    if (!polling) return
    const interval = setInterval(fetchReport, 4000)
    fetchReport()
    return () => clearInterval(interval)
  }, [polling, fetchReport])

  function handleRetry() {
    setError(null)
    setLoading(true)
    setPolling(true)
  }

  // Check payment status on mount - redirect if already paid
  useEffect(() => {
    async function checkPayment() {
      try {
        const res = await fetch(`/api/payments/status/${clientId}`)
        if (res.ok) {
          const data = await res.json()
          if (data.paid) {
            router.push("/assistant")
          }
        }
      } catch {
        // Ignore - non-critical check
      }
    }
    checkPayment()
  }, [clientId, router])

  async function handlePayment() {
    try {
      const res = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId }),
      })
      const data = await res.json()
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl
      }
    } catch {
      setError("Failed to initiate payment")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b h-14 flex items-center px-6">
          <Scale className="h-5 w-5 mr-2" />
          <span className="font-semibold text-sm">Eligibility Evaluation</span>
        </header>
        <main className="flex justify-center py-16">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading evaluation...</p>
          </div>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b h-14 flex items-center px-6">
          <Scale className="h-5 w-5 mr-2" />
          <span className="font-semibold text-sm">Eligibility Evaluation</span>
        </header>
        <main className="flex justify-center py-16 px-4">
          <div className="w-full max-w-lg text-center space-y-4">
            <p className="text-sm text-red-600 bg-red-50 p-4 rounded">{error}</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={handleRetry} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
              <Button
                onClick={() => window.location.href = "mailto:support@casefor.ai"}
                variant="ghost"
                size="sm"
              >
                Contact Support
              </Button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Still processing - show polling state
  if (!report && (clientStatus === "under_review" || clientStatus === "submitted")) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b h-14 flex items-center px-6">
          <Scale className="h-5 w-5 mr-2" />
          <span className="font-semibold text-sm">Eligibility Evaluation</span>
        </header>
        <main className="flex justify-center py-16">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Evaluating your eligibility...</p>
            <p className="text-xs text-muted-foreground">This may take a few moments</p>
          </div>
        </main>
      </div>
    )
  }

  // Report ready
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b h-14 flex items-center px-6">
        <Scale className="h-5 w-5 mr-2" />
        <span className="font-semibold text-sm">Eligibility Evaluation</span>
      </header>
      <main className="flex justify-center py-8 px-4">
        <div className="w-full max-w-3xl space-y-8">
          {paymentParam === "cancelled" && (
            <div className="bg-yellow-50 text-yellow-800 text-sm p-3 rounded">
              Payment was cancelled. You can try again below.
            </div>
          )}

          {report && (
            <>
              {/* Approval probability */}
              <div className="text-center space-y-3">
                <h1 className="text-xl font-semibold">Your EB1A Eligibility Assessment</h1>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-sm text-muted-foreground">Estimated approval probability:</span>
                  <Badge variant="outline" className="text-lg px-3 py-1 font-semibold">
                    {APPROVAL_PROBABILITY[report.verdict] || "N/A"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  {VERDICT_MESSAGING[report.verdict]}
                </p>
              </div>

              {/* Full report */}
              <ReviewSummary report={report} />

              {/* Payment CTA */}
              <div className="border-t pt-8 text-center space-y-4">
                <h2 className="text-lg font-semibold">Ready to proceed?</h2>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Get full access to our AI-powered legal assistant to build your EB1A petition.
                </p>
                <Button onClick={handlePayment} size="lg">
                  Continue to Payment
                </Button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
