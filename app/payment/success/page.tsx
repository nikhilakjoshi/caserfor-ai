"use client"

import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { CheckCircle2 } from "lucide-react"
import Link from "next/link"

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams()
  const clientId = searchParams.get("clientId")

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto" />
        <h1 className="text-2xl font-semibold">Payment Confirmed</h1>
        <p className="text-sm text-muted-foreground">
          Your payment has been processed successfully. You now have full access
          to the AI-powered legal assistant.
        </p>
        <Button asChild size="lg">
          <Link href="/assistant">Go to Assistant</Link>
        </Button>
        {clientId && (
          <p className="text-xs text-muted-foreground">
            Reference: {clientId}
          </p>
        )}
      </div>
    </div>
  )
}
