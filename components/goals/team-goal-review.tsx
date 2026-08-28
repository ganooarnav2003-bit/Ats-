"use client";

import { useState } from "react";
import { Badge, goalStatusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, inputClass } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { approveGoalAction, sendBackGoalAction } from "@/lib/actions/approvals";
import type { Employee, Goal } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { totalWeightage } from "@/lib/goals/weightage";

export function TeamGoalReview({
  employee,
  goals,
}: {
  employee: Employee;
  goals: Goal[];
}) {
  const [error, setError] = useState<string | null>(null);
  const sum = totalWeightage(goals.map((g) => g.weightage));

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-stone-500">Goal approval</p>
        <h1 className="text-2xl font-semibold text-stone-900">{employee.full_name}</h1>
        <p className="text-sm text-stone-600">
          {employee.designation} · Weightage total {sum}/100
        </p>
      </div>
      {error ? <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p> : null}
      {goals.length === 0 ? (
        <EmptyState title="No goals submitted" body="This person has not created goals for the open cycle yet." />
      ) : (
        goals.map((goal) => (
          <Card key={goal.id} className="space-y-3 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold text-stone-900">{goal.title}</h2>
                <p className="mt-1 text-sm text-stone-600">{goal.description}</p>
              </div>
              <Badge tone={goalStatusTone(goal.status)}>{goal.status.replace("_", " ")}</Badge>
            </div>
            <p className="text-sm text-stone-500">
              {goal.weightage}% · Target {formatDate(goal.target_date)}
            </p>
            {goal.status === "submitted" ? (
              <form
                className="space-y-3"
                action={async (formData) => {
                  setError(null);
                  const comment = String(formData.get("comment") ?? "");
                  const intent = String(formData.get("intent"));
                  try {
                    if (intent === "approve") await approveGoalAction(goal.id, comment || "Approved");
                    else await sendBackGoalAction(goal.id, comment);
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "Action failed");
                  }
                }}
              >
                <textarea
                  name="comment"
                  rows={2}
                  className={inputClass}
                  placeholder="Comment (required to send back)"
                />
                <div className="flex flex-wrap gap-2">
                  <Button name="intent" value="approve" size="sm">
                    Approve
                  </Button>
                  <Button name="intent" value="send_back" size="sm" variant="secondary">
                    Send back
                  </Button>
                </div>
              </form>
            ) : goal.manager_comment ? (
              <p className="text-sm text-stone-600">Your comment: {goal.manager_comment}</p>
            ) : null}
          </Card>
        ))
      )}
    </div>
  );
}
