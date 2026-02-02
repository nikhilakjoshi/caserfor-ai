"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { CaseSidebar } from "@/components/case-sidebar"
import { LawyerSidebar } from "@/components/lawyer-sidebar"
import { DevRoleToggle } from "@/components/dev-role-toggle"
import { useRole } from "@/components/role-provider"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

export default function CasesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { role } = useRole()

  const isLawyer = role === "lawyer" || role === "admin"

  return (
    <SidebarProvider>
      {isLawyer ? <LawyerSidebar collapsible="icon" /> : <AppSidebar />}
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <div id="page-header" />
          <div className="ml-auto">
            <DevRoleToggle />
          </div>
        </header>
        <main className="flex-1 p-4">
          {children}
        </main>
      </SidebarInset>
      {isLawyer && <CaseSidebar />}
    </SidebarProvider>
  )
}
