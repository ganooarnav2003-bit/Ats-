import type { Role } from "@/lib/types";

export const DEMO_IDS = {
  priya: "11111111-1111-1111-1111-111111111111",
  rajesh: "22222222-2222-2222-2222-222222222222",
  kavita: "33333333-3333-3333-3333-333333333333",
  ananya: "44444444-4444-4444-4444-444444444444",
  vikram: "55555555-5555-5555-5555-555555555555",
  meera: "66666666-6666-6666-6666-666666666666",
  cycleOpen: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  cycleClosed: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
} as const;

export const DEMO_PERSONAS: { id: string; label: string; role: Role }[] = [
  { id: DEMO_IDS.priya, label: "Priya Sharma — HR Admin", role: "hr_admin" },
  { id: DEMO_IDS.rajesh, label: "Rajesh Kumar — Manager (Delivery)", role: "manager" },
  { id: DEMO_IDS.kavita, label: "Kavita Nair — Manager (Analytics)", role: "manager" },
  { id: DEMO_IDS.ananya, label: "Ananya Iyer — Employee (goals submitted)", role: "employee" },
  { id: DEMO_IDS.vikram, label: "Vikram Shah — Employee (goals sent back)", role: "employee" },
  { id: DEMO_IDS.meera, label: "Meera Joshi — Employee (self-appraisal done)", role: "employee" },
];
