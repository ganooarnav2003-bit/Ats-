import "server-only";
import { randomUUID } from "crypto";
import { DEMO_IDS } from "@/lib/data/personas";
import type {
  Employee,
  Goal,
  GoalRating,
  Review,
  ReviewCycle,
} from "@/lib/types";

export type DemoStore = {
  employees: Employee[];
  review_cycles: ReviewCycle[];
  goals: Goal[];
  reviews: Review[];
  goal_ratings: GoalRating[];
};

const now = "2026-03-15T09:00:00.000Z";

const ids = {
  ...DEMO_IDS,
  g1: "c1111111-1111-1111-1111-111111111111",
  g2: "c2222222-2222-2222-2222-222222222222",
  g3: "c3333333-3333-3333-3333-333333333333",
  g4: "c4444444-4444-4444-4444-444444444444",
  g5: "c5555555-5555-5555-5555-555555555555",
  g6: "c6666666-6666-6666-6666-666666666666",
  g7: "c7777777-7777-7777-7777-777777777777",
  rMeera: "d1111111-1111-1111-1111-111111111111",
  gr1: "e1111111-1111-1111-1111-111111111111",
  gr2: "e2222222-2222-2222-2222-222222222222",
};

function emp(
  partial: Omit<Employee, "created_at" | "is_active" | "clerk_user_id"> & {
    clerk_user_id?: string | null;
  },
): Employee {
  return {
    clerk_user_id: null,
    is_active: true,
    created_at: now,
    ...partial,
  };
}

