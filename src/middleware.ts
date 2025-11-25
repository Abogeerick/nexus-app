/**
 * Next.js Middleware (Edge-Compatible)
 *
 * Minimal middleware for Edge Functions - authentication handled by NextAuth
 * This middleware only handles basic route protection to keep bundle size small
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { nextUrl } = request;
  const pathname = nextUrl.pathname;

  // Check for any NextAuth session cookie (v5 uses various cookie names)
  const hasSession = 
    request.cookies.has("authjs.session-token") ||
    request.cookies.has("__Secure-authjs.session-token") ||
    request.cookies.has("next-auth.session-token") ||
    request.cookies.has("__Secure-next-auth.session-token");

  const isApiAuthRoute = pathname.startsWith("/api/auth");
  const isDashboard = pathname.startsWith("/dashboard");
  const isAdmin = pathname.startsWith("/admin");
  
  // Always allow API auth routes
  if (isApiAuthRoute) {
    return NextResponse.next();
  }

  // Protect dashboard and admin routes - redirect to signin if no session
  // Note: Full auth check happens in page components and API routes
  if ((isDashboard || isAdmin) && !hasSession) {
    const callbackUrl = encodeURIComponent(pathname + nextUrl.search);
    return NextResponse.redirect(new URL(`/auth/signin?callbackUrl=${callbackUrl}`, nextUrl));
  }

  return NextResponse.next();
}

// Configure which routes the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

