import { Scale } from "lucide-react"

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b h-14 flex items-center px-6">
        <div className="flex items-center gap-2">
          <Scale className="h-5 w-5" />
          <span className="font-semibold text-sm">Client Intake</span>
        </div>
      </header>
      <main className="flex justify-center py-8 px-4">
        <div className="w-full max-w-4xl">{children}</div>
      </main>
    </div>
  )
}
