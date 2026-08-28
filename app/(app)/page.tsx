import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, reviewStatusTone } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getCurrentEmployee } from "@/lib/auth/session";
import { canManagePeople, isHr } from "@/lib/auth/session-client";
import { getRepository } from "@/lib/data";

export default async function DashboardPage() {
  const me = await getCurrentEmployee();
  if (!me) redirect("/demo-login");
  const repo = getRepository();
  const cycle = await repo.getOpenCycle();
  const myGoals = cycle ? await repo.listGoals(me.id, cycle.id) : [];
  const myReview = cycle ? await repo.getReview(me.id, cycle.id) : null;
  const reports = canManagePeople(me) ? await repo.listDirectReports(me.id) : [];
  const employees = isHr(me) ? await repo.listEmployees() : [];
  const reviews = cycle && isHr(me) ? await repo.listReviewsForCycle(cycle.id) : [];

  const pendingApprovals = (
    await Promise.all(
      reports.map(async (report) => {
        const goals = cycle ? await repo.listGoals(report.id, cycle.id) : [];
        return { report, submitted: goals.filter((g) => g.status === "submitted").length };
      }),
    )
  ).filter((row) => row.submitted > 0);

  const pendingReviews = (
    await Promise.all(
      reports.map(async (report) => {
        const review = cycle ? await repo.getReview(report.id, cycle.id) : null;
        return { report, review };
      }),
    )
  ).filter((row) => row.review?.status === "self_appraisal_submitted");

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-stone-500">Welcome back</p>
        <h1 className="text-3xl text-stone-900">{me.full_name}</h1>
        <p className="mt-1 text-sm text-stone-600">
          {cycle ? `Open cycle: ${cycle.name}` : "HR has not opened a review cycle yet."}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="p-5">
          <p className="text-xs uppercase tracking-wide text-stone-500">My goals</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums">{myGoals.length}</p>
          <Link href="/goals" className="mt-3 inline-block text-sm text-teal-800 hover:underline">
            Manage goals
          </Link>
        </Card>
        <Card className="p-5">
          <p className="text-xs uppercase tracking-wide text-stone-500">My review</p>
          <div className="mt-2">
            <Badge tone={reviewStatusTone(myReview?.status ?? "not_started")}>
              {(myReview?.status ?? "not_started").replaceAll("_", " ")}
            </Badge>
          </div>
          <Link href="/reviews/my-review" className="mt-3 inline-block text-sm text-teal-800 hover:underline">
            Open self-appraisal
          </Link>
        </Card>
        {canManagePeople(me) ? (
          <Card className="p-5">
            <p className="text-xs uppercase tracking-wide text-stone-500">Direct reports</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums">{reports.length}</p>
            <Link href="/team" className="mt-3 inline-block text-sm text-teal-800 hover:underline">
              Team workspace
            </Link>
          </Card>
        ) : (
          <Card className="p-5">
            <p className="text-xs uppercase tracking-wide text-stone-500">Reporting manager</p>
            <p className="mt-2 font-semibold">{me.manager?.full_name ?? "Not assigned"}</p>
          </Card>
        )}
      </div>

      {canManagePeople(me) ? (
        <section className="grid gap-4 lg:grid-cols-2">
          <Card className="p-5">
            <h2 className="font-semibold">Goals awaiting approval</h2>
            {pendingApprovals.length === 0 ? (
              <p className="mt-2 text-sm text-stone-500">No submitted packs right now.</p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {pendingApprovals.map(({ report, submitted }) => (
                  <li key={report.id}>
                    <Link className="text-teal-800 hover:underline" href={`/team/goals/${report.id}`}>
                      {report.full_name}
                    </Link>
                    <span className="text-stone-500"> · {submitted} submitted</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card className="p-5">
            <h2 className="font-semibold">Appraisals to write</h2>
            {pendingReviews.length === 0 ? (
              <p className="mt-2 text-sm text-stone-500">No self-appraisals waiting.</p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {pendingReviews.map(({ report }) => (
                  <li key={report.id}>
                    <Link className="text-teal-800 hover:underline" href={`/team/reviews/${report.id}`}>
                      {report.full_name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </section>
      ) : null}

      {isHr(me) && cycle ? (
        <Card className="p-5">
          <h2 className="font-semibold">Company pulse</h2>
          <p className="mt-2 text-sm text-stone-600">
            {employees.filter((e) => e.is_active).length} active people · {reviews.filter((r) => r.status === "completed").length} reviews completed
          </p>
          <Link href="/admin/reports" className="mt-3 inline-block text-sm text-teal-800 hover:underline">
            Open completion report
          </Link>
        </Card>
      ) : null}
    </div>
  );
}
