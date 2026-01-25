import { PageHeader } from "@/components/page-header"

export default function VaultPage() {
  return (
    <>
      <PageHeader title="Vault" />
      <div className="flex flex-col gap-4">
        <p className="text-muted-foreground">Manage your document vaults</p>
      </div>
    </>
  )
}
