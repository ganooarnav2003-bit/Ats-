import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { DEMO_COOKIE, isClerkConfigured, isDemoAuth } from "@/lib/auth/config";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  cookieStore.delete(DEMO_COOKIE);

  if (!isDemoAuth() && isClerkConfigured()) {
    const clerk = await import("@clerk/nextjs/server");
    const { sessionId } = await clerk.auth();
    if (sessionId) {
      const client = await clerk.clerkClient();
      await client.sessions.revokeSession(sessionId);
    }
  }

  const dest = isDemoAuth() ? "/demo-login" : "/sign-in";
  return NextResponse.redirect(new URL(dest, request.url), { status: 303 });
}
