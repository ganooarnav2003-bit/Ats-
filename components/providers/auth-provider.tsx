"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { isDemoAuth } from "@/lib/auth/config";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  if (isDemoAuth()) return children;
  return <ClerkProvider>{children}</ClerkProvider>;
}
