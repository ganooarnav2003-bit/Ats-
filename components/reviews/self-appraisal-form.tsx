"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, inputClass } from "@/components/ui/card";
import { RATING_LABELS, type Goal, type GoalRating, type Review } from "@/lib/types";
import { submitSelfAppraisalAction } from "@/lib/actions/reviews";
import { weightedAverage } from "@/lib/utils";

export function SelfAppraisalForm({
  goals,
  ratings,
  review,
}: {
  goals: Goal[];
  ratings: GoalRating[];
  review: Review | null;
}) {
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, { rating: number | null; comment: string }>>(() => {
    const map: Record<string, { rating: number | null; comment: string }> = {};
    for (const goal of goals) {
      const existing = ratings.find((r) => r.goal_id === goal.id);
      map[goal.id] = {
        rating: existing?.self_rating ?? null,
        comment: existing?.self_comment ?? "",
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

  const locked = Boolean(
    review && review.status !== "not_started",
  );

  return (
    <form
      className="space-y-5"
      action={async (formData) => {
        setError(null);
        try {
          await submitSelfAppraisalAction(formData);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Could not submit appraisal");
        }
      }}
    >
      {error ? <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p> : null}
      {goals.map((goal) => (
        <Card key={goal.id} className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold text-stone-900">{goal.title}</h2>
              <p className="text-sm text-stone-500">{goal.weightage}% of cycle</p>
            </div>
          </div>
          <p className="mt-2 text-sm text-stone-600">{goal.description}</p>
          <fieldset className="mt-4" disabled={locked}>
            <legend className="text-sm font-medium text-stone-800">Self rating</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5].map((score) => (
                <label
                  key={score}
                  className={`cursor-pointer rounded-md border px-3 py-1.5 text-sm ${
                    draft[goal.id]?.rating === score
                      ? "border-teal-800 bg-teal-50 text-teal-900"
                      : "border-stone-200 bg-white"
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
                  {score} · {RATING_LABELS[score]}
                </label>
              ))}
            </div>
            <textarea
              name={`comment-${goal.id}`}
              required
              disabled={locked}
              rows={3}
              className={`${inputClass} mt-3`}
              placeholder="What evidence supports this rating?"
              defaultValue={draft[goal.id]?.comment}
              onChange={(event) =>
                setDraft((prev) => ({
                  ...prev,
                  [goal.id]: { ...prev[goal.id], comment: event.target.value },
                }))
              }
            />
          </fieldset>
        </Card>
      ))}
      <div className="flex flex-col gap-3 rounded-xl border border-stone-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-stone-700">
          Weighted self score:{" "}
          <span className="font-semibold tabular-nums">{overall ?? "—"}</span>
        </p>
        <Button disabled={locked}>{locked ? "Already submitted" : "Submit self-appraisal"}</Button>
      </div>
    </form>
  );
}
