"use client"

import { useState, useEffect, useCallback } from "react"
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
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
  Loader2,
  AlertCircle,
  MoreVertical,
  Pencil,
  Trash2,
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

const sortOptions = [
  { value: "recent", label: "Recently viewed" },
  { value: "name", label: "Name" },
  { value: "created", label: "Date created" },
]

export default function VaultPage() {
  const [vaults, setVaults] = useState<Vault[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("recent")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newVaultName, setNewVaultName] = useState("")
  const [newVaultDescription, setNewVaultDescription] = useState("")
  const [newVaultType, setNewVaultType] = useState<VaultType>("knowledge_base")
  const [isCreating, setIsCreating] = useState(false)

  // Edit vault state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingVault, setEditingVault] = useState<Vault | null>(null)
  const [editVaultName, setEditVaultName] = useState("")
  const [editVaultDescription, setEditVaultDescription] = useState("")
  const [isEditing, setIsEditing] = useState(false)

  // Delete vault state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingVault, setDeletingVault] = useState<Vault | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchVaults = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const params = new URLSearchParams()
      if (searchQuery) params.set("search", searchQuery)
      params.set("sortBy", sortBy)

      const res = await fetch(`/api/vaults?${params.toString()}`)
      if (!res.ok) {
        throw new Error("Failed to fetch vaults")
      }
      const data = await res.json()
      setVaults(data)
    } catch (err) {
      console.error("Failed to fetch vaults:", err)
      setError("Failed to load vaults. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }, [searchQuery, sortBy])

  useEffect(() => {
    fetchVaults()
  }, [fetchVaults])

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

    try {
      const res = await fetch("/api/vaults", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newVaultName,
          description: newVaultDescription || null,
          type: newVaultType,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to create vault")
      }

      const newVault = await res.json()
      setVaults([newVault, ...vaults])
      setNewVaultName("")
      setNewVaultDescription("")
      setNewVaultType("knowledge_base")
      setIsCreateDialogOpen(false)
    } catch (err) {
      console.error("Failed to create vault:", err)
      setError(err instanceof Error ? err.message : "Failed to create vault")
    } finally {
      setIsCreating(false)
    }
  }

  const handleOpenEditDialog = (vault: Vault, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setEditingVault(vault)
    setEditVaultName(vault.name)
    setEditVaultDescription(vault.description || "")
    setIsEditDialogOpen(true)
  }

  const handleEditVault = async () => {
    if (!editingVault || !editVaultName.trim()) return

    setIsEditing(true)

    try {
      const res = await fetch(`/api/vaults/${editingVault.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editVaultName,
          description: editVaultDescription || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to update vault")
      }

      const updatedVault = await res.json()
      setVaults(vaults.map((v) => (v.id === updatedVault.id ? updatedVault : v)))
      setIsEditDialogOpen(false)
      setEditingVault(null)
    } catch (err) {
      console.error("Failed to update vault:", err)
      setError(err instanceof Error ? err.message : "Failed to update vault")
    } finally {
      setIsEditing(false)
    }
  }

  const handleOpenDeleteDialog = (vault: Vault, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDeletingVault(vault)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteVault = async () => {
    if (!deletingVault) return

    setIsDeleting(true)

    try {
      const res = await fetch(`/api/vaults/${deletingVault.id}`, {
        method: "DELETE",
      })

      if (!res.ok && res.status !== 204) {
        const data = await res.json()
        throw new Error(data.error || "Failed to delete vault")
      }

      setVaults(vaults.filter((v) => v.id !== deletingVault.id))
      setIsDeleteDialogOpen(false)
      setDeletingVault(null)
    } catch (err) {
      console.error("Failed to delete vault:", err)
      setError(err instanceof Error ? err.message : "Failed to delete vault")
    } finally {
      setIsDeleting(false)
    }
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

        {/* Error state */}
        {error && (
          <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            {error}
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto h-auto py-1 text-destructive hover:text-destructive"
              onClick={() => {
                setError(null)
                fetchVaults()
              }}
            >
              Retry
            </Button>
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">Loading vaults...</p>
          </div>
        )}

        {/* Vault Grid */}
        {!isLoading && (
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
                          <div className="flex items-center gap-1">
                            <span className="rounded-full bg-muted px-2 py-0.5 text-xs capitalize text-muted-foreground">
                              {vault.type.replace("_", " ")}
                            </span>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={(e) => e.preventDefault()}
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={(e) => handleOpenEditDialog(vault, e)}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={(e) => handleOpenDeleteDialog(vault, e)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
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
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={(e) => e.preventDefault()}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => handleOpenEditDialog(vault, e)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={(e) => handleOpenDeleteDialog(vault, e)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  )}
                </Card>
              </Link>
            )
          })}
        </div>
        )}

        {!isLoading && sortedVaults.length === 0 && searchQuery && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Search className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-medium">No vaults found</h3>
            <p className="text-sm text-muted-foreground">
              No vaults match &quot;{searchQuery}&quot;
            </p>
          </div>
        )}
      </div>

      {/* Edit Vault Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit vault</DialogTitle>
            <DialogDescription>
              Update the vault name and description.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                placeholder="e.g., M&A Due Diligence"
                value={editVaultName}
                onChange={(e) => setEditVaultName(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description (optional)</Label>
              <Textarea
                id="edit-description"
                placeholder="What does this vault contain?"
                value={editVaultDescription}
                onChange={(e) => setEditVaultDescription(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditVault}
              disabled={!editVaultName.trim() || isEditing}
            >
              {isEditing ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Vault Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete vault?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{deletingVault?.name}&quot; and all
              its documents. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteVault}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete vault"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
