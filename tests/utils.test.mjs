import test from "node:test";
import assert from "node:assert/strict";
import {
  docsFromText,
  docsFromCsvFirstColumn,
  validateConfig,
  ensureEnoughDocs,
  buildSpeedText,
  computeDatasetStats,
  maxAdditionDigitsForBlockSize,
} from "../src/utils.js";

test("docsFromText trims and drops empty lines", () => {
  const docs = docsFromText(" alice\n\n bob \n\n");
  assert.deepEqual(docs, ["alice", "bob"]);
});

test("docsFromCsvFirstColumn handles header and trims rows", () => {
  const docs = docsFromCsvFirstColumn("example\n1+1=2\n 5+7=12 \n");
  assert.deepEqual(docs, ["1+1=2", "5+7=12"]);
});

test("validateConfig clamps invalid values", () => {
  const cfg = validateConfig({
    num_steps: 9000,
    learning_rate: -1,
    seed: "33",
    report_every: 0,
    batch_size: 64,
    warmup_steps: 0,
    min_lr_ratio: 0.001,
    grad_clip: 99,
    task_type: "addition",
    addition_max_digits: 9,
  });

  assert.equal(cfg.num_steps, 5000);
  assert.equal(cfg.learning_rate, 0.0001);
  assert.equal(cfg.seed, 33);
  assert.equal(cfg.report_every, 1);
  assert.equal(cfg.batch_size, 32);
  assert.equal(cfg.warmup_steps, 1);
  assert.equal(cfg.min_lr_ratio, 0.01);
  assert.equal(cfg.grad_clip, 5);
  assert.equal(cfg.task_type, "addition");
  assert.equal(cfg.addition_max_digits, 6);
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

test("maxAdditionDigitsForBlockSize reflects sequence capacity", () => {
  assert.equal(maxAdditionDigitsForBlockSize(16), 4);
  assert.equal(maxAdditionDigitsForBlockSize(10), 2);
});
