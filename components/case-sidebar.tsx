"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, useSearchParams } from "next/navigation"
import {
  Bot,
  ChevronRight,
  Clock,
  FileText,
  FolderOpen,
  LayoutDashboard,
  Search,
  Users,
} from "lucide-react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar"

const DRAFT_TYPES = [
  { slug: "petition_letter", label: "Petition Letter" },
  { slug: "personal_statement", label: "Personal Statement" },
  { slug: "recommendation_letter", label: "Rec Letters" },
  { slug: "cover_letter", label: "Cover Letter" },
  { slug: "exhibit_list", label: "Exhibit List" },
  { slug: "table_of_contents", label: "Table of Contents" },
  { slug: "rfe_response", label: "RFE Response" },
]

type TabValue = "overview" | "documents" | "recommenders" | "gap-analysis" | "timeline" | "assistant" | "drafts"

const NAV_ITEMS: { title: string; tab: TabValue; icon: React.ComponentType }[] = [
  { title: "Overview", tab: "overview", icon: LayoutDashboard },
  { title: "Documents", tab: "documents", icon: FolderOpen },
  { title: "Recommenders", tab: "recommenders", icon: Users },
  { title: "Gap Analysis", tab: "gap-analysis", icon: Search },
  { title: "Timeline", tab: "timeline", icon: Clock },
  { title: "Assistant", tab: "assistant", icon: Bot },
]

export function CaseSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const params = useParams()
  const searchParams = useSearchParams()
  const clientId = params.clientId as string
  const base = `/cases/${clientId}`
  const activeTab = searchParams.get("tab") || "overview"

  const [draftsOpen, setDraftsOpen] = React.useState(
    activeTab === "drafts"
  )

  return (
    <Sidebar side="left" collapsible="none" className="border-r" {...props}>
      <SidebarHeader className="p-4">
        <span className="text-sm font-semibold">
          Case
        </span>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => {
                const isActive = activeTab === item.tab
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                      <Link href={`${base}?tab=${item.tab}`}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}

              {/* Drafts collapsible */}
              <Collapsible
                open={draftsOpen}
                onOpenChange={setDraftsOpen}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      isActive={activeTab === "drafts"}
                      tooltip="Drafts"
                    >
                      <FileText />
                      <span>Drafts</span>
                      <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          asChild
                          isActive={activeTab === "drafts" && !searchParams.get("type")}
                        >
                          <Link href={`${base}?tab=drafts`}>All Drafts</Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      {DRAFT_TYPES.map((dt) => (
                        <SidebarMenuSubItem key={dt.slug}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={activeTab === "drafts" && searchParams.get("type") === dt.slug}
                          >
                            <Link href={`${base}?tab=drafts&type=${dt.slug}`}>
                              <span className="truncate">{dt.label}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
