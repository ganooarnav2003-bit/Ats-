# Stage 0 — Performance Framework & Security Model

Helios Consulting (≈200 people, project-based services) is replacing email + Excel with a single cycle-driven PMS. This note is the product contract the application implements.

## KRA vs KPI

- **KRA (Key Result Area)** describes *what* an employee is accountable for in a cycle (e.g. “Delivery quality on the Northwind account”). KRAs are qualitative ownership domains.
- **KPI (Key Performance Indicator)** is *how* we measure that area (e.g. “CSAT ≥ 4.5”, “on-time milestone % ≥ 95”). KPIs are numeric or binary evidence.
- In this system a **Goal** is the operational unit: a SMART statement that maps one KRA to one or more KPIs. Weightage on the goal is the relative importance of that KRA in the cycle, not a KPI itself.

## SMART goal standard

Every goal stored in `goals` is expected to be:

| Letter | Meaning | Example |
| --- | --- | --- |
| Specific | Named account, practice, or workstream | “Reduce P1 incidents on HeliosPay” |
| Measurable | KPI or evidence the manager can verify | “≤ 2 P1s per quarter” |
| Achievable | Agreed with the manager during goal setting | Staffed team of 4, not a solo hero metric |
| Relevant | Tied to the open cycle and the employee’s designation | Delivery lead, not a sales quota |
| Time-bound | `target_date` inside the cycle window | Before cycle `end_date` |

Submission is blocked until **all goal weightages for the employee × cycle sum to exactly 100**. Individual weights are integers 0–100.

## 1–5 rating scale

Used on `goal_ratings.self_rating` / `manager_rating` and rolled into overall scores.

| Score | Label | Criteria |
| --- | --- | --- |
| 1 | Unsatisfactory | Missed the KPI with no credible recovery plan |
| 2 | Needs improvement | Partial delivery; significant manager intervention |
| 3 | Meets expectations | SMART target hit; quality at practice standard |
| 4 | Exceeds expectations | Target beaten and knowledge shared beyond the team |
| 5 | Outstanding | Material firm-level impact; repeatable excellence |

Overall ratings are **weightage-weighted averages** of per-goal scores, stored as `NUMERIC(3,2)`.

## Workflow state machines

```
Goals:   draft → submitted → approved
                      ↘ sent_back → (edit) → submitted

Reviews: not_started → self_appraisal_submitted → manager_reviewed → completed
```

Only **one** `review_cycles` row may be `open` at a time (partial unique index). Employees create/edit goals only against the open cycle. Closed cycles are read-only history.

## RLS security boundaries

Application server actions always resolve the Clerk (or demo) session to an `employees` row **before** any mutation. PostgreSQL RLS is the second fence for anyone holding the anon key:

| Table | Employee | Manager | HR Admin |
| --- | --- | --- | --- |
| `employees` | Self | Self + direct reports | All |
| `review_cycles` | Read | Read | Full lifecycle |
| `goals` | Own rows | Own + reports | All |
| `reviews` | Own row | Own + reports they manage | All |
| `goal_ratings` | Via own review | Via managed review | All |

URL tampering (`/team/reviews/<uuid>`) cannot return another employee’s review: the loader checks `manager_id` / `hr_admin` and RLS would also hide the row. `CLERK_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `RESEND_API_KEY` are server-only.

## Data flow (conceptual)

Clerk authenticates the human → the app matches `employees.email` and stamps `clerk_user_id` → every server action loads that employee and passes their id into queries → writes go to Postgres (or the demo store) → Resend is invoked as a non-blocking side effect after a successful appraisal write.
