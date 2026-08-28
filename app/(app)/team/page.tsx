import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, reviewStatusTone } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { getCurrentEmployee } from "@/lib/auth/session";
import { canManagePeople } from "@/lib/auth/session-client";
import { getRepository } from "@/lib/data";

export default async function TeamPage() {
  const me = await getCurrentEmployee();
  if (!me) redirect("/demo-login");
  if (!canManagePeople(me)) redirect("/");
  const repo = getRepository();
  const reports = await repo.listDirectReports(me.id);
  const cycle = await repo.getOpenCycle();

  if (!reports.length) {
    return (
      <EmptyState
        title="No direct reports"
        body="HR assigns reporting lines from the directory. Once people report to you, their goals and reviews appear here."
      />
    );
  }

  const rows = await Promise.all(
    reports.map(async (report) => {
      const goals = cycle ? await repo.listGoals(report.id, cycle.id) : [];
      const review = cycle ? await repo.getReview(report.id, cycle.id) : null;
      const submitted = goals.filter((g) => g.status === "submitted").length;
      const approved = goals.filter((g) => g.status === "approved").length;
      return { report, goals, review, submitted, approved };
    }),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-stone-900">My team</h1>
        <p className="text-sm text-stone-600">
          Direct reports only. URL guessing another employee id is rejected unless you are their manager or HR.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {rows.map(({ report, submitted, approved, goals, review }) => (
          <Card key={report.id} className="p-5">
            <h2 className="font-semibold text-stone-900">{report.full_name}</h2>
            <p className="text-sm text-stone-500">
              {report.designation} · {report.department}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge tone={submitted ? "info" : approved === goals.length && goals.length ? "success" : "neutral"}>
                {goals.length} goals · {submitted} to review
              </Badge>
              <Badge tone={reviewStatusTone(review?.status ?? "not_started")}>
                {(review?.status ?? "not_started").replaceAll("_", " ")}
              </Badge>
            </div>
            <div className="mt-4 flex flex-wrap gap-3 text-sm">
              <Link className="text-teal-800 hover:underline" href={`/team/goals/${report.id}`}>
                Review goals
              </Link>
              <Link className="text-teal-800 hover:underline" href={`/team/reviews/${report.id}`}>
                Split-view appraisal
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
