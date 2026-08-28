import { SignUp } from "@clerk/nextjs";
import { isDemoAuth } from "@/lib/auth/config";
import { redirect } from "next/navigation";

export default function SignUpPage() {
  if (isDemoAuth()) redirect("/demo-login");
  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-100 p-6">
      <SignUp />
    </div>
  );
}
