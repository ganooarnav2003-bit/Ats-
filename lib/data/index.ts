import "server-only";
import { hasSupabase } from "@/lib/auth/config";
import { DemoRepository } from "@/lib/data/demo-repo";
import type { PmsRepository } from "@/lib/data/repository";
import { SupabaseRepository } from "@/lib/data/supabase-repo";

let cached: PmsRepository | null = null;

export function getRepository(): PmsRepository {
  if (cached) return cached;
  cached = hasSupabase() ? new SupabaseRepository() : new DemoRepository();
  return cached;
}
