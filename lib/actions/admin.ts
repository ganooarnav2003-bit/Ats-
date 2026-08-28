"use server";

import { revalidatePath } from "next/cache";
import { isHr, requireEmployee } from "@/lib/auth/session";
import { getRepository } from "@/lib/data";
import type { CycleStatus, Role } from "@/lib/types";

async function requireHr() {
  const me = await requireEmployee();
  if (!isHr(me)) throw new Error("FORBIDDEN");
  return me;
}

export async function saveEmployeeAction(formData: FormData) {
  await requireHr();
  const id = String(formData.get("id") ?? "").trim() || null;
  const full_name = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!full_name || !email) throw new Error("Name and email are required");
  const managerRaw = String(formData.get("manager_id") ?? "").trim();
  await getRepository().upsertEmployee(id, {
    full_name,
    email,
    designation: String(formData.get("designation") ?? "").trim() || null,
    department: String(formData.get("department") ?? "").trim() || null,
    date_of_joining: String(formData.get("date_of_joining") ?? "").trim() || null,
    manager_id: managerRaw || null,
    role: String(formData.get("role") ?? "employee") as Role,
    is_active: String(formData.get("is_active") ?? "true") === "true",
  });
  revalidatePath("/admin/employees");
  revalidatePath("/admin/reports");
}

export async function createCycleAction(formData: FormData) {
  const me = await requireHr();
  const name = String(formData.get("name") ?? "").trim();
  const start_date = String(formData.get("start_date") ?? "").trim();
  const end_date = String(formData.get("end_date") ?? "").trim();
  if (!name || !start_date || !end_date) throw new Error("Name and dates are required");
  if (end_date < start_date) throw new Error("End date must be on or after start date");
  await getRepository().createCycle({ name, start_date, end_date }, me.id);
  revalidatePath("/admin/cycles");
}

export async function setCycleStatusAction(id: string, status: CycleStatus) {
  await requireHr();
  await getRepository().setCycleStatus(id, status);
  revalidatePath("/admin/cycles");
  revalidatePath("/admin/reports");
  revalidatePath("/");
  revalidatePath("/goals");
}
