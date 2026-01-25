import { PageHeader } from "@/components/page-header"

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" />
      <div className="flex flex-col gap-4">
        <p className="text-muted-foreground">Configure your preferences</p>
      </div>
    </>
  )
}
