import { NextResponse } from "next/server";
import { getCurrentEmployee } from "@/lib/auth/session";
import { getRepository } from "@/lib/data";
import { notifyManagerOfAppraisal } from "@/lib/email/notify-manager";

export async function POST(request: Request) {
  const me = await getCurrentEmployee();
  if (!me) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  let body: { employeeId?: string; reviewUrl?: string } = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const repo = getRepository();
  const cycle = await repo.getOpenCycle();
  if (!cycle) {
    return NextResponse.json({ sent: false, error: "No open cycle" });
  }

  const employeeId = body.employeeId ?? me.id;
  const review = await repo.getReview(employeeId, cycle.id);
  if (!review || review.status === "not_started") {
    return NextResponse.json({ sent: false, error: "No submitted appraisal" });
  }

  const employee = await repo.getEmployeeById(employeeId);
  const manager = employee?.manager_id
    ? await repo.getEmployeeById(employee.manager_id)
    : null;
  if (!employee || !manager) {
    return NextResponse.json({ sent: false, error: "Manager not found" });
  }

  const result = await notifyManagerOfAppraisal({
    managerEmail: manager.email,
    managerName: manager.full_name,
    employeeName: employee.full_name,
    cycleName: cycle.name,
    reviewUrl: body.reviewUrl ?? `${process.env.APP_BASE_URL ?? ""}/team/reviews/${employee.id}`,
  });

  return NextResponse.json(result);
}
