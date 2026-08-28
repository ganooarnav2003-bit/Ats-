import { redirect } from "next/navigation";
import { GoalWorkspace } from "@/components/goals/goal-workspace";
import { EmptyState } from "@/components/ui/empty-state";
import { getCurrentEmployee } from "@/lib/auth/session";
import { getRepository } from "@/lib/data";

export default async function GoalsPage() {
  const me = await getCurrentEmployee();
  if (!me) redirect("/demo-login");
  const repo = getRepository();
  const cycle = await repo.getOpenCycle();
  if (!cycle) {
    return (
      <EmptyState
        title="No open cycle"
        body="HR must open a review cycle before you can set goals. Closed cycles remain visible in past reviews only."
      />
    );
  }
  const goals = await repo.listGoals(me.id, cycle.id);
  return <GoalWorkspace goals={goals} cycleName={cycle.name} readOnly={false} />;
}
