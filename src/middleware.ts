/**
 * Next.js Middleware
 *
 * Protects routes based on authentication status and roles
 * Runs before every request
 */

import { auth } from "@/lib/auth/auth";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const userRole = req.auth?.user?.role;

  const isApiAuthRoute = nextUrl.pathname.startsWith("/api/auth");
  const isPublicRoute = nextUrl.pathname === "/" || nextUrl.pathname.startsWith("/auth");
  const isDashboard = nextUrl.pathname.startsWith("/dashboard");
  const isAdmin = nextUrl.pathname.startsWith("/admin");

  // Allow API auth routes
  if (isApiAuthRoute) {
    return;
  }

  // Redirect logged-in users away from auth pages
  if (isPublicRoute && isLoggedIn && !nextUrl.pathname.startsWith("/auth/signout")) {
    return Response.redirect(new URL("/dashboard", nextUrl));
  }

  // Protect dashboard routes
  if (isDashboard && !isLoggedIn) {
    const callbackUrl = encodeURIComponent(nextUrl.pathname + nextUrl.search);
    return Response.redirect(new URL(`/auth/signin?callbackUrl=${callbackUrl}`, nextUrl));
  }

  // Protect admin routes
  if (isAdmin) {
    if (!isLoggedIn) {
      return Response.redirect(new URL("/auth/signin", nextUrl));
    }
    if (userRole !== "ADMIN") {
      return Response.redirect(new URL("/dashboard", nextUrl));
    }
  }

  return;
});

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

