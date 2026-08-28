import { redirect } from "next/navigation";
import { CycleManager } from "@/components/admin/cycle-manager";
import { getCurrentEmployee, isHr } from "@/lib/auth/session";
import { getRepository } from "@/lib/data";

export default async function AdminCyclesPage() {
  const me = await getCurrentEmployee();
  if (!me) redirect("/demo-login");
  if (!isHr(me)) redirect("/");
  const cycles = await getRepository().listCycles();
  return <CycleManager cycles={cycles} />;
}
