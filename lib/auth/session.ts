import "server-only";
import { unstable_noStore as noStore } from "next/cache";
import { cookies } from "next/headers";
import { DEMO_COOKIE, isClerkConfigured, isDemoAuth } from "@/lib/auth/config";
import { getRepository } from "@/lib/data";
import type { Employee, SessionUser } from "@/lib/types";

async function fromDemoCookie(): Promise<Employee | null> {
  const cookieStore = await cookies();
  const id = cookieStore.get(DEMO_COOKIE)?.value;
  if (!id) return null;
  return getRepository().getEmployeeById(id);
}

async function fromClerk(): Promise<Employee | null> {
  if (!isClerkConfigured()) return null;
  const { currentUser } = await import("@clerk/nextjs/server");
  const user = await currentUser();
  if (!user) return null;
  const email =
    user.primaryEmailAddress?.emailAddress ??
    user.emailAddresses[0]?.emailAddress;
  if (!email) return null;
  const repo = getRepository();
  const byClerk = await repo.getEmployeeByClerkId(user.id);
  if (byClerk) return byClerk;
  const byEmail = await repo.getEmployeeByEmail(email);
  if (byEmail) {
    await repo.stampClerkUserId(byEmail.id, user.id);
    return { ...byEmail, clerk_user_id: user.id };
  }
  return null;
}

export async function getCurrentEmployee(): Promise<SessionUser | null> {
  noStore();
  const employee = isDemoAuth() ? await fromDemoCookie() : await fromClerk();
  if (!employee || !employee.is_active) return null;
  const repo = getRepository();
  const [manager, reports] = await Promise.all([
    employee.manager_id ? repo.getEmployeeById(employee.manager_id) : Promise.resolve(null),
    repo.listDirectReports(employee.id),
  ]);
  return {
    ...employee,
    manager,
    directReportCount: reports.length,
  };
}

export async function requireEmployee(): Promise<SessionUser> {
  const employee = await getCurrentEmployee();
  if (!employee) {
    throw new Error("UNAUTHENTICATED");
  }
  return employee;
}

export function canManagePeople(user: SessionUser) {
  return user.role === "manager" || user.role === "hr_admin" || user.directReportCount > 0;
}

export function isHr(user: SessionUser) {
  return user.role === "hr_admin";
}

export async function assertCanViewEmployee(actor: SessionUser, targetId: string) {
  if (actor.id === targetId || isHr(actor)) return;
  const target = await getRepository().getEmployeeById(targetId);
  if (target?.manager_id === actor.id) return;
  throw new Error("FORBIDDEN");
}

export function canEditOwnGoals(status: string) {
  return status === "draft" || status === "sent_back";
}
