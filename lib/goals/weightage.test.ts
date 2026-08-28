import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { canSubmitGoals, remainingWeightage, totalWeightage } from "./weightage.ts";

describe("goal weightage", () => {
  it("sums integers and requires exactly 100 to submit", () => {
    assert.equal(totalWeightage([40, 35, 25]), 100);
    assert.equal(canSubmitGoals([40, 35, 25]), true);
    assert.equal(canSubmitGoals([40, 35, 24]), false);
    assert.equal(canSubmitGoals([]), false);
    assert.equal(remainingWeightage([40, 35, 25]), 0);
  });

  it("rejects out-of-range weights", () => {
    assert.equal(canSubmitGoals([101, -1]), false);
    assert.equal(canSubmitGoals([50, 50, 0]), true);
  });
});
