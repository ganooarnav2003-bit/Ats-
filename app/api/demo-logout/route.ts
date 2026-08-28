import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { DEMO_COOKIE } from "@/lib/auth/config";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  cookieStore.delete(DEMO_COOKIE);
  return NextResponse.redirect(new URL("/demo-login", request.url), { status: 303 });
}
