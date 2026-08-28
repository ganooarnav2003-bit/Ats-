import { Badge, reviewStatusTone } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { Employee, Review, ReviewCycle } from "@/lib/types";

export function CompletionReport({
  cycle,
  employees,
  reviews,
  goalReady,
}: {
  cycle: ReviewCycle;
  employees: Employee[];
  reviews: Review[];
  goalReady: Record<string, { submitted: boolean; approved: boolean }>;
}) {
  const active = employees.filter((e) => e.is_active && e.role !== "hr_admin");
  const departments = Array.from(new Set(active.map((e) => e.department || "Unassigned"))).sort();

  function stats(list: Employee[]) {
    const submittedGoals = list.filter((e) => goalReady[e.id]?.submitted).length;
    const approvedGoals = list.filter((e) => goalReady[e.id]?.approved).length;
    const selfDone = list.filter((e) => {
      const status = reviews.find((r) => r.employee_id === e.id)?.status;
      return status && status !== "not_started";
    }).length;
    const completed = list.filter(
      (e) => reviews.find((r) => r.employee_id === e.id)?.status === "completed",
    ).length;
    return { submittedGoals, approvedGoals, selfDone, completed, total: list.length };
  }

  const company = stats(active);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-stone-500">{cycle.name}</p>
        <h1 className="text-2xl font-semibold text-stone-900">Cycle completion</h1>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Headcount in cycle" value={company.total} />
        <Stat label="Goals submitted" value={`${company.submittedGoals}/${company.total}`} />
        <Stat label="Goals approved" value={`${company.approvedGoals}/${company.total}`} />
        <Stat label="Reviews completed" value={`${company.completed}/${company.total}`} />
      </div>
      {departments.map((dept) => {
        const members = active.filter((e) => (e.department || "Unassigned") === dept);
        const s = stats(members);
        const pct = s.total ? Math.round((s.completed / s.total) * 100) : 0;
        return (
          <Card key={dept} className="p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-stone-900">{dept}</h2>
              <span className="text-sm tabular-nums text-stone-500">{pct}% complete</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-stone-100">
              <div className="h-full bg-teal-800" style={{ width: `${pct}%` }} />
            </div>
            <ul className="mt-4 divide-y divide-stone-100">
              {members.map((member) => {
                const review = reviews.find((r) => r.employee_id === member.id);
                const goals = goalReady[member.id];
                return (
                  <li key={member.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                    <span className="font-medium text-stone-800">{member.full_name}</span>
                    <span className="flex flex-wrap gap-2">
                      <Badge tone={goals?.approved ? "success" : goals?.submitted ? "info" : "neutral"}>
                        {goals?.approved ? "Goals approved" : goals?.submitted ? "Goals submitted" : "Goals pending"}
                      </Badge>
                      <Badge tone={reviewStatusTone(review?.status ?? "not_started")}>
                        {(review?.status ?? "not_started").replaceAll("_", " ")}
                      </Badge>
                    </span>
                  </li>
                );
              })}
            </ul>
          </Card>
        );
      })}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="p-4">
      <p className="text-xs uppercase tracking-wide text-stone-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-stone-900">{value}</p>
    </Card>
  );
}
