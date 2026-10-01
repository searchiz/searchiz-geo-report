// Validates a searchiz-geo-report/v1 document: its shape (schema.json) and
// the rules a schema cannot express. A failed or unsupported answer must say
// nothing about the business, and the summary must be computed only from
// valid discovery answers.

export const FORMAT = "searchiz-geo-report/v1";
const ANSWER_KEYS = ["question", "kind", "engine", "method", "collected_at", "status", "mention", "recommendation", "position", "citations"];
const isDate = (value) => typeof value === "string" && !Number.isNaN(Date.parse(value)) && /^\d{4}-\d{2}-\d{2}T/.test(value);
const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);

export function summarize(answers) {
  const valid = answers.filter((answer) => answer.kind === "discovery" && answer.status === "ok");
  const mentions = valid.filter((answer) => answer.mention === true).length;
  return {
    sample_size: valid.length,
    mentions,
    recommendations: valid.filter((answer) => answer.recommendation === true).length,
    rate: valid.length ? Math.round((mentions / valid.length) * 10000) / 10000 : null
  };
}

export function validate(report) {
  const errors = [];
  const fail = (path, message) => errors.push(`${path}: ${message}`);
  if (!isObject(report)) return { valid: false, errors: ["$: must be an object"] };
  if (report.format !== FORMAT) fail("$.format", `must be "${FORMAT}"`);
  if (!isDate(report.generated_at)) fail("$.generated_at", "must be an ISO 8601 date-time");
  if (!isObject(report.subject) || typeof report.subject.name !== "string" || !report.subject.name) fail("$.subject.name", "is required");
  if (!isObject(report.period) || !isDate(report.period.from) || !isDate(report.period.to)) fail("$.period", "needs from and to date-times");
  else if (Date.parse(report.period.from) > Date.parse(report.period.to)) fail("$.period", "from is after to");
  if (!Array.isArray(report.answers)) fail("$.answers", "must be an array");
  const answers = Array.isArray(report.answers) ? report.answers : [];
  answers.forEach((answer, index) => {
    const at = `$.answers[${index}]`;
    if (!isObject(answer)) return fail(at, "must be an object");
    for (const key of ANSWER_KEYS) if (!(key in answer)) fail(`${at}.${key}`, "is required");
    for (const key of Object.keys(answer)) if (!ANSWER_KEYS.includes(key)) fail(`${at}.${key}`, "is not part of v1");
    if (!["discovery", "branded"].includes(answer.kind)) fail(`${at}.kind`, "must be discovery or branded");
    if (!["web", "api"].includes(answer.method)) fail(`${at}.method`, "must be web or api");
    if (!["ok", "failed", "unsupported"].includes(answer.status)) fail(`${at}.status`, "must be ok, failed or unsupported");
    if (answer.collected_at !== null && !isDate(answer.collected_at)) fail(`${at}.collected_at`, "must be a date-time or null");
    if (answer.position !== null && !(Number.isInteger(answer.position) && answer.position >= 1)) fail(`${at}.position`, "must be a positive integer or null");
    if (!Array.isArray(answer.citations)) fail(`${at}.citations`, "must be an array");
    if (answer.status === "ok") {
      if (typeof answer.mention !== "boolean") fail(`${at}.mention`, "must be true or false for an ok answer");
      if (typeof answer.recommendation !== "boolean") fail(`${at}.recommendation`, "must be true or false for an ok answer");
      if (answer.recommendation === true && answer.mention === false) fail(`${at}.recommendation`, "cannot be true when the business is not mentioned");
    } else {
      // An answer that was not read says nothing about the business.
      for (const key of ["mention", "recommendation", "position"]) if (answer[key] !== null) fail(`${at}.${key}`, `must be null when status is ${answer.status}`);
      if (Array.isArray(answer.citations) && answer.citations.length) fail(`${at}.citations`, `must be empty when status is ${answer.status}`);
    }
  });
  if (!isObject(report.summary)) fail("$.summary", "is required");
  else if (errors.length === 0) {
    const expected = summarize(answers);
    for (const [key, value] of Object.entries(expected)) {
      if (report.summary[key] !== value) fail(`$.summary.${key}`, `is ${JSON.stringify(report.summary[key])}, expected ${JSON.stringify(value)} from the valid discovery answers`);
    }
  }
  return { valid: errors.length === 0, errors };
}
