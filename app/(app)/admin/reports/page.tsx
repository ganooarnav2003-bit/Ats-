import { redirect } from "next/navigation";
import { CompletionReport } from "@/components/admin/completion-report";
import { EmptyState } from "@/components/ui/empty-state";
import { getCurrentEmployee, isHr } from "@/lib/auth/session";
import { getRepository } from "@/lib/data";

export default async function AdminReportsPage() {
  const me = await getCurrentEmployee();
  if (!me) redirect("/demo-login");
  if (!isHr(me)) redirect("/");
  const repo = getRepository();
  const cycle = await repo.getOpenCycle();
  if (!cycle) {
    return <EmptyState title="No open cycle" body="Open a cycle to see live completion across departments." />;
  }
  const employees = await repo.listEmployees();
  const reviews = await repo.listReviewsForCycle(cycle.id);
  const goalReady: Record<string, { submitted: boolean; approved: boolean }> = {};
  await Promise.all(
    employees.map(async (employee) => {
      const goals = await repo.listGoals(employee.id, cycle.id);
      const submitted =
        goals.length > 0 &&
        goals.every((g) => g.status === "submitted" || g.status === "approved");
      const approved = goals.length > 0 && goals.every((g) => g.status === "approved");
      goalReady[employee.id] = { submitted, approved };
    }),
  );
  return <CompletionReport cycle={cycle} employees={employees} reviews={reviews} goalReady={goalReady} />;
}
