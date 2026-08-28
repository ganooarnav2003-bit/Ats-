import { redirect } from "next/navigation";
import { EmployeeDirectory } from "@/components/admin/employee-directory";
import { getCurrentEmployee, isHr } from "@/lib/auth/session";
import { getRepository } from "@/lib/data";

export default async function AdminEmployeesPage() {
  const me = await getCurrentEmployee();
  if (!me) redirect("/demo-login");
  if (!isHr(me)) redirect("/");
  const employees = await getRepository().listEmployees();
  return <EmployeeDirectory employees={employees} />;
}
