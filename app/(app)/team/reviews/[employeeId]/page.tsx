import { notFound, redirect } from "next/navigation";
import { SplitReview } from "@/components/reviews/split-review";
import { EmptyState } from "@/components/ui/empty-state";
import { assertCanViewEmployee, getCurrentEmployee } from "@/lib/auth/session";
import { getRepository } from "@/lib/data";

export default async function TeamReviewPage({
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
  const repo = getRepository();
  const employee = await repo.getEmployeeById(employeeId);
  if (!employee) notFound();
  const cycle = await repo.getOpenCycle();
  if (!cycle) {
    return <EmptyState title="No open cycle" body="There is no active review cycle." />;
  }
  const review = await repo.getReview(employeeId, cycle.id);
  if (!review || review.status === "not_started") {
    return (
      <EmptyState
        title="Self-appraisal not submitted"
        body={`${employee.full_name} has not submitted a self-appraisal for ${cycle.name} yet.`}
      />
    );
  }
  const goals = (await repo.listGoals(employeeId, cycle.id)).filter((g) => g.status === "approved");
  const ratings = await repo.listGoalRatings(review.id);
  return (
    <SplitReview
      employeeId={employee.id}
      employeeName={employee.full_name}
      goals={goals}
      ratings={ratings}
      review={review}
    />
  );
}
