"use client"

import * as React from "react"
import { useCallback, useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CaseCard, type CaseData } from "@/components/lawyer/case-card"
import { AlertCircle, Loader2, RefreshCw } from "lucide-react"

interface Pagination {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export default function LawyerDashboardPage() {
  const [tab, setTab] = useState("all")
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [page, setPage] = useState(1)
  const [cases, setCases] = useState<CaseData[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [assigningId, setAssigningId] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState("")

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(t)
  }, [search])

  // Reset page on tab/search change
  useEffect(() => {
    setPage(1)
  }, [tab, debouncedSearch])

  // Fetch current user id
  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((d) => {
        if (d?.user?.id) setCurrentUserId(d.user.id)
      })
      .catch(() => {})
  }, [])

  const fetchCases = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ tab, page: String(page) })
      if (debouncedSearch) params.set("search", debouncedSearch)
      const res = await fetch(`/api/lawyer/cases?${params}`)
      if (!res.ok) throw new Error("Failed to fetch cases")
      const data = await res.json()
      setCases(data.cases)
      setPagination(data.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch cases")
    } finally {
      setLoading(false)
    }
  }, [tab, page, debouncedSearch])

  useEffect(() => {
    fetchCases()
  }, [fetchCases])

  const handleAssign = async (clientId: string) => {
    setAssigningId(clientId)
    // Optimistic update
    setCases((prev) =>
      prev.map((c) =>
        c.id === clientId
          ? {
              ...c,
              assignedTo: [
                ...c.assignedTo,
                { lawyerId: currentUserId, lawyerName: "You" },
              ],
            }
          : c
      )
    )
    try {
      const res = await fetch(`/api/lawyer/cases/${clientId}/assign`, {
        method: "POST",
      })
      if (!res.ok) {
        // Revert optimistic update
        setCases((prev) =>
          prev.map((c) =>
            c.id === clientId
              ? {
                  ...c,
                  assignedTo: c.assignedTo.filter(
                    (a) => a.lawyerId !== currentUserId
                  ),
                }
              : c
          )
        )
      }
    } catch {
      // Revert on error
      setCases((prev) =>
        prev.map((c) =>
          c.id === clientId
            ? {
                ...c,
                assignedTo: c.assignedTo.filter(
                  (a) => a.lawyerId !== currentUserId
                ),
              }
            : c
        )
      )
    } finally {
      setAssigningId(null)
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Cases</h1>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="all">All Cases</TabsTrigger>
            <TabsTrigger value="mine">My Cases</TabsTrigger>
            <TabsTrigger value="unassigned">Unassigned</TabsTrigger>
          </TabsList>
        </Tabs>
        <Input
          placeholder="Search cases..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-64"
        />
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {error && !loading && (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchCases}>
            <RefreshCw className="mr-1 h-3 w-3" />
            Retry
          </Button>
        </div>
      )}

      {!loading && !error && cases.length === 0 && (
        <div className="py-12 text-center text-sm text-muted-foreground">
          {tab === "mine"
            ? "No cases assigned to you yet."
            : tab === "unassigned"
              ? "No unassigned cases."
              : "No cases found."}
        </div>
      )}

      {!loading && !error && cases.length > 0 && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cases.map((c) => (
              <CaseCard
                key={c.id}
                data={c}
                currentUserId={currentUserId}
                onAssign={handleAssign}
                assigning={assigningId === c.id}
              />
            ))}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
