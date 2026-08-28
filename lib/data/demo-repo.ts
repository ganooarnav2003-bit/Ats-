import type {
  CycleStatus,
  Employee,
  Goal,
  Review,
} from "@/lib/types";
import type {
  CycleInput,
  EmployeeInput,
  GoalInput,
  ManagerRatingInput,
  PmsRepository,
  SelfRatingInput,
} from "@/lib/data/repository";
import { isoNow, nextId, readOnlyStore, withStore } from "@/lib/data/demo-store";

export class DemoRepository implements PmsRepository {
  listEmployees() {
    return readOnlyStore((store) =>
      [...store.employees].sort((a, b) => a.full_name.localeCompare(b.full_name)),
    );
  }

  getEmployeeById(id: string) {
    return readOnlyStore((store) => store.employees.find((e) => e.id === id) ?? null);
  }

  getEmployeeByEmail(email: string) {
    const needle = email.toLowerCase();
    return readOnlyStore(
      (store) => store.employees.find((e) => e.email.toLowerCase() === needle) ?? null,
    );
  }

  getEmployeeByClerkId(clerkUserId: string) {
    return readOnlyStore(
      (store) => store.employees.find((e) => e.clerk_user_id === clerkUserId) ?? null,
    );
  }

  stampClerkUserId(employeeId: string, clerkUserId: string) {
    return withStore((store) => {
      const employee = store.employees.find((e) => e.id === employeeId);
      if (employee) employee.clerk_user_id = clerkUserId;
    });
  }

  upsertEmployee(id: string | null, input: EmployeeInput) {
    return withStore((store) => {
      if (id) {
        const idx = store.employees.findIndex((e) => e.id === id);
        if (idx === -1) throw new Error("Employee not found");
        store.employees[idx] = { ...store.employees[idx], ...input };
        return store.employees[idx];
      }
      const created: Employee = {
        id: nextId(),
        clerk_user_id: null,
        created_at: isoNow(),
        ...input,
      };
      store.employees.push(created);
      return created;
    });
  }

  listDirectReports(managerId: string) {
    return readOnlyStore((store) =>
      store.employees
        .filter((e) => e.manager_id === managerId && e.is_active)
        .sort((a, b) => a.full_name.localeCompare(b.full_name)),
    );
  }

  listCycles() {
    return readOnlyStore((store) =>
      [...store.review_cycles].sort((a, b) => b.start_date.localeCompare(a.start_date)),
    );
  }

  getOpenCycle() {
    return readOnlyStore(
      (store) => store.review_cycles.find((c) => c.status === "open") ?? null,
    );
  }

  getCycle(id: string) {
    return readOnlyStore((store) => store.review_cycles.find((c) => c.id === id) ?? null);
  }

  createCycle(input: CycleInput, createdBy: string) {
    return withStore((store) => {
      const created = {
        id: nextId(),
        ...input,
        status: "draft" as const,
        created_by: createdBy,
        created_at: isoNow(),
      };
      store.review_cycles.push(created);
      return created;
    });
  }

  setCycleStatus(id: string, status: CycleStatus) {
    return withStore((store) => {
      if (status === "open" && store.review_cycles.some((c) => c.status === "open" && c.id !== id)) {
        throw new Error("Only one review cycle can be open at a time. Close the current open cycle first.");
      }
      const cycle = store.review_cycles.find((c) => c.id === id);
      if (!cycle) throw new Error("Cycle not found");
      cycle.status = status;
      return cycle;
    });
  }

  listGoals(employeeId: string, cycleId: string) {
    return readOnlyStore((store) =>
      store.goals
        .filter((g) => g.employee_id === employeeId && g.cycle_id === cycleId)
        .sort((a, b) => a.created_at.localeCompare(b.created_at)),
    );
  }

  getGoal(id: string) {
    return readOnlyStore((store) => store.goals.find((g) => g.id === id) ?? null);
  }

  createGoal(employeeId: string, cycleId: string, input: GoalInput) {
    return withStore((store) => {
      const goal: Goal = {
        id: nextId(),
        employee_id: employeeId,
        cycle_id: cycleId,
        ...input,
        status: "draft",
        manager_comment: null,
        created_at: isoNow(),
      };
      store.goals.push(goal);
      return goal;
    });
  }

