import { describe, expect, it } from "vitest";
import { javascriptCourse } from "../courses/javascript";
import { javascriptWorkerSource } from "../utils/javascriptRunner";

/**
 * Executes the app's real exported Worker source in this process. The harness mirrors the two
 * assignments the Worker performs against its own global scope: self.eval and self.Function are
 * replaced so indirect eval and the Function constructor cannot escape the sandbox.
 */
async function runInSandbox(code: string) {
  const messages: Array<{ output?: string; error?: string }> = [];
  const fakeSelf = {
    postMessage: (message: { output?: string; error?: string }) => messages.push(message),
  } as { postMessage: (message: { output?: string; error?: string }) => void; onmessage?: (event: { data: { id: number; code: string } }) => Promise<void>; eval?: unknown; Function?: unknown };
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
    ...Array.from({ length: 9 }, () => () => { throw new Error("blocked"); }),
    Function,
  );
  await fakeSelf.onmessage!({ data: { id: 1, code } });
  return messages[messages.length - 1];
}

type SampleRow = { where: string; kind: "example" | "exercise" | "starter" | "project"; code: string; declared: string };

function collectJavascriptRows(): SampleRow[] {
  const rows: SampleRow[] = [];
  for (const chapter of javascriptCourse.chapters) {
    for (const lesson of chapter.lessons) {
      for (const sample of lesson.examples ?? []) {
        rows.push({ where: `${lesson.id}/${sample.title}`, kind: "example", code: sample.code, declared: sample.output });
      }
      if (lesson.exercise) {
        rows.push({ where: `${lesson.id} [starter]`, kind: "starter", code: lesson.exercise.starterCode, declared: "" });
        rows.push({
          where: `${lesson.id} [solution]`,
          kind: "exercise",
          code: lesson.exercise.solution,
          declared: lesson.exercise.testCases?.[0]?.expected ?? "",
        });
      }
    }
    if (chapter.project?.solution) {
      rows.push({
        where: `ch${chapter.number} project`,
        kind: "project",
        code: chapter.project.solution,
        declared: chapter.project.testCases?.[0]?.expected ?? "",
      });
    }
  }
  return rows;
}

const BROWSER_BOUNDARY_ERROR = /document is not defined|window is not defined|localStorage|alert is not defined|navigator is not defined|HTMLElement/;
const DELIBERATE_BREAK = /broken version|broken sample|deliberate/i;
const BROWSER_WORDING = /browser|preview/i;

describe("JavaScript samples and the real Worker sandbox", () => {
  it(
    "declares exactly the output the sandbox produces, or names the browser boundary truthfully",
    async () => {
      const rows = collectJavascriptRows();
      const mismatches: string[] = [];
      const unexplainedErrors: string[] = [];
      const unlabelledBrowserRows: string[] = [];

      for (const row of rows) {
        const result = await runInSandbox(row.code);
        if (!result) continue;

        if (result.error) {
          if (BROWSER_BOUNDARY_ERROR.test(result.error)) {
            // Browser-only code cannot run in the Worker, so its declared output must say so
            // instead of presenting a console transcript the worker never prints.
            if (row.declared.trim() && !BROWSER_WORDING.test(row.declared)) unlabelledBrowserRows.push(`${row.where} -> ${row.declared}`);
            continue;
          }
          if (DELIBERATE_BREAK.test(row.where) || row.kind === "starter") continue;
          unexplainedErrors.push(`${row.where} -> ${result.error}`);
          continue;
        }

        if (row.kind === "starter") {
          if (row.declared.trim()) mismatches.push(`${row.where} declares output for a starter scaffold`);
          continue;
        }
        if (!row.declared.trim()) continue;
        if ((result.output ?? "").trim() !== row.declared.trim()) {
          mismatches.push(`${row.where} declares ${JSON.stringify(row.declared)} but the sandbox prints ${JSON.stringify(result.output ?? "")}`);
        }
      }

      expect({ mismatches, unexplainedErrors, unlabelledBrowserRows }).toEqual({
        mismatches: [],
        unexplainedErrors: [],
        unlabelledBrowserRows: [],
      });
    },
    60_000,
  );
});
