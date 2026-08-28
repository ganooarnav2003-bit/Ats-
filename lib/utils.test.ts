import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { weightedAverage } from "./utils.ts";

describe("weightedAverage", () => {
  it("weights ratings by goal weightage", () => {
    assert.equal(
      weightedAverage([
        { weightage: 60, rating: 4 },
        { weightage: 40, rating: 5 },
      ]),
      4.4,
    );
  });

  it("returns null when nothing is rated", () => {
    assert.equal(weightedAverage([{ weightage: 100, rating: null }]), null);
  });
});
