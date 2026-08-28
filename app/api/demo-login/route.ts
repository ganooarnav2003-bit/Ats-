import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { DEMO_COOKIE, isDemoAuth } from "@/lib/auth/config";
import { getRepository } from "@/lib/data";

export async function POST(request: Request) {
  if (!isDemoAuth()) {
    return NextResponse.json({ error: "Demo auth is disabled" }, { status: 400 });
  }
  const form = await request.formData();
  const employeeId = String(form.get("employeeId") ?? "");
  const redirectTo = String(form.get("redirect") ?? "/") || "/";
  const employee = await getRepository().getEmployeeById(employeeId);
  if (!employee?.is_active) {
    return NextResponse.json({ error: "Unknown persona" }, { status: 400 });
  }
  const cookieStore = await cookies();
  cookieStore.set(DEMO_COOKIE, employee.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });
  return NextResponse.redirect(new URL(redirectTo, request.url), { status: 303 });
}
