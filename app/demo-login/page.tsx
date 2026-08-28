import { DEMO_PERSONAS } from "@/lib/data/personas";
import { isDemoAuth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { getCurrentEmployee } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function DemoLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; reason?: string }>;
}) {
  const params = await searchParams;
  if (!isDemoAuth()) {
    redirect("/sign-in");
  }
  const existing = await getCurrentEmployee();
  if (existing && !params.reason) {
    redirect(params.redirect || "/");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-100 px-4">
      <div className="w-full max-w-lg rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        <p className="text-xs uppercase tracking-[0.2em] text-teal-800">Helios Consulting</p>
        <h1 className="mt-2 text-3xl text-stone-900">Apex Performance</h1>
        <p className="mt-3 text-sm text-stone-600">
          Demo directory login. In production this screen is replaced by Clerk email authentication;
          the same employee row is matched by email and the role + manager hierarchy attach to the
          session.
        </p>
        {params.reason === "unprovisioned" ? (
          <p className="mt-4 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Your login is not linked to the employee directory. Ask HR to add your work email.
          </p>
        ) : null}
        <form action="/api/demo-login" method="post" className="mt-6 space-y-4">
          <input type="hidden" name="redirect" value={params.redirect || "/"} />
          <label className="block text-sm font-medium text-stone-800">
            Sign in as
            <select
              name="employeeId"
              className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
              defaultValue={DEMO_PERSONAS[3].id}
            >
              {DEMO_PERSONAS.map((persona) => (
                <option key={persona.id} value={persona.id}>
                  {persona.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="w-full rounded-md bg-teal-800 px-4 py-2 text-sm font-medium text-white hover:bg-teal-900"
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  );
}
