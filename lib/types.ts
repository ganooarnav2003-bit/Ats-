export type Role = "employee" | "manager" | "hr_admin";

export type CycleStatus = "draft" | "open" | "closed";

export type GoalStatus = "draft" | "submitted" | "approved" | "sent_back";

export type ReviewStatus =
  | "not_started"
  | "self_appraisal_submitted"
  | "manager_reviewed"
  | "completed";

export type Employee = {
  id: string;
  clerk_user_id: string | null;
  full_name: string;
  email: string;
  designation: string | null;
  department: string | null;
  date_of_joining: string | null;
  manager_id: string | null;
  role: Role;
  is_active: boolean;
  created_at: string;
};

export type ReviewCycle = {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: CycleStatus;
  created_by: string | null;
  created_at: string;
};

export type Goal = {
  id: string;
  employee_id: string;
  cycle_id: string;
  title: string;
  description: string | null;
  weightage: number;
  target_date: string | null;
  status: GoalStatus;
  manager_comment: string | null;
  created_at: string;
};

export type Review = {
  id: string;
  employee_id: string;
  manager_id: string;
  cycle_id: string;
  status: ReviewStatus;
  overall_self_rating: number | null;
  overall_manager_rating: number | null;
  manager_summary: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  created_at: string;
};

export type GoalRating = {
  id: string;
  review_id: string;
  goal_id: string;
  self_comment: string | null;
  self_rating: number | null;
  manager_comment: string | null;
  manager_rating: number | null;
};

export type SessionUser = Employee & {
  manager: Employee | null;
  directReportCount: number;
};

export const RATING_LABELS: Record<number, string> = {
  1: "Unsatisfactory",
  2: "Needs improvement",
  3: "Meets expectations",
  4: "Exceeds expectations",
  5: "Outstanding",
};

export const ROLE_LABELS: Record<Role, string> = {
  employee: "Employee",
  manager: "Manager",
  hr_admin: "HR Admin",
};
