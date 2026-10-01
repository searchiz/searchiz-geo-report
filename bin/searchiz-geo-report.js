#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { validate } from "../src/index.js";

const [command, file] = process.argv.slice(2);
if (command !== "validate" || !file) {
  console.log("Usage: searchiz-geo-report validate <report.json>");
  process.exit(command ? 1 : 0);
}
let report;
try {
  report = JSON.parse(readFileSync(file, "utf8"));
} catch (error) {
  console.error(`Could not read ${file}: ${error.message}`);
  process.exit(2);
}
const result = validate(report);
if (result.valid) {
  console.log(`${file}: valid searchiz-geo-report/v1 (${report.summary.mentions} of ${report.summary.sample_size} valid discovery answers named the business)`);
} else {
  console.error(`${file}: invalid\n${result.errors.map((error) => `  ${error}`).join("\n")}`);
  process.exit(1);
}
