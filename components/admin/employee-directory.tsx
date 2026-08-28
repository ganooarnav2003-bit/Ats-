"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, Field, inputClass } from "@/components/ui/card";
import { saveEmployeeAction } from "@/lib/actions/admin";
import type { Employee, Role } from "@/lib/types";
import { ROLE_LABELS } from "@/lib/types";

export function EmployeeDirectory({ employees }: { employees: Employee[] }) {
  const [editing, setEditing] = useState<Employee | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Employee directory</h1>
          <p className="text-sm text-stone-600">
            Reporting lines are a self-referencing manager_id. A manager is an employee with direct reports.
          </p>
        </div>
        <Button type="button" onClick={() => { setCreating(true); setEditing(null); }}>
          Add employee
        </Button>
      </div>
      {error ? <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p> : null}
      {(creating || editing) && (
        <EmployeeForm
          employees={employees}
          initial={editing}
          onCancel={() => {
            setCreating(false);
            setEditing(null);
          }}
          onError={setError}
        />
      )}
      <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Department</th>
              <th className="px-4 py-3 font-medium">Manager</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {employees.map((employee) => {
              const manager = employees.find((e) => e.id === employee.manager_id);
              return (
                <tr key={employee.id} className="border-b border-stone-100 last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium text-stone-900">{employee.full_name}</p>
                    <p className="text-xs text-stone-500">{employee.email}</p>
                  </td>
                  <td className="px-4 py-3 text-stone-600">{employee.department ?? "—"}</td>
                  <td className="px-4 py-3 text-stone-600">{manager?.full_name ?? "—"}</td>
                  <td className="px-4 py-3">{ROLE_LABELS[employee.role]}</td>
                  <td className="px-4 py-3">
                    <Badge tone={employee.is_active ? "success" : "neutral"}>
                      {employee.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditing(employee);
                        setCreating(false);
                      }}
                    >
                      Edit
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EmployeeForm({
  employees,
  initial,
  onCancel,
  onError,
}: {
  employees: Employee[];
  initial: Employee | null;
  onCancel: () => void;
  onError: (message: string | null) => void;
}) {
  return (
    <Card className="p-5">
      <h2 className="font-semibold text-stone-900">{initial ? "Edit employee" : "New employee"}</h2>
      <form
        className="mt-4 grid gap-4 sm:grid-cols-2"
        action={async (formData) => {
          onError(null);
          try {
            await saveEmployeeAction(formData);
            onCancel();
          } catch (err) {
            onError(err instanceof Error ? err.message : "Save failed");
          }
        }}
      >
        <input type="hidden" name="id" value={initial?.id ?? ""} />
        <Field label="Full name">
          <input name="full_name" required defaultValue={initial?.full_name} className={inputClass} />
        </Field>
        <Field label="Work email">
          <input name="email" type="email" required defaultValue={initial?.email} className={inputClass} />
        </Field>
        <Field label="Designation">
          <input name="designation" defaultValue={initial?.designation ?? ""} className={inputClass} />
        </Field>
        <Field label="Department">
          <input name="department" defaultValue={initial?.department ?? ""} className={inputClass} />
        </Field>
        <Field label="Date of joining">
          <input name="date_of_joining" type="date" defaultValue={initial?.date_of_joining ?? ""} className={inputClass} />
        </Field>
        <Field label="Reports to">
          <select name="manager_id" defaultValue={initial?.manager_id ?? ""} className={inputClass}>
            <option value="">No manager</option>
            {employees
              .filter((e) => e.id !== initial?.id)
              .map((e) => (
                <option key={e.id} value={e.id}>
                  {e.full_name}
                </option>
              ))}
          </select>
        </Field>
        <Field label="Role">
          <select name="role" defaultValue={initial?.role ?? "employee"} className={inputClass}>
            {(["employee", "manager", "hr_admin"] as Role[]).map((role) => (
              <option key={role} value={role}>
                {ROLE_LABELS[role]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Active">
          <select name="is_active" defaultValue={initial?.is_active === false ? "false" : "true"} className={inputClass}>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </Field>
        <div className="flex gap-2 sm:col-span-2">
          <Button>Save</Button>
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
