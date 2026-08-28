"use client";

import { useState } from "react";
import { Badge, cycleStatusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, Field, inputClass } from "@/components/ui/card";
import { createCycleAction, setCycleStatusAction } from "@/lib/actions/admin";
import type { CycleStatus, ReviewCycle } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export function CycleManager({ cycles }: { cycles: ReviewCycle[] }) {
  const [error, setError] = useState<string | null>(null);
  const open = cycles.find((c) => c.status === "open");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-stone-900">Review cycles</h1>
        <p className="text-sm text-stone-600">
          Draft → Open → Closed. Only one cycle can be open. Opening a second cycle is blocked until the current open cycle is closed.
        </p>
      </div>
      {error ? <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p> : null}

      <Card className="p-5">
        <h2 className="font-semibold">Create cycle</h2>
        <form
          className="mt-4 grid gap-4 sm:grid-cols-3"
          action={async (formData) => {
            setError(null);
            try {
              await createCycleAction(formData);
            } catch (err) {
              setError(err instanceof Error ? err.message : "Could not create cycle");
            }
          }}
        >
          <Field label="Name">
            <input name="name" required className={inputClass} placeholder="H2 FY2026" />
          </Field>
          <Field label="Start">
            <input name="start_date" type="date" required className={inputClass} />
          </Field>
          <Field label="End">
            <input name="end_date" type="date" required className={inputClass} />
          </Field>
          <div className="sm:col-span-3">
            <Button>Create as draft</Button>
          </div>
        </form>
      </Card>

      <div className="space-y-3">
        {cycles.map((cycle) => (
          <Card key={cycle.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-stone-900">{cycle.name}</h3>
                <Badge tone={cycleStatusTone(cycle.status)}>{cycle.status}</Badge>
              </div>
              <p className="text-sm text-stone-500">
                {formatDate(cycle.start_date)} – {formatDate(cycle.end_date)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {cycle.status === "draft" ? (
                <Button
                  type="button"
                  size="sm"
                  disabled={Boolean(open)}
                  onClick={() => runStatus(cycle.id, "open", setError)}
                >
                  Open
                </Button>
              ) : null}
              {cycle.status === "open" ? (
                <Button type="button" size="sm" variant="secondary" onClick={() => runStatus(cycle.id, "closed", setError)}>
                  Close
                </Button>
              ) : null}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

async function runStatus(
  id: string,
  status: CycleStatus,
  setError: (value: string | null) => void,
) {
  setError(null);
  try {
    await setCycleStatusAction(id, status);
  } catch (err) {
    setError(err instanceof Error ? err.message : "Could not update cycle");
  }
}
