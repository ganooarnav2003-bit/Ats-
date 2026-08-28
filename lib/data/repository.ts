import type {
  CycleStatus,
  Employee,
  Goal,
  GoalRating,
  Review,
  ReviewCycle,
  Role,
} from "@/lib/types";

export type GoalInput = {
  title: string;
  description: string | null;
  weightage: number;
  target_date: string | null;
};

export type SelfRatingInput = {
  goal_id: string;
  self_rating: number;
  self_comment: string;
};

export type ManagerRatingInput = {
  goal_id: string;
  manager_rating: number;
  manager_comment: string;
};

export type EmployeeInput = {
  full_name: string;
  email: string;
  designation: string | null;
  department: string | null;
  date_of_joining: string | null;
  manager_id: string | null;
  role: Role;
  is_active: boolean;
};

export type CycleInput = {
  name: string;
  start_date: string;
  end_date: string;
};

export interface PmsRepository {
  listEmployees(): Promise<Employee[]>;
  getEmployeeById(id: string): Promise<Employee | null>;
  getEmployeeByEmail(email: string): Promise<Employee | null>;
  getEmployeeByClerkId(clerkUserId: string): Promise<Employee | null>;
  stampClerkUserId(employeeId: string, clerkUserId: string): Promise<void>;
  upsertEmployee(id: string | null, input: EmployeeInput): Promise<Employee>;
  listDirectReports(managerId: string): Promise<Employee[]>;

  listCycles(): Promise<ReviewCycle[]>;
  getOpenCycle(): Promise<ReviewCycle | null>;
  getCycle(id: string): Promise<ReviewCycle | null>;
  createCycle(input: CycleInput, createdBy: string): Promise<ReviewCycle>;
  setCycleStatus(id: string, status: CycleStatus): Promise<ReviewCycle>;

  listGoals(employeeId: string, cycleId: string): Promise<Goal[]>;
  getGoal(id: string): Promise<Goal | null>;
  createGoal(employeeId: string, cycleId: string, input: GoalInput): Promise<Goal>;
  updateGoal(id: string, input: GoalInput): Promise<Goal>;
  deleteGoal(id: string): Promise<void>;
  setGoalStatus(
    id: string,
    status: Goal["status"],
    managerComment?: string | null,
  ): Promise<Goal>;
  submitAllGoals(employeeId: string, cycleId: string): Promise<void>;

  getReview(employeeId: string, cycleId: string): Promise<Review | null>;
  ensureReview(
    employeeId: string,
    managerId: string,
    cycleId: string,
  ): Promise<Review>;
  listGoalRatings(reviewId: string): Promise<GoalRating[]>;
  submitSelfAppraisal(
    reviewId: string,
    ratings: SelfRatingInput[],
    overallSelfRating: number,
  ): Promise<Review>;
  submitManagerReview(
    reviewId: string,
    ratings: ManagerRatingInput[],
    overallManagerRating: number,
    summary: string,
    complete: boolean,
  ): Promise<Review>;

  listReviewsForCycle(cycleId: string): Promise<Review[]>;
}