export function seedStore(): DemoStore {
  const employees: Employee[] = [
    emp({
      id: ids.priya,
      full_name: "Priya Sharma",
      email: "priya.sharma@helio.example",
      designation: "Chief People Officer",
      department: "People",
      date_of_joining: "2018-04-01",
      manager_id: null,
      role: "hr_admin",
    }),
    emp({
      id: ids.rajesh,
      full_name: "Rajesh Kumar",
      email: "rajesh.kumar@helio.example",
      designation: "Engagement Manager",
      department: "Delivery",
      date_of_joining: "2019-06-10",
      manager_id: ids.priya,
      role: "manager",
    }),
    emp({
      id: ids.kavita,
      full_name: "Kavita Nair",
      email: "kavita.nair@helio.example",
      designation: "Practice Lead — Analytics",
      department: "Analytics",
      date_of_joining: "2020-01-15",
      manager_id: ids.priya,
      role: "manager",
    }),
    emp({
      id: ids.ananya,
      full_name: "Ananya Iyer",
      email: "ananya.iyer@helio.example",
      designation: "Consultant",
      department: "Delivery",
      date_of_joining: "2023-07-03",
      manager_id: ids.rajesh,
      role: "employee",
    }),
    emp({
      id: ids.vikram,
      full_name: "Vikram Shah",
      email: "vikram.shah@helio.example",
      designation: "Senior Consultant",
      department: "Delivery",
      date_of_joining: "2021-11-22",
      manager_id: ids.rajesh,
      role: "employee",
    }),
    emp({
      id: ids.meera,
      full_name: "Meera Joshi",
      email: "meera.joshi@helio.example",
      designation: "Analyst",
      department: "Analytics",
      date_of_joining: "2024-02-12",
      manager_id: ids.kavita,
      role: "employee",
    }),
  ];

  const review_cycles: ReviewCycle[] = [
    {
      id: ids.cycleClosed,
      name: "H2 FY2025",
      start_date: "2025-07-01",
      end_date: "2025-12-31",
      status: "closed",
      created_by: ids.priya,
      created_at: "2025-06-15T09:00:00.000Z",
    },
    {
      id: ids.cycleOpen,
      name: "H1 FY2026 Performance Cycle",
      start_date: "2026-01-01",
      end_date: "2026-06-30",
      status: "open",
      created_by: ids.priya,
      created_at: "2025-12-10T09:00:00.000Z",
    },
  ];

  const goals: Goal[] = [
    {
      id: ids.g1,
      employee_id: ids.ananya,
      cycle_id: ids.cycleOpen,
      title: "Deliver HeliosPay UAT with ≤2 P1 defects",
      description:
        "Own SIT/UAT defect triage for HeliosPay. KPI: P1 production defects ≤ 2; UAT exit by 15 May.",
      weightage: 40,
      target_date: "2026-05-15",
      status: "submitted",
      manager_comment: null,
      created_at: now,
    },
    {
      id: ids.g2,
      employee_id: ids.ananya,
      cycle_id: ids.cycleOpen,
      title: "Raise CSAT on Northwind retainer to 4.5+",
      description: "Weekly stakeholder notes and monthly QBRs. KPI: CSAT ≥ 4.5 on two consecutive surveys.",
      weightage: 35,
      target_date: "2026-06-01",
      status: "submitted",
      manager_comment: null,
      created_at: now,
    },
    {
      id: ids.g3,
      employee_id: ids.ananya,
      cycle_id: ids.cycleOpen,
      title: "Mentor two analysts through first independent story",
      description: "Pair on estimation and demo hygiene. KPI: both mentees ship a story without rollback.",
      weightage: 25,
      target_date: "2026-06-15",
      status: "submitted",
      manager_comment: null,
      created_at: now,
    },
    {
      id: ids.g4,
      employee_id: ids.vikram,
      cycle_id: ids.cycleOpen,
      title: "Cut average incident MTTR to under 4 hours",
      description: "Introduce runbooks for the top 5 incident types on Atlas.",
      weightage: 50,
      target_date: "2026-05-30",
      status: "sent_back",
      manager_comment:
        "Please attach the baseline MTTR from Q4 and name the runbook owners. Resubmit with a measurable baseline.",
      created_at: now,
    },
    {
      id: ids.g5,
      employee_id: ids.vikram,
      cycle_id: ids.cycleOpen,
      title: "Lead architecture review for Atlas v3",
      description: "Facilitate ADR sign-off with the client architecture board.",
      weightage: 50,
      target_date: "2026-04-30",
      status: "sent_back",
      manager_comment: "Split this into a delivery KPI and a knowledge-sharing KPI — 50/50 is too coarse.",
      created_at: now,
    },
    {
      id: ids.g6,
      employee_id: ids.meera,
      cycle_id: ids.cycleOpen,
      title: "Automate weekly utilisation pack for Analytics",
      description: "Replace the Excel pack with a scheduled dashboard. KPI: pack delivered by Monday 10:00 without manual edits.",
      weightage: 60,
      target_date: "2026-04-15",
      status: "approved",
      manager_comment: "Clear SMART goal — approved.",
      created_at: now,
    },
    {
      id: ids.g7,
      employee_id: ids.meera,
      cycle_id: ids.cycleOpen,
      title: "Complete dbt fundamentals and apply on the Helios mart",
      description: "KPI: certified + one merged PR that reduces a manual transform.",
      weightage: 40,
      target_date: "2026-05-31",
      status: "approved",
      manager_comment: "Approved.",
      created_at: now,
    },
  ];

  const reviews: Review[] = [
    {
      id: ids.rMeera,
      employee_id: ids.meera,
      manager_id: ids.kavita,
      cycle_id: ids.cycleOpen,
      status: "self_appraisal_submitted",
      overall_self_rating: 4.2,
      overall_manager_rating: null,
      manager_summary: null,
      submitted_at: "2026-03-10T11:30:00.000Z",
      reviewed_at: null,
      created_at: now,
    },
  ];

  const goal_ratings: GoalRating[] = [
    {
      id: ids.gr1,
      review_id: ids.rMeera,
      goal_id: ids.g6,
      self_comment:
        "Dashboard is live in Looker; last four Mondays required no manual patching. Finance signed off on 4 Mar.",
      self_rating: 4,
      manager_comment: null,
      manager_rating: null,
    },
    {
      id: ids.gr2,
      review_id: ids.rMeera,
      goal_id: ids.g7,
      self_comment: "Certification complete. PR #184 landed; still pairing with Kavita on tests.",
      self_rating: 4,
      manager_comment: null,
      manager_rating: null,
    },
  ];

  return { employees, review_cycles, goals, reviews, goal_ratings };
}

type GlobalStore = typeof globalThis & { __apexPmsStore?: DemoStore };

function memoryStore(): DemoStore {
  const g = globalThis as GlobalStore;
  if (!g.__apexPmsStore) {
    g.__apexPmsStore = seedStore();
  }
  return g.__apexPmsStore;
}

let queue: Promise<unknown> = Promise.resolve();

function enqueue<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn, fn);
  queue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export function withStore<T>(fn: (store: DemoStore) => Promise<T> | T) {
  return enqueue(async () => fn(memoryStore()));
}

export function readOnlyStore<T>(fn: (store: DemoStore) => Promise<T> | T) {
  return enqueue(async () => fn(memoryStore()));
}

export function nextId() {
  return randomUUID();
}

export function isoNow() {
  return new Date().toISOString();
}

