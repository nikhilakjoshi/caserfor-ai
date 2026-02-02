"use client"

import { useRole } from "@/components/role-provider"
import { Badge } from "@/components/ui/badge"

const roles = ["applicant", "lawyer", "admin"] as const

export function DevRoleToggle() {
  const { role, setRole } = useRole()

  if (process.env.NODE_ENV !== "development") return null
  if (!role) return null

  const nextRole = () => {
    const idx = roles.indexOf(role as (typeof roles)[number])
    const next = roles[(idx + 1) % roles.length]
    setRole(next)
  }

  return (
    <Badge
      variant="outline"
      className="cursor-pointer select-none text-xs font-mono"
      onClick={nextRole}
    >
      DEV: {role}
    </Badge>
  )
}
