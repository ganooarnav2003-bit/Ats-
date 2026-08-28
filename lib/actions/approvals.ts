"use server";

import { revalidatePath } from "next/cache";
import { assertCanViewEmployee, requireEmployee } from "@/lib/auth/session";
import { getRepository } from "@/lib/data";

export async function approveGoalAction(goalId: string, comment: string | null) {
  const me = await requireEmployee();
  const repo = getRepository();
  const goal = await repo.getGoal(goalId);
  if (!goal) throw new Error("Goal not found");
  await assertCanViewEmployee(me, goal.employee_id);
  if (goal.employee_id === me.id && me.role !== "hr_admin") {
    throw new Error("Managers cannot approve their own goals here");
  }
  if (goal.status !== "submitted") throw new Error("Only submitted goals can be approved");
  await repo.setGoalStatus(goalId, "approved", comment);
  revalidatePath(`/team/goals/${goal.employee_id}`);
  revalidatePath("/team");
}

export async function sendBackGoalAction(goalId: string, comment: string) {
  const me = await requireEmployee();
  const repo = getRepository();
  const goal = await repo.getGoal(goalId);
  if (!goal) throw new Error("Goal not found");
  await assertCanViewEmployee(me, goal.employee_id);
  if (!comment.trim()) throw new Error("A comment is required when sending goals back");
  if (goal.status !== "submitted") throw new Error("Only submitted goals can be sent back");
  await repo.setGoalStatus(goalId, "sent_back", comment.trim());
  revalidatePath(`/team/goals/${goal.employee_id}`);
  revalidatePath("/goals");
}
