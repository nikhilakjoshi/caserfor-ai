import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import Stripe from "stripe"
import { getUser } from "@/lib/get-user"

function getBaseUrl(req: NextRequest): string {
  const host = req.headers.get("host") || "localhost:3000"
  const protocol = host.startsWith("localhost") ? "http" : "https"
  return `${protocol}://${host}`
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { clientId } = await req.json()

    if (!clientId) {
      return NextResponse.json({ error: "clientId is required" }, { status: 400 })
    }

    const client = await prisma.client.findFirst({
      where: { id: clientId, userId: user.id },
    })

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    if (client.paidAt) {
      return NextResponse.json({ error: "Already paid", redirectUrl: "/assistant" }, { status: 400 })
    }

    const baseUrl = getBaseUrl(req)
    const enableStripe = process.env.ENABLE_STRIPE === "true"

    // Bypass Stripe - immediately mark as paid
    if (!enableStripe) {
      await prisma.client.update({
        where: { id: clientId },
        data: {
          status: "paid",
          paidAt: new Date(),
        },
      })
      return NextResponse.json({
        redirectUrl: `${baseUrl}/payment/success?clientId=${clientId}`,
      })
    }

    // Stripe checkout
    const stripeKey = process.env.STRIPE_SECRET_KEY
    if (!stripeKey) {
      return NextResponse.json({ error: "Stripe not configured" }, { status: 500 })
    }

    const stripe = new Stripe(stripeKey)

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/payment/success?clientId=${clientId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/evaluation/${clientId}?payment=cancelled`,
      metadata: { clientId },
    })

    // Store session ID on client
    await prisma.client.update({
      where: { id: clientId },
      data: { stripeSessionId: session.id },
    })

    return NextResponse.json({ redirectUrl: session.url })
  } catch (error) {
    console.error("Checkout error:", error)
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 })
  }
}
