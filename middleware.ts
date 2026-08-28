import { NextResponse } from "next/server";
import type { NextFetchEvent, NextRequest } from "next/server";
import { DEMO_COOKIE, isClerkConfigured, isDemoAuth } from "@/lib/auth/config";

const PUBLIC_PATHS = ["/sign-in", "/sign-up", "/demo-login", "/api/demo-login"];

function isPublic(pathname: string) {
  if (PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    return true;
  }
  if (pathname.startsWith("/api/sign-out") || pathname.startsWith("/api/demo-logout")) {
    return true;
  }
  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon")) return true;
  return false;
}

export default async function middleware(req: NextRequest, event: NextFetchEvent) {
  const { pathname } = req.nextUrl;
  if (isPublic(pathname)) return NextResponse.next();

  if (isDemoAuth()) {
    const session = req.cookies.get(DEMO_COOKIE)?.value;
    if (!session) {
      const url = req.nextUrl.clone();
      url.pathname = "/demo-login";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (!isClerkConfigured()) {
    const url = req.nextUrl.clone();
    url.pathname = "/demo-login";
    return NextResponse.redirect(url);
  }

  const { clerkMiddleware, createRouteMatcher } = await import("@clerk/nextjs/server");
  const isProtected = createRouteMatcher(["/(.*)"]);
  return clerkMiddleware(async (auth, request) => {
    if (!isPublic(request.nextUrl.pathname) && isProtected(request)) {
      await auth.protect();
    }
  })(req, event);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