  updateGoal(id: string, input: GoalInput) {
    return withStore((store) => {
      const goal = store.goals.find((g) => g.id === id);
      if (!goal) throw new Error("Goal not found");
      Object.assign(goal, input);
      return goal;
    });
  }

  deleteGoal(id: string) {
    return withStore((store) => {
      store.goals = store.goals.filter((g) => g.id !== id);
    });
  }

  setGoalStatus(id: string, status: Goal["status"], managerComment?: string | null) {
    return withStore((store) => {
      const goal = store.goals.find((g) => g.id === id);
      if (!goal) throw new Error("Goal not found");
      goal.status = status;
      if (managerComment !== undefined) goal.manager_comment = managerComment;
      return goal;
    });
  }

  submitAllGoals(employeeId: string, cycleId: string) {
    return withStore((store) => {
      for (const goal of store.goals) {
        if (
          goal.employee_id === employeeId &&
          goal.cycle_id === cycleId &&
          (goal.status === "draft" || goal.status === "sent_back")
        ) {
          goal.status = "submitted";
        }
      }
    });
  }

  getReview(employeeId: string, cycleId: string) {
    return readOnlyStore(
      (store) =>
        store.reviews.find((r) => r.employee_id === employeeId && r.cycle_id === cycleId) ??
        null,
    );
  }

  ensureReview(employeeId: string, managerId: string, cycleId: string) {
    return withStore((store) => {
      const existing = store.reviews.find(
        (r) => r.employee_id === employeeId && r.cycle_id === cycleId,
      );
      if (existing) return existing;
      const created: Review = {
        id: nextId(),
        employee_id: employeeId,
        manager_id: managerId,
        cycle_id: cycleId,
        status: "not_started",
        overall_self_rating: null,
        overall_manager_rating: null,
        manager_summary: null,
        submitted_at: null,
        reviewed_at: null,
        created_at: isoNow(),
      };
      store.reviews.push(created);
      return created;
    });
  }

  listGoalRatings(reviewId: string) {
    return readOnlyStore((store) => store.goal_ratings.filter((g) => g.review_id === reviewId));
  }

  submitSelfAppraisal(reviewId: string, ratings: SelfRatingInput[], overallSelfRating: number) {
    return withStore((store) => {
      const review = store.reviews.find((r) => r.id === reviewId);
      if (!review) throw new Error("Review not found");
      for (const rating of ratings) {
        const existing = store.goal_ratings.find(
          (g) => g.review_id === reviewId && g.goal_id === rating.goal_id,
        );
        if (existing) {
          existing.self_rating = rating.self_rating;
          existing.self_comment = rating.self_comment;
        } else {
          store.goal_ratings.push({
            id: nextId(),
            review_id: reviewId,
            goal_id: rating.goal_id,
            self_rating: rating.self_rating,
            self_comment: rating.self_comment,
            manager_comment: null,
            manager_rating: null,
          });
        }
      }
      review.status = "self_appraisal_submitted";
      review.overall_self_rating = overallSelfRating;
      review.submitted_at = isoNow();
      return review;
    });
  }

  submitManagerReview(
    reviewId: string,
    ratings: ManagerRatingInput[],
    overallManagerRating: number,
    summary: string,
    complete: boolean,
  ) {
    return withStore((store) => {
      const review = store.reviews.find((r) => r.id === reviewId);
      if (!review) throw new Error("Review not found");
      for (const rating of ratings) {
        const row = store.goal_ratings.find(
          (g) => g.review_id === reviewId && g.goal_id === rating.goal_id,
        );
        if (row) {
          row.manager_rating = rating.manager_rating;
          row.manager_comment = rating.manager_comment;
        }
      }
      review.overall_manager_rating = overallManagerRating;
      review.manager_summary = summary;
      review.reviewed_at = isoNow();
      review.status = complete ? "completed" : "manager_reviewed";
      return review;
    });
  }

  listReviewsForCycle(cycleId: string) {
    return readOnlyStore((store) => store.reviews.filter((r) => r.cycle_id === cycleId));
  }
}
