import { notFound, redirect } from "next/navigation";
import { TeamGoalReview } from "@/components/goals/team-goal-review";
import { assertCanViewEmployee, getCurrentEmployee } from "@/lib/auth/session";
import { getRepository } from "@/lib/data";

export default async function TeamGoalsPage({
  params,
}: {
  params: Promise<{ employeeId: string }>;
}) {
  const { employeeId } = await params;
  const me = await getCurrentEmployee();
  if (!me) redirect("/demo-login");
  try {
    await assertCanViewEmployee(me, employeeId);
  } catch {
    notFound();
  }
  if (employeeId === me.id && me.role !== "hr_admin") notFound();
  const repo = getRepository();
  const employee = await repo.getEmployeeById(employeeId);
  if (!employee) notFound();
  const cycle = await repo.getOpenCycle();
  const goals = cycle ? await repo.listGoals(employeeId, cycle.id) : [];
  return <TeamGoalReview employee={employee} goals={goals} />;
}
