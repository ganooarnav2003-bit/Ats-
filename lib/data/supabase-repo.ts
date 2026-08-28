import { createAdminClient } from "@/lib/supabase/admin";
import type {
  CycleStatus,
  Employee,
  Goal,
  GoalRating,
  Review,
  ReviewCycle,
} from "@/lib/types";
import type {
  CycleInput,
  EmployeeInput,
  GoalInput,
  ManagerRatingInput,
  PmsRepository,
  SelfRatingInput,
} from "@/lib/data/repository";

function must<T>(data: T | null, error: { message: string } | null, fallback: string): T {
  if (error) throw new Error(error.message);
  if (data == null) throw new Error(fallback);
  return data;
}

export class SupabaseRepository implements PmsRepository {
  private client() {
    return createAdminClient();
  }

  async listEmployees() {
    const { data, error } = await this.client()
      .from("employees")
      .select("*")
      .order("full_name");
    if (error) throw new Error(error.message);
    return (data ?? []) as Employee[];
  }

  async getEmployeeById(id: string) {
    const { data, error } = await this.client()
      .from("employees")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data as Employee | null) ?? null;
  }

  async getEmployeeByEmail(email: string) {
    const { data, error } = await this.client()
      .from("employees")
      .select("*")
      .ilike("email", email)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data as Employee | null) ?? null;
  }

  async getEmployeeByClerkId(clerkUserId: string) {
    const { data, error } = await this.client()
      .from("employees")
      .select("*")
      .eq("clerk_user_id", clerkUserId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data as Employee | null) ?? null;
  }

  async stampClerkUserId(employeeId: string, clerkUserId: string) {
    const { error } = await this.client()
      .from("employees")
      .update({ clerk_user_id: clerkUserId })
      .eq("id", employeeId);
    if (error) throw new Error(error.message);
  }

  async upsertEmployee(id: string | null, input: EmployeeInput) {
    if (id) {
      const { data, error } = await this.client()
        .from("employees")
        .update(input)
        .eq("id", id)
        .select("*")
        .single();
      return must(data as Employee, error, "Employee update failed");
    }
    const { data, error } = await this.client()
      .from("employees")
      .insert(input)
      .select("*")
      .single();
    return must(data as Employee, error, "Employee create failed");
  }

  async listDirectReports(managerId: string) {
    const { data, error } = await this.client()
      .from("employees")
      .select("*")
      .eq("manager_id", managerId)
      .eq("is_active", true)
      .order("full_name");
    if (error) throw new Error(error.message);
    return (data ?? []) as Employee[];
  }

  async listCycles() {
    const { data, error } = await this.client()
      .from("review_cycles")
      .select("*")
      .order("start_date", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as ReviewCycle[];
  }

  async getOpenCycle() {
    const { data, error } = await this.client()
      .from("review_cycles")
      .select("*")
      .eq("status", "open")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data as ReviewCycle | null) ?? null;
  }

  async getCycle(id: string) {
    const { data, error } = await this.client()
      .from("review_cycles")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data as ReviewCycle | null) ?? null;
  }

  async createCycle(input: CycleInput, createdBy: string) {
    const { data, error } = await this.client()
      .from("review_cycles")
      .insert({ ...input, status: "draft", created_by: createdBy })
      .select("*")
      .single();
    return must(data as ReviewCycle, error, "Cycle create failed");
  }

  async setCycleStatus(id: string, status: CycleStatus) {
    if (status === "open") {
      const open = await this.getOpenCycle();
      if (open && open.id !== id) {
        throw new Error("Only one review cycle can be open at a time. Close the current open cycle first.");
      }
    }
    const { data, error } = await this.client()
      .from("review_cycles")
      .update({ status })
      .eq("id", id)
      .select("*")
      .single();
    return must(data as ReviewCycle, error, "Cycle update failed");
  }

  async listGoals(employeeId: string, cycleId: string) {
    const { data, error } = await this.client()
      .from("goals")
      .select("*")
      .eq("employee_id", employeeId)
      .eq("cycle_id", cycleId)
      .order("created_at");
    if (error) throw new Error(error.message);
    return (data ?? []) as Goal[];
  }

  async getGoal(id: string) {
    const { data, error } = await this.client()
      .from("goals")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data as Goal | null) ?? null;
  }

  async createGoal(employeeId: string, cycleId: string, input: GoalInput) {
    const { data, error } = await this.client()
      .from("goals")
      .insert({
        employee_id: employeeId,
        cycle_id: cycleId,
        ...input,
        status: "draft",
      })
      .select("*")
      .single();
    return must(data as Goal, error, "Goal create failed");
  }

  async updateGoal(id: string, input: GoalInput) {
    const { data, error } = await this.client()
      .from("goals")
      .update(input)
      .eq("id", id)
      .select("*")
      .single();
    return must(data as Goal, error, "Goal update failed");
  }

  async deleteGoal(id: string) {
    const { error } = await this.client().from("goals").delete().eq("id", id);
    if (error) throw new Error(error.message);
  }

  async setGoalStatus(id: string, status: Goal["status"], managerComment?: string | null) {
    const patch: Partial<Goal> = { status };
    if (managerComment !== undefined) patch.manager_comment = managerComment;
    const { data, error } = await this.client()
      .from("goals")
      .update(patch)
      .eq("id", id)
      .select("*")
      .single();
    return must(data as Goal, error, "Goal status update failed");
  }

  async submitAllGoals(employeeId: string, cycleId: string) {
    const { error } = await this.client()
      .from("goals")
      .update({ status: "submitted" })
      .eq("employee_id", employeeId)
      .eq("cycle_id", cycleId)
      .in("status", ["draft", "sent_back"]);
    if (error) throw new Error(error.message);
  }

  async getReview(employeeId: string, cycleId: string) {
    const { data, error } = await this.client()
      .from("reviews")
      .select("*")
      .eq("employee_id", employeeId)
      .eq("cycle_id", cycleId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data as Review | null) ?? null;
  }

  async ensureReview(employeeId: string, managerId: string, cycleId: string) {
    const existing = await this.getReview(employeeId, cycleId);
    if (existing) return existing;
    const { data, error } = await this.client()
      .from("reviews")
      .insert({
        employee_id: employeeId,
        manager_id: managerId,
        cycle_id: cycleId,
        status: "not_started",
      })
      .select("*")
      .single();
    return must(data as Review, error, "Review create failed");
  }

  async listGoalRatings(reviewId: string) {
    const { data, error } = await this.client()
      .from("goal_ratings")
      .select("*")
      .eq("review_id", reviewId);
    if (error) throw new Error(error.message);
    return (data ?? []) as GoalRating[];
  }

  async submitSelfAppraisal(
    reviewId: string,
    ratings: SelfRatingInput[],
    overallSelfRating: number,
  ) {
    const client = this.client();
    for (const rating of ratings) {
      const { data: existing, error: findError } = await client
        .from("goal_ratings")
        .select("*")
        .eq("review_id", reviewId)
        .eq("goal_id", rating.goal_id)
        .maybeSingle();
      if (findError) throw new Error(findError.message);
      if (existing) {
        const { error } = await client
          .from("goal_ratings")
          .update({
            self_rating: rating.self_rating,
            self_comment: rating.self_comment,
          })
          .eq("id", (existing as GoalRating).id);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await client.from("goal_ratings").insert({
          review_id: reviewId,
          goal_id: rating.goal_id,
          self_rating: rating.self_rating,
          self_comment: rating.self_comment,
        });
        if (error) throw new Error(error.message);
      }
    }
    const { data, error } = await client
      .from("reviews")
      .update({
        status: "self_appraisal_submitted",
        overall_self_rating: overallSelfRating,
        submitted_at: new Date().toISOString(),
      })
      .eq("id", reviewId)
      .select("*")
      .single();
    return must(data as Review, error, "Self-appraisal update failed");
  }

  async submitManagerReview(
    reviewId: string,
    ratings: ManagerRatingInput[],
    overallManagerRating: number,
    summary: string,
    complete: boolean,
  ) {
    const client = this.client();
    for (const rating of ratings) {
      const { error } = await client
        .from("goal_ratings")
        .update({
          manager_rating: rating.manager_rating,
          manager_comment: rating.manager_comment,
        })
        .eq("review_id", reviewId)
        .eq("goal_id", rating.goal_id);
      if (error) throw new Error(error.message);
    }
    const { data, error } = await client
      .from("reviews")
      .update({
        overall_manager_rating: overallManagerRating,
        manager_summary: summary,
        reviewed_at: new Date().toISOString(),
        status: complete ? "completed" : "manager_reviewed",
      })
      .eq("id", reviewId)
      .select("*")
      .single();
    return must(data as Review, error, "Manager review update failed");
  }

  async listReviewsForCycle(cycleId: string) {
    const { data, error } = await this.client()
      .from("reviews")
      .select("*")
      .eq("cycle_id", cycleId);
    if (error) throw new Error(error.message);
    return (data ?? []) as Review[];
  }
}
