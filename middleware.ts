import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth

  // Public routes - no auth required
  if (
    pathname === "/" ||
    pathname === "/login" ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/payments/webhook") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next()
  }

  // Redirect unauthenticated users to login
  if (!session) {
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  const role = session.user.role

  // Onboarding routes: applicant only
  if (pathname.startsWith("/onboarding") && role !== "applicant" && role !== "admin") {
    return NextResponse.redirect(new URL("/", req.url))
  }

  // Evaluation routes: applicant only
  if (pathname.startsWith("/evaluation") && role !== "applicant" && role !== "admin") {
    return NextResponse.redirect(new URL("/", req.url))
  }

  // Lawyer routes: lawyer or admin only
  if (pathname.startsWith("/lawyer") && role !== "lawyer" && role !== "admin") {
    return NextResponse.redirect(new URL("/", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}
