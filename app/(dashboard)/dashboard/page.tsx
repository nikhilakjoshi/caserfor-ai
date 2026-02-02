"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useRole } from "@/components/role-provider"
import { LawyerDashboard } from "@/components/lawyer/lawyer-dashboard"
import { Loader2 } from "lucide-react"

export default function LawyerDashboardPage() {
  const { role } = useRole()
  const router = useRouter()

  const isLawyer = role === "lawyer" || role === "admin"

  useEffect(() => {
    if (role && !isLawyer) {
      router.replace("/assistant")
    }
  }, [role, isLawyer, router])

  if (!role) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!isLawyer) {
    return null
  }

  return <LawyerDashboard />
}
