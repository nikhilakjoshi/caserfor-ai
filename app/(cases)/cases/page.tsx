"use client"

import { useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { LawyerSidebar } from "@/components/lawyer-sidebar"
import { DevRoleToggle } from "@/components/dev-role-toggle"
import { useRole } from "@/components/role-provider"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CaseTable } from "@/components/lawyer/case-table"

export default function CasesListPage() {
  const { role } = useRole()
  const isLawyer = role === "lawyer" || role === "admin"
  const [tab, setTab] = useState("all")

  return (
    <SidebarProvider>
      {isLawyer ? <LawyerSidebar /> : <AppSidebar />}
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <h1 className="text-lg font-semibold">Cases</h1>
          <div className="ml-auto">
            <DevRoleToggle />
          </div>
        </header>
        <main className="flex-1 p-4 space-y-4">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="mine">My Cases</TabsTrigger>
              <TabsTrigger value="unassigned">Unassigned</TabsTrigger>
            </TabsList>
          </Tabs>
          <CaseTable tab={tab} />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
