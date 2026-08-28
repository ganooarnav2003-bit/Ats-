import type { SessionUser } from "@/lib/types";

export function canManagePeople(user: SessionUser) {
  return user.role === "manager" || user.role === "hr_admin" || user.directReportCount > 0;
}

export function isHr(user: SessionUser) {
  return user.role === "hr_admin";
}
