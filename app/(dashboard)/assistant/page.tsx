import { PageHeader } from "@/components/page-header"

export default function AssistantPage() {
  return (
    <>
      <PageHeader title="Assistant" />
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <h2 className="text-2xl font-bold">Legal Workflow Assistant</h2>
        <p className="text-muted-foreground">Ask anything. Type @ to add sources.</p>
      </div>
    </>
  )
}
