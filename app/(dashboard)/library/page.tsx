import { PageHeader } from "@/components/page-header"

export default function LibraryPage() {
  return (
    <>
      <PageHeader title="Library" />
      <div className="flex flex-col gap-4">
        <p className="text-muted-foreground">Access prompts and examples</p>
      </div>
    </>
  )
}
