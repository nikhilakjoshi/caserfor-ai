"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, usePathname } from "next/navigation"
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

export function CaseSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const params = useParams()
  const pathname = usePathname()
  const clientId = params.clientId as string
  const base = `/cases/${clientId}`

  const [draftsOpen, setDraftsOpen] = React.useState(
    pathname.includes("/drafts")
  )

  const navItems = [
    { title: "Overview", url: base, icon: LayoutDashboard, exact: true },
    { title: "Documents", url: `${base}/vault`, icon: FolderOpen },
    { title: "Recommenders", url: `${base}/recommenders`, icon: Users },
    { title: "Gap Analysis", url: `${base}/gap-analysis`, icon: Search },
    { title: "Timeline", url: `${base}/timeline`, icon: Clock },
    { title: "Assistant", url: `${base}/assistant`, icon: Bot },
  ]

  return (
    <Sidebar side="right" collapsible="icon" {...props}>
      <SidebarHeader className="p-4">
        <span className="text-sm font-semibold group-data-[collapsible=icon]:hidden">
          Case
        </span>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = item.exact
                  ? pathname === item.url
                  : pathname === item.url || pathname.startsWith(item.url + "/")
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                      <Link href={item.url}>
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
                      isActive={pathname.includes(`${base}/drafts`)}
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
                          isActive={pathname === `${base}/drafts`}
                        >
                          <Link href={`${base}/drafts`}>All Drafts</Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      {DRAFT_TYPES.map((dt) => {
                        const href = `${base}/drafts?type=${dt.slug}`
                        return (
                          <SidebarMenuSubItem key={dt.slug}>
                            <SidebarMenuSubButton asChild>
                              <Link href={href}>
                                <span className="truncate">{dt.label}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        )
                      })}
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
