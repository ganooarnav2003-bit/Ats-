import { redirect } from "next/navigation";
import { SelfAppraisalForm } from "@/components/reviews/self-appraisal-form";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge, reviewStatusTone } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getCurrentEmployee } from "@/lib/auth/session";
import { getRepository } from "@/lib/data";

export default async function MyReviewPage() {
  const me = await getCurrentEmployee();
  if (!me) redirect("/demo-login");
  const repo = getRepository();
  const cycle = await repo.getOpenCycle();
  if (!cycle) {
    return <EmptyState title="No open cycle" body="Self-appraisal opens after HR starts a cycle and your manager approves goals." />;
  }
  const goals = (await repo.listGoals(me.id, cycle.id)).filter((g) => g.status === "approved");
  const review = await repo.getReview(me.id, cycle.id);
  const ratings = review ? await repo.listGoalRatings(review.id) : [];

  if (!goals.length) {
    return (
      <EmptyState
        title="Goals not approved yet"
        body="Submit SMART goals from My goals. Self-appraisal unlocks after your manager approves the pack."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-stone-500">{cycle.name}</p>
          <h1 className="text-2xl font-semibold text-stone-900">My self-appraisal</h1>
        </div>
        <Badge tone={reviewStatusTone(review?.status ?? "not_started")}>
          {(review?.status ?? "not_started").replaceAll("_", " ")}
        </Badge>
      </div>
      {review?.status === "completed" && review.manager_summary ? (
        <Card className="p-5">
          <p className="text-sm font-medium text-stone-800">Manager summary</p>
          <p className="mt-2 text-sm text-stone-700">{review.manager_summary}</p>
          <p className="mt-3 text-sm text-stone-500">
            Overall manager rating: {review.overall_manager_rating ?? "—"}
          </p>
        </Card>
      ) : null}
      <SelfAppraisalForm goals={goals} ratings={ratings} review={review} />
    </div>
  );
}
