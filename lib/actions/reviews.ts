"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { assertCanViewEmployee, requireEmployee } from "@/lib/auth/session";
import { getRepository } from "@/lib/data";
import { notifyManagerOfAppraisal } from "@/lib/email/notify-manager";
import { weightedAverage } from "@/lib/utils";
import type { ManagerRatingInput, SelfRatingInput } from "@/lib/data/repository";

export async function submitSelfAppraisalAction(formData: FormData) {
  const me = await requireEmployee();
  const repo = getRepository();
  const cycle = await repo.getOpenCycle();
  if (!cycle) throw new Error("No open review cycle");
  if (!me.manager_id) throw new Error("You need a reporting manager before submitting an appraisal");

  const goals = await repo.listGoals(me.id, cycle.id);
  const approved = goals.filter((g) => g.status === "approved");
  if (!approved.length) throw new Error("Goals must be approved before self-appraisal");

  const ratings: SelfRatingInput[] = approved.map((goal) => {
    const self_rating = Number(formData.get(`rating-${goal.id}`));
    const self_comment = String(formData.get(`comment-${goal.id}`) ?? "").trim();
    if (![1, 2, 3, 4, 5].includes(self_rating)) {
      throw new Error(`Select a 1–5 rating for “${goal.title}”`);
    }
    if (!self_comment) throw new Error(`Add an achievement comment for “${goal.title}”`);
    return { goal_id: goal.id, self_rating, self_comment };
  });

  const overall =
    weightedAverage(
      approved.map((goal) => ({
        weightage: goal.weightage,
        rating: ratings.find((r) => r.goal_id === goal.id)?.self_rating ?? null,
      })),
    ) ?? 0;

  const review = await repo.ensureReview(me.id, me.manager_id, cycle.id);
  await repo.submitSelfAppraisal(review.id, ratings, overall);
  revalidatePath("/reviews/my-review");
  revalidatePath(`/team/reviews/${me.id}`);

  // Email is non-blocking: appraisal already persisted.
  const manager = me.manager;
  if (manager) {
    const headerList = await headers();
    const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
    const proto = headerList.get("x-forwarded-proto") ?? "http";
    const base = process.env.APP_BASE_URL ?? (host ? `${proto}://${host}` : "http://localhost:3000");
    void notifyManagerOfAppraisal({
      managerEmail: manager.email,
      managerName: manager.full_name,
      employeeName: me.full_name,
      cycleName: cycle.name,
      reviewUrl: `${base}/team/reviews/${me.id}`,
    }).catch((error) => {
      console.error("[self-appraisal] notify failed after successful write", error);
    });
  }

  return { ok: true as const, overall };
}

export async function submitManagerReviewAction(employeeId: string, formData: FormData) {
  const me = await requireEmployee();
  await assertCanViewEmployee(me, employeeId);
  const repo = getRepository();
  const cycle = await repo.getOpenCycle();
  if (!cycle) throw new Error("No open review cycle");
  const review = await repo.getReview(employeeId, cycle.id);
  if (!review) throw new Error("Self-appraisal has not been submitted");
  if (review.status === "not_started") throw new Error("Employee has not submitted yet");

  const goals = await repo.listGoals(employeeId, cycle.id);
  const approved = goals.filter((g) => g.status === "approved");
  const ratings: ManagerRatingInput[] = approved.map((goal) => {
    const manager_rating = Number(formData.get(`rating-${goal.id}`));
    const manager_comment = String(formData.get(`comment-${goal.id}`) ?? "").trim();
    if (![1, 2, 3, 4, 5].includes(manager_rating)) {
      throw new Error(`Select a manager rating for “${goal.title}”`);
    }
    if (!manager_comment) throw new Error(`Add manager feedback for “${goal.title}”`);
    return { goal_id: goal.id, manager_rating, manager_comment };
  });
  const summary = String(formData.get("manager_summary") ?? "").trim();
  if (!summary) throw new Error("Overall summary is required");
  const complete = String(formData.get("complete") ?? "") === "true";

  const overall =
    weightedAverage(
      approved.map((goal) => ({
        weightage: goal.weightage,
        rating: ratings.find((r) => r.goal_id === goal.id)?.manager_rating ?? null,
      })),
    ) ?? 0;

  await repo.submitManagerReview(review.id, ratings, overall, summary, complete);
  revalidatePath(`/team/reviews/${employeeId}`);
  revalidatePath("/team");
  revalidatePath("/reviews/my-review");
  revalidatePath("/admin/reports");
  return { ok: true as const, overall };
}
