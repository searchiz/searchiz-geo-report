import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { validate, summarize } from "../src/index.js";

const load = (name) => JSON.parse(readFileSync(new URL(`../examples/${name}`, import.meta.url), "utf8"));

test("the valid example passes", () => {
  assert.deepEqual(validate(load("valid.json")), { valid: true, errors: [] });
});

test("a failed answer that is counted as absence is rejected", () => {
  const result = validate(load("invalid-failure-counted.json"));
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.includes("answers[2].mention") && error.includes("failed")));
});

test("the summary counts only valid discovery answers", () => {
  const report = load("valid.json");
  assert.deepEqual(summarize(report.answers), { sample_size: 2, mentions: 1, recommendations: 1, rate: 0.5 });
  report.summary.sample_size = 3;
  assert.ok(validate(report).errors.some((error) => error.startsWith("$.summary.sample_size")));
});

test("the schema file describes the same format", () => {
  const schema = JSON.parse(readFileSync(new URL("../schema.json", import.meta.url), "utf8"));
  assert.equal(schema.properties.format.const, "searchiz-geo-report/v1");
  assert.deepEqual(schema.$defs.answer.required.sort(), Object.keys(load("valid.json").answers[0]).sort());
});
