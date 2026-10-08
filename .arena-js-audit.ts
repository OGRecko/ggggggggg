/**
 * Audits every shipped JavaScript code string by executing the app's real exported worker source
 * (src/utils/javascriptRunner.ts -> javascriptWorkerSource) and comparing the result with the
 * declared expected output. Writes /tmp/js_audit.json and prints a bucketed summary.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { javascriptWorkerSource } from "./src/utils/javascriptRunner";

type Row = { where: string; kind: string; code: string; output?: string };

type WorkerResult = { id: number; output?: string; error?: string; errorLine?: number };

async function runInWorker(code: string): Promise<WorkerResult> {
  const messages: WorkerResult[] = [];
  const fakeSelf: Record<string, unknown> = {
    postMessage: (message: WorkerResult) => messages.push(message),
  };
  const evaluate = new Function(
    "self",
    "setTimeout",
    "clearTimeout",
    "setInterval",
    "clearInterval",
    "Promise",
    "fetch",
    "XMLHttpRequest",
    "WebSocket",
    "EventSource",
    "Worker",
    "SharedWorker",
    "importScripts",
    "postMessage",
    "close",
    "Function",
    `${javascriptWorkerSource}`,
  );
  evaluate(
    fakeSelf,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    Promise,
    () => { throw new Error("blocked"); },
    () => { throw new Error("blocked"); },
    () => { throw new Error("blocked"); },
    () => { throw new Error("blocked"); },
    () => { throw new Error("blocked"); },
    () => { throw new Error("blocked"); },
    () => { throw new Error("blocked"); },
    () => { throw new Error("blocked"); },
    () => { throw new Error("blocked"); },
    Function,
  );
  await (fakeSelf.onmessage as (event: unknown) => Promise<void>)({ data: { id: 1, code } });
  return messages[messages.length - 1];
}

const BROWSER_ERROR = /document is not defined|localStorage|window is not defined|alert is not defined|navigator is not defined|HTMLElement/;
// Two more limits that the course states explicitly, so a row that hits one of them and says so
// in its declared output is honestly labelled rather than counted as an unexpected failure.
const SANDBOX_LIMIT = /Unexpected token 'export'|Cannot use import statement outside a module|await is only valid in async functions|blocks browser-side networking/;
const STRUCTURAL_NOTE = /structural review|reviewed for shape/i;
const DELIBERATE = /broken|deliberate/i;
const HONEST_PROSE = /browser|preview|structural|error|invalid|missing|guard|reminder|behavior|accessible/i;

type Bucket = "match" | "starter-empty" | "mismatch" | "browser-only-honest" | "browser-only-lying" | "sandbox-limited-honest" | "starter-browser-only" | "starter-error" | "intentional-error" | "unexpected-error" | "no-output-declared";

const buckets: Record<Bucket, Array<Record<string, unknown>>> = {
  match: [], "starter-empty": [], mismatch: [], "browser-only-honest": [], "browser-only-lying": [], "sandbox-limited-honest": [], "starter-browser-only": [], "starter-error": [],
  "intentional-error": [], "unexpected-error": [], "no-output-declared": [],
};

const rows = JSON.parse(readFileSync("/tmp/js_snippets.json", "utf8")) as Row[];
for (const row of rows) {
  if (!row.code || !row.code.trim()) continue;
  const result = await runInWorker(row.code);
  const declared = (row.output ?? "").trim();
  const entry = { where: row.where, kind: row.kind, declared, error: result.error, actual: result.output ?? "" };

  if (result.error) {
    if (DELIBERATE.test(row.where.split("/").pop() ?? "")) {
      buckets["intentional-error"].push(entry);
    } else if (BROWSER_ERROR.test(result.error)) {
      // A starter scaffold declares no output at all, so failing in the worker is not a false
      // claim about a transcript; it is simply code waiting for a document that the Worker lacks.
      if (row.kind === "starter" && !declared) buckets["starter-browser-only"].push(entry);
      else buckets[HONEST_PROSE.test(declared) ? "browser-only-honest" : "browser-only-lying"].push(entry);
    } else if (SANDBOX_LIMIT.test(result.error) && STRUCTURAL_NOTE.test(declared)) {
      // The lesson states that the module graph or the network is not available, so the row is
      // reported as sandbox-limited instead of being called an unexpected error.
      buckets["sandbox-limited-honest"].push(entry);
    } else if (row.kind === "starter") {
      // A starter scaffold declares nothing and is meant to be completed, so an error here is a
      // scaffold that cannot run as shipped; it is reported separately from the deliberate
      // breakages, whose rows do claim a failing behaviour on purpose.
      buckets["starter-error"].push(entry);
    } else {
      buckets["unexpected-error"].push(entry);
    }
    continue;
  }

  if (!declared) {
    buckets[row.kind === "starter" ? "starter-empty" : "no-output-declared"].push(entry);
    continue;
  }
  if (STRUCTURAL_NOTE.test(declared) && !result.output) {
    // A reading example in a structurally-reviewed lesson: it declares that it is reviewed for
    // shape rather than executed, and it really does print nothing when run.
    buckets["sandbox-limited-honest"].push(entry);
    continue;
  }
  if (result.output === declared) {
    buckets.match.push(entry);
  } else {
    buckets.mismatch.push(entry);
  }
}

writeFileSync("/tmp/js_audit.json", JSON.stringify(buckets, null, 1));
for (const [name, list] of Object.entries(buckets)) console.log(`${name}: ${list.length}`);
console.log("\n--- mismatches ---");
for (const entry of buckets.mismatch) {
  console.log(`${entry.where} [${entry.kind}]`);
  console.log(`  declared: ${JSON.stringify(entry.declared).slice(0, 110)}`);
  console.log(`  actual  : ${JSON.stringify(entry.actual).slice(0, 110)}`);
}
console.log("\n--- rows limited by a stated sandbox boundary (module graph, network) ---");
for (const entry of buckets["sandbox-limited-honest"]) console.log(`${entry.where} [${entry.kind}] error=${JSON.stringify(entry.error ?? "")} declared=${JSON.stringify(entry.declared).slice(0, 80)}`);
console.log("\n--- starter scaffolds that cannot run as shipped (completed by the learner) ---");
for (const entry of buckets["starter-error"]) console.log(`${entry.where} error=${JSON.stringify(entry.error ?? "")}`);
console.log("\n--- starter scaffolds that need a document, and therefore declare nothing ---");
for (const entry of buckets["starter-browser-only"]) console.log(`${entry.where} error=${JSON.stringify(entry.error ?? "")}`);
console.log("\n--- browser-only rows whose declared text does not mention the browser boundary ---");
for (const entry of buckets["browser-only-lying"]) {
  console.log(`${entry.where} [${entry.kind}] declared=${JSON.stringify(entry.declared)} | error=${entry.error}`);
}
console.log("\n--- unexpected runtime errors ---");
for (const entry of buckets["unexpected-error"]) {
  console.log(`${entry.where} [${entry.kind}] ${entry.error} | declared=${JSON.stringify(entry.declared).slice(0, 70)}`);
}
console.log("\n--- non-starter rows with no declared output ---");
for (const entry of buckets["no-output-declared"]) console.log(`${entry.where} [${entry.kind}] -> ${JSON.stringify(entry.actual).slice(0, 70)}`);
