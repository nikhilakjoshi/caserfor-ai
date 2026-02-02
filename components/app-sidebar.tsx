"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BookOpen,
  Bot,
  Briefcase,
  ChevronRight,
  Database,
  FolderOpen,
  HelpCircle,
  History,
  MessageSquare,
  Plus,
  Settings,
  Workflow,
} from "lucide-react"
import { useRole } from "@/components/role-provider"

import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
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

interface Vault {
  id: string
  name: string
  type: "knowledge_base" | "sandbox"
  fileCount: number
}

const navItemsTopStatic = [
  { title: "Assistant", url: "/assistant", icon: MessageSquare },
]

const navItemsBottom = [
  { title: "Agents", url: "/agents", icon: Bot },
  { title: "Workflows", url: "/workflows", icon: Workflow },
  { title: "History", url: "/history", icon: History },
  { title: "Library", url: "/library", icon: BookOpen },
]

const footerItems = [
  { title: "Settings", url: "/settings", icon: Settings },
  { title: "Help", url: "/help", icon: HelpCircle },
]

const MAX_SIDEBAR_VAULTS = 10

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const { clientId } = useRole()
  const [vaults, setVaults] = React.useState<Vault[]>([])
  const [vaultsOpen, setVaultsOpen] = React.useState(false)

  const myCaseUrl = clientId ? `/cases/${clientId}` : "/my-case"
  const navItemsTop = [
    ...navItemsTopStatic,
    { title: "My Case", url: myCaseUrl, icon: Briefcase },
  ]

  React.useEffect(() => {
    async function fetchVaults() {
      try {
        const res = await fetch("/api/vaults?sortBy=recent")
        if (res.ok) {
          const data = await res.json()
          setVaults(data.slice(0, MAX_SIDEBAR_VAULTS))
        }
      } catch {
        // Silently fail - vaults section will just be empty
      }
    }
    fetchVaults()
  }, [])

  const isVaultActive = pathname === "/vault" || pathname.startsWith("/vault/")

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="p-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="w-full justify-start gap-2">
              <Plus className="h-4 w-4" />
              <span className="group-data-[collapsible=icon]:hidden">Create</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuItem asChild>
              <Link href="/vault/new">New Vault</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/assistant">New Query</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItemsTop.map((item) => {
                const isActive = item.title === "My Case"
                  ? pathname.startsWith("/cases/") || pathname === "/my-case"
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

              {/* Vault section with collapsible sub-items */}
              <Collapsible
                open={vaultsOpen}
                onOpenChange={setVaultsOpen}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton isActive={isVaultActive} tooltip="Vault">
                      <FolderOpen />
                      <span>Vault</span>
                      <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          asChild
                          isActive={pathname === "/vault"}
                        >
                          <Link href="/vault">All Vaults</Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      {vaults.map((vault) => {
                        const vaultPath = `/vault/${vault.id}`
                        const isActive = pathname === vaultPath
                        return (
                          <SidebarMenuSubItem key={vault.id}>
                            <SidebarMenuSubButton asChild isActive={isActive}>
                              <Link href={vaultPath} className="flex items-center gap-2">
                                {vault.type === "knowledge_base" ? (
                                  <Database className="h-3 w-3 shrink-0" />
                                ) : (
                                  <FolderOpen className="h-3 w-3 shrink-0" />
                                )}
                                <span className="truncate">{vault.name}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        )
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              {navItemsBottom.map((item) => {
                const isActive = pathname === item.url || pathname.startsWith(item.url + "/")
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
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          {footerItems.map((item) => {
            const isActive = pathname === item.url
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
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
