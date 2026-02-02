"use client"

import * as React from "react"

type UserRole = "applicant" | "lawyer" | "admin"

interface RoleContextValue {
  role: UserRole | null
  setRole: (role: UserRole) => void
  clientId: string | null
}

const RoleContext = React.createContext<RoleContextValue | undefined>(undefined)

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = React.useState<UserRole | null>(null)
  const [clientId, setClientId] = React.useState<string | null>(null)
  const [loaded, setLoaded] = React.useState(false)

  React.useEffect(() => {
    // Fetch role from session
    async function init() {
      try {
        const res = await fetch("/api/auth/session")
        if (res.ok) {
          const session = await res.json()
          if (session?.user) {
            const sessionRole = session.user.role as UserRole
            // Check for dev override
            if (process.env.NODE_ENV === "development") {
              const override = localStorage.getItem("dev-role-override")
              if (override && ["applicant", "lawyer", "admin"].includes(override)) {
                setRoleState(override as UserRole)
              } else {
                setRoleState(sessionRole)
              }
            } else {
              setRoleState(sessionRole)
            }
          }
        }
      } catch {
        // silent fail
      }

      // Fetch clientId for applicants
      try {
        const res = await fetch("/api/my-case")
        if (res.ok) {
          const data = await res.json()
          if (data?.id) {
            setClientId(data.id)
          }
        }
      } catch {
        // silent fail - not all users have a case
      }

      setLoaded(true)
    }
    init()
  }, [])

  const setRole = React.useCallback((newRole: UserRole) => {
    setRoleState(newRole)
    if (process.env.NODE_ENV === "development") {
      localStorage.setItem("dev-role-override", newRole)
    }
  }, [])

  if (!loaded) return null

  return (
    <RoleContext.Provider value={{ role, setRole, clientId }}>
      {children}
    </RoleContext.Provider>
  )
}

export function useRole() {
  const ctx = React.useContext(RoleContext)
  if (ctx === undefined) {
    throw new Error("useRole must be used within a RoleProvider")
  }
  return ctx
}
