import test from "node:test";
import assert from "node:assert/strict";
import {
  docsFromText,
  validateConfig,
  ensureEnoughDocs,
  buildSpeedText,
  computeDatasetStats,
} from "../src/utils.js";

test("docsFromText trims and drops empty lines", () => {
  const docs = docsFromText(" alice\n\n bob \n\n");
  assert.deepEqual(docs, ["alice", "bob"]);
});

test("validateConfig clamps invalid values", () => {
  const cfg = validateConfig({
    num_steps: 9000,
    learning_rate: -1,
    seed: "33",
    report_every: 0,
  });

  assert.equal(cfg.num_steps, 5000);
  assert.equal(cfg.learning_rate, 0.0001);
  assert.equal(cfg.seed, 33);
  assert.equal(cfg.report_every, 1);
});

test("ensureEnoughDocs enforces minimum documents", () => {
  assert.throws(() => ensureEnoughDocs(["single"]), /at least two/i);
  assert.doesNotThrow(() => ensureEnoughDocs(["a", "b"]));
});

test("buildSpeedText formats a valid speed", () => {
  assert.equal(buildSpeedText(20, 4), "5.0 step/s");
  assert.equal(buildSpeedText(0, 4), "-");
});

test("computeDatasetStats returns names dataset stats", () => {
  const stats = computeDatasetStats(["emma", "liam", "olivia"]);
  assert.equal(stats.docsCount, 3);
  assert.equal(stats.vocabSize, 8);
  assert.equal(stats.avgLength, 14 / 3);
});
