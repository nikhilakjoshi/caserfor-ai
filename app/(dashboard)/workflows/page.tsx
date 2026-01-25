import { PageHeader } from "@/components/page-header"

export default function WorkflowsPage() {
  return (
    <>
      <PageHeader title="Workflows" />
      <div className="flex flex-col gap-4">
        <p className="text-muted-foreground">Browse and execute workflows</p>
      </div>
    </>
  )
}
