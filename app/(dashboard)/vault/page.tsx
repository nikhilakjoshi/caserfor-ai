"use client"

import { useState } from "react"
import { PageHeader } from "@/components/page-header"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Plus,
  FolderOpen,
  Database,
  Users,
  Search,
  LayoutGrid,
  List,
  ChevronDown,
  FileText,
} from "lucide-react"
import Link from "next/link"

type VaultType = "knowledge_base" | "sandbox"

interface Vault {
  id: string
  name: string
  description: string | null
  type: VaultType
  isShared: boolean
  fileCount: number
  createdAt: string
  updatedAt: string
}

// Mock data - replace with API call
const mockVaults: Vault[] = [
  {
    id: "1",
    name: "M&A Deal Documents",
    description: "Due diligence materials for Project Apollo",
    type: "knowledge_base",
    isShared: true,
    fileCount: 234,
    createdAt: "2026-01-15",
    updatedAt: "2026-01-24",
  },
  {
    id: "2",
    name: "Contract Templates",
    description: "Standard agreement templates",
    type: "knowledge_base",
    isShared: false,
    fileCount: 45,
    createdAt: "2026-01-10",
    updatedAt: "2026-01-20",
  },
  {
    id: "3",
    name: "Quick Analysis",
    description: "Temporary documents for ad-hoc review",
    type: "sandbox",
    isShared: false,
    fileCount: 12,
    createdAt: "2026-01-22",
    updatedAt: "2026-01-25",
  },
]

const sortOptions = [
  { value: "recent", label: "Recently viewed" },
  { value: "name", label: "Name" },
  { value: "created", label: "Date created" },
]

export default function VaultPage() {
  const [vaults, setVaults] = useState<Vault[]>(mockVaults)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("recent")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newVaultName, setNewVaultName] = useState("")
  const [newVaultDescription, setNewVaultDescription] = useState("")
  const [newVaultType, setNewVaultType] = useState<VaultType>("knowledge_base")
  const [isCreating, setIsCreating] = useState(false)

  const filteredVaults = vaults.filter(
    (vault) =>
      vault.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vault.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const sortedVaults = [...filteredVaults].sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.name.localeCompare(b.name)
      case "created":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      case "recent":
      default:
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    }
  })

  const handleCreateVault = async () => {
    if (!newVaultName.trim()) return

    setIsCreating(true)

    // TODO: Replace with API call
    const newVault: Vault = {
      id: String(Date.now()),
      name: newVaultName,
      description: newVaultDescription || null,
      type: newVaultType,
      isShared: false,
      fileCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    setVaults([newVault, ...vaults])
    setNewVaultName("")
    setNewVaultDescription("")
    setNewVaultType("knowledge_base")
    setIsCreateDialogOpen(false)
    setIsCreating(false)
  }

  const getVaultIcon = (type: VaultType) => {
    return type === "knowledge_base" ? Database : FolderOpen
  }

  return (
    <>
      <PageHeader title="Vault" />

      <div className="flex flex-col gap-6">
        {/* Controls */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search vaults..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Sort by: {sortOptions.find((o) => o.value === sortBy)?.label}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {sortOptions.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    onClick={() => setSortBy(option.value)}
                  >
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex items-center rounded-md border">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="sm"
                className="rounded-r-none"
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="sm"
                className="rounded-l-none"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Vault Grid */}
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              : "flex flex-col gap-2"
          }
        >
          {/* New Vault Card */}
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Card
                className={`cursor-pointer border-dashed transition-colors hover:border-primary hover:bg-muted/50 ${
                  viewMode === "list" ? "flex-row items-center py-3" : ""
                }`}
              >
                <CardContent
                  className={`flex items-center justify-center ${
                    viewMode === "grid" ? "min-h-[120px]" : "py-0"
                  }`}
                >
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Plus className="h-8 w-8" />
                    <span className="text-sm font-medium">New vault</span>
                  </div>
                </CardContent>
              </Card>
            </DialogTrigger>

            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create new vault</DialogTitle>
                <DialogDescription>
                  Vaults store your documents for AI-powered analysis. Maximum
                  100,000 files per vault.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., M&A Due Diligence"
                    value={newVaultName}
                    onChange={(e) => setNewVaultName(e.target.value)}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="What will this vault contain?"
                    value={newVaultDescription}
                    onChange={(e) => setNewVaultDescription(e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={newVaultType}
                    onValueChange={(v) => setNewVaultType(v as VaultType)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="knowledge_base">
                        <div className="flex items-center gap-2">
                          <Database className="h-4 w-4" />
                          <span>Knowledge Base</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="sandbox">
                        <div className="flex items-center gap-2">
                          <FolderOpen className="h-4 w-4" />
                          <span>Sandbox</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Knowledge Base: Persistent, indexed for search. Sandbox:
                    Temporary, quick analysis.
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateVault}
                  disabled={!newVaultName.trim() || isCreating}
                >
                  {isCreating ? "Creating..." : "Create vault"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Vault Cards */}
          {sortedVaults.map((vault) => {
            const VaultIcon = getVaultIcon(vault.type)
            return (
              <Link key={vault.id} href={`/vault/${vault.id}`}>
                <Card
                  className={`cursor-pointer transition-colors hover:border-primary/50 hover:bg-muted/30 ${
                    viewMode === "list" ? "flex-row items-center py-3" : ""
                  }`}
                >
                  {viewMode === "grid" ? (
                    <>
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <div className="rounded-md bg-muted p-2">
                              <VaultIcon className="h-4 w-4" />
                            </div>
                            {vault.isShared && (
                              <span className="flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                <Users className="h-3 w-3" />
                                Shared
                              </span>
                            )}
                          </div>
                          <span className="rounded-full bg-muted px-2 py-0.5 text-xs capitalize text-muted-foreground">
                            {vault.type.replace("_", " ")}
                          </span>
                        </div>
                        <CardTitle className="mt-2 text-base">
                          {vault.name}
                        </CardTitle>
                        {vault.description && (
                          <CardDescription className="line-clamp-2">
                            {vault.description}
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <FileText className="h-3.5 w-3.5" />
                          <span>
                            {vault.fileCount}{" "}
                            {vault.fileCount === 1 ? "file" : "files"}
                          </span>
                        </div>
                      </CardContent>
                    </>
                  ) : (
                    <CardContent className="flex w-full items-center gap-4 py-0">
                      <div className="rounded-md bg-muted p-2">
                        <VaultIcon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">
                            {vault.name}
                          </span>
                          {vault.isShared && (
                            <span className="flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                              <Users className="h-3 w-3" />
                              Shared
                            </span>
                          )}
                        </div>
                        {vault.description && (
                          <p className="text-sm text-muted-foreground truncate">
                            {vault.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="capitalize">
                          {vault.type.replace("_", " ")}
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="h-3.5 w-3.5" />
                          {vault.fileCount}
                        </span>
                      </div>
                    </CardContent>
                  )}
                </Card>
              </Link>
            )
          })}
        </div>

        {sortedVaults.length === 0 && searchQuery && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Search className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-medium">No vaults found</h3>
            <p className="text-sm text-muted-foreground">
              No vaults match &quot;{searchQuery}&quot;
            </p>
          </div>
        )}
      </div>
    </>
  )
}
