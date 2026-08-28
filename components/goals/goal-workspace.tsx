"use client";

import { useMemo, useState } from "react";
import { Badge, goalStatusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, Field, inputClass } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  createGoalAction,
  deleteGoalAction,
  submitGoalsAction,
  updateGoalAction,
} from "@/lib/actions/goals";
import { canSubmitGoals, remainingWeightage, totalWeightage } from "@/lib/goals/weightage";
import type { Goal } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export function GoalWorkspace({
  goals,
  cycleName,
  readOnly,
}: {
  goals: Goal[];
  cycleName: string;
  readOnly: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const sum = useMemo(() => totalWeightage(goals.map((g) => g.weightage)), [goals]);
  const remaining = remainingWeightage(goals.map((g) => g.weightage));
  const canSubmit = canSubmitGoals(goals.map((g) => g.weightage)) && !readOnly;
  const locked = goals.length > 0 && goals.every((g) => g.status === "submitted" || g.status === "approved");

  async function onCreate(formData: FormData) {
    setError(null);
    setPending(true);
    try {
      await createGoalAction(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save goal");
    } finally {
      setPending(false);
    }
  }

  async function onSubmitGoals() {
    setError(null);
    setPending(true);
    try {
      await submitGoalsAction();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit goals");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-stone-500">{cycleName}</p>
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900">Goal setting</h1>
          <p className="mt-1 max-w-2xl text-sm text-stone-600">
            Write SMART goals for this cycle. Weightages are integers 0–100 and must total exactly 100
            before you can submit to your manager.
          </p>
        </div>
        <div className="rounded-lg border border-stone-200 bg-white px-4 py-3 text-right">
          <p className="text-xs uppercase tracking-wide text-stone-500">Total weightage</p>
          <p className={`text-2xl font-semibold tabular-nums ${sum === 100 ? "text-emerald-700" : "text-amber-700"}`}>
            {sum}
            <span className="text-base font-normal text-stone-400"> / 100</span>
          </p>
          <p className="text-xs text-stone-500">
            {remaining === 0 ? "Ready to submit" : `${remaining} remaining`}
          </p>
        </div>
      </div>

      {error ? (
        <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p>
      ) : null}

      {goals.length === 0 ? (
        <EmptyState
          title="No goals yet"
          body="Add your first KRA for the open cycle. Aim for 3–5 goals that a manager can evidence."
        />
      ) : (
        <div className="space-y-4">
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} disabled={readOnly || locked && goal.status !== "sent_back"} />
          ))}
        </div>
      )}

      {!readOnly && !locked ? (
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-stone-900">Add a goal</h2>
          <form action={onCreate} className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Title">
                <input name="title" required className={inputClass} placeholder="Specific, measurable outcome" />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Description / KPI evidence">
                <textarea name="description" rows={3} className={inputClass} />
              </Field>
            </div>
            <Field label="Weightage (%)">
              <input name="weightage" type="number" min={0} max={100} required defaultValue={0} className={inputClass} />
            </Field>
            <Field label="Target date">
              <input name="target_date" type="date" className={inputClass} />
            </Field>
            <div className="sm:col-span-2">
              <Button disabled={pending}>{pending ? "Saving…" : "Save goal"}</Button>
            </div>
          </form>
        </Card>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" onClick={onSubmitGoals} disabled={!canSubmit || pending || locked}>
          Submit goals for approval
        </Button>
        {!canSubmit && !locked ? (
          <p className="text-sm text-stone-500">Submission unlocks when weightages sum to 100.</p>
        ) : null}
        {locked ? (
          <p className="text-sm text-stone-500">Goals are with your manager or already approved.</p>
        ) : null}
      </div>
    </div>
  );
}

function GoalCard({ goal, disabled }: { goal: Goal; disabled: boolean }) {
  const [editing, setEditing] = useState(false);
  const editable = !disabled && (goal.status === "draft" || goal.status === "sent_back");

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-stone-900">{goal.title}</h3>
          <p className="mt-1 text-sm text-stone-600">{goal.description || "No description"}</p>
        </div>
        <Badge tone={goalStatusTone(goal.status)}>{goal.status.replace("_", " ")}</Badge>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-stone-500">Weightage</dt>
          <dd className="font-medium tabular-nums">{goal.weightage}%</dd>
        </div>
        <div>
          <dt className="text-stone-500">Target</dt>
          <dd className="font-medium">{formatDate(goal.target_date)}</dd>
        </div>
      </dl>
      {goal.status === "sent_back" && goal.manager_comment ? (
        <div className="mt-4 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-900">
          <p className="font-medium">Manager feedback</p>
          <p className="mt-1">{goal.manager_comment}</p>
        </div>
      ) : null}
      {goal.status === "approved" && goal.manager_comment ? (
        <p className="mt-3 text-sm text-stone-600">Manager: {goal.manager_comment}</p>
      ) : null}

      {editable && editing ? (
        <form
          className="mt-4 grid gap-3 sm:grid-cols-2"
          action={async (formData) => {
            await updateGoalAction(goal.id, formData);
            setEditing(false);
          }}
        >
          <div className="sm:col-span-2">
            <input name="title" defaultValue={goal.title} className={inputClass} required />
          </div>
          <div className="sm:col-span-2">
            <textarea name="description" defaultValue={goal.description ?? ""} rows={3} className={inputClass} />
          </div>
          <input name="weightage" type="number" min={0} max={100} defaultValue={goal.weightage} className={inputClass} />
          <input name="target_date" type="date" defaultValue={goal.target_date ?? ""} className={inputClass} />
          <div className="flex gap-2 sm:col-span-2">
            <Button size="sm">Save changes</Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : null}

      {editable && !editing ? (
        <div className="mt-4 flex gap-2">
          <Button type="button" size="sm" variant="secondary" onClick={() => setEditing(true)}>
            Edit
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => deleteGoalAction(goal.id)}
          >
            Delete
          </Button>
        </div>
      ) : null}
    </Card>
  );
}
