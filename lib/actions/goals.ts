"use server";

import { revalidatePath } from "next/cache";
import { getRepository } from "@/lib/data";
import { canEditOwnGoals, requireEmployee } from "@/lib/auth/session";
import { canSubmitGoals } from "@/lib/goals/weightage";
import type { GoalInput } from "@/lib/data/repository";

function parseGoal(formData: FormData): GoalInput {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const weightage = Number(formData.get("weightage"));
  const target_date = String(formData.get("target_date") ?? "").trim() || null;
  if (!title) throw new Error("Title is required");
  if (!Number.isInteger(weightage) || weightage < 0 || weightage > 100) {
    throw new Error("Weightage must be an integer between 0 and 100");
  }
  return { title, description, weightage, target_date };
}

export async function createGoalAction(formData: FormData) {
  const me = await requireEmployee();
  const repo = getRepository();
  const cycle = await repo.getOpenCycle();
  if (!cycle) throw new Error("No open review cycle");
  const goal = await repo.createGoal(me.id, cycle.id, parseGoal(formData));
  revalidatePath("/goals");
  return goal;
}

export async function updateGoalAction(goalId: string, formData: FormData) {
  const me = await requireEmployee();
  const repo = getRepository();
  const goal = await repo.getGoal(goalId);
  if (!goal || goal.employee_id !== me.id) throw new Error("FORBIDDEN");
  if (!canEditOwnGoals(goal.status)) throw new Error("Approved or submitted goals cannot be edited");
  const updated = await repo.updateGoal(goalId, parseGoal(formData));
  revalidatePath("/goals");
  return updated;
}

export async function deleteGoalAction(goalId: string) {
  const me = await requireEmployee();
  const repo = getRepository();
  const goal = await repo.getGoal(goalId);
  if (!goal || goal.employee_id !== me.id) throw new Error("FORBIDDEN");
  if (!canEditOwnGoals(goal.status)) throw new Error("Only draft or sent-back goals can be deleted");
  await repo.deleteGoal(goalId);
  revalidatePath("/goals");
}

export async function submitGoalsAction() {
  const me = await requireEmployee();
  const repo = getRepository();
  const cycle = await repo.getOpenCycle();
  if (!cycle) throw new Error("No open review cycle");
  const goals = await repo.listGoals(me.id, cycle.id);
  if (!canSubmitGoals(goals.map((g) => g.weightage))) {
    throw new Error("Total weightage must equal 100 before submission");
  }
  await repo.submitAllGoals(me.id, cycle.id);
  revalidatePath("/goals");
  revalidatePath("/team");
}
