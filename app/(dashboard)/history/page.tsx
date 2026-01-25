import { PageHeader } from "@/components/page-header"

export default function HistoryPage() {
  return (
    <>
      <PageHeader title="History" />
      <div className="flex flex-col gap-4">
        <p className="text-muted-foreground">View your query history</p>
      </div>
    </>
  )
}
