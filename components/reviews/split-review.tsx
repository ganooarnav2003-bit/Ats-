"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, inputClass } from "@/components/ui/card";
import { RATING_LABELS, type Goal, type GoalRating, type Review } from "@/lib/types";
import { submitManagerReviewAction } from "@/lib/actions/reviews";
import { weightedAverage } from "@/lib/utils";

export function SplitReview({
  employeeId,
  employeeName,
  goals,
  ratings,
  review,
}: {
  employeeId: string;
  employeeName: string;
  goals: Goal[];
  ratings: GoalRating[];
  review: Review;
}) {
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, { rating: number | null; comment: string }>>(() => {
    const map: Record<string, { rating: number | null; comment: string }> = {};
    for (const goal of goals) {
      const existing = ratings.find((r) => r.goal_id === goal.id);
      map[goal.id] = {
        rating: existing?.manager_rating ?? null,
        comment: existing?.manager_comment ?? "",
      };
    }
    return map;
  });

  const overall = useMemo(
    () =>
      weightedAverage(
        goals.map((goal) => ({
          weightage: goal.weightage,
          rating: draft[goal.id]?.rating ?? null,
        })),
      ),
    [goals, draft],
  );

  const locked = review.status === "completed";

  return (
    <form
      className="space-y-6"
      action={async (formData) => {
        setError(null);
        try {
          await submitManagerReviewAction(employeeId, formData);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Could not save review");
        }
      }}
    >
      <div>
        <p className="text-sm text-stone-500">Manager appraisal</p>
        <h1 className="text-2xl font-semibold text-stone-900">{employeeName}</h1>
        <p className="text-sm text-stone-600">
          Employee input is on the left. Your ratings stay on the right and are not visible until you submit.
        </p>
      </div>
      {error ? <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p> : null}

      {goals.map((goal) => {
        const self = ratings.find((r) => r.goal_id === goal.id);
        return (
          <Card key={goal.id} className="overflow-hidden">
            <div className="border-b border-stone-100 px-5 py-3">
              <h2 className="font-semibold text-stone-900">{goal.title}</h2>
              <p className="text-xs text-stone-500">{goal.weightage}% · {goal.description}</p>
            </div>
            <div className="grid md:grid-cols-2">
              <section className="border-b border-stone-100 p-5 md:border-b-0 md:border-r">
                <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Employee</p>
                <p className="mt-2 text-lg font-semibold tabular-nums text-stone-900">
                  {self?.self_rating ?? "—"}{" "}
                  <span className="text-sm font-normal text-stone-500">
                    {self?.self_rating ? RATING_LABELS[self.self_rating] : ""}
                  </span>
                </p>
                <p className="mt-2 text-sm text-stone-700">{self?.self_comment || "No comment"}</p>
              </section>
              <section className="p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-teal-800">Manager</p>
                <fieldset className="mt-3" disabled={locked}>
                  <div className="flex flex-wrap gap-2">
                    {[1, 2, 3, 4, 5].map((score) => (
                      <label
                        key={score}
                        className={`cursor-pointer rounded-md border px-2.5 py-1 text-xs ${
                          draft[goal.id]?.rating === score
                            ? "border-teal-800 bg-teal-50"
                            : "border-stone-200"
                        }`}
                      >
                        <input
                          className="sr-only"
                          type="radio"
                          name={`rating-${goal.id}`}
                          value={score}
                          required
                          defaultChecked={draft[goal.id]?.rating === score}
                          onChange={() =>
                            setDraft((prev) => ({
                              ...prev,
                              [goal.id]: { ...prev[goal.id], rating: score },
                            }))
                          }
                        />
                        {score}
                      </label>
                    ))}
                  </div>
                  <textarea
                    name={`comment-${goal.id}`}
                    required
                    rows={4}
                    disabled={locked}
                    className={`${inputClass} mt-3`}
                    placeholder="Manager feedback"
                    defaultValue={draft[goal.id]?.comment}
                    onChange={(event) =>
                      setDraft((prev) => ({
                        ...prev,
                        [goal.id]: { ...prev[goal.id], comment: event.target.value },
                      }))
                    }
                  />
                </fieldset>
              </section>
            </div>
          </Card>
        );
      })}

      <Card className="space-y-3 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm">
            Weighted manager score: <span className="font-semibold tabular-nums">{overall ?? "—"}</span>
            {review.overall_self_rating != null ? (
              <span className="ml-3 text-stone-500">Self: {review.overall_self_rating}</span>
            ) : null}
          </p>
        </div>
        <textarea
          name="manager_summary"
          required
          disabled={locked}
          rows={4}
          className={inputClass}
          placeholder="Overall summary for the cycle"
          defaultValue={review.manager_summary ?? ""}
        />
        <div className="flex flex-wrap gap-2">
          <Button name="complete" value="false" disabled={locked} variant="secondary">
            Save as manager reviewed
          </Button>
          <Button name="complete" value="true" disabled={locked}>
            Complete review
          </Button>
        </div>
      </Card>
    </form>
  );
}
