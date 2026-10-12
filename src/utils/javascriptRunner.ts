import type { RunResult } from "./pythonRunner";

type WorkerMessage = RunResult & { id: number };

const MAX_CODE_LENGTH = 20_000;
const MAX_OUTPUT_LINES = 200;
const MAX_OUTPUT_CHARS = 8_000;

export const javascriptWorkerSource = `
const MAX_OUTPUT_LINES = ${MAX_OUTPUT_LINES};
const MAX_OUTPUT_CHARS = ${MAX_OUTPUT_CHARS};

// Indirect eval and the global Function constructor resolve outside the shadowed parameter list,
// so they are replaced at the worker scope. The real Function is captured first because this
// worker builds the user-code wrapper with it.
const RealFunction = Function;
const blockedInWorker = () => {
  throw new Error("CodeForge blocks browser-side networking and nested worker creation in the JavaScript runner.");
};
self.eval = blockedInWorker;
self.Function = blockedInWorker;

const MAX_INSPECT_DEPTH = 4;
const MAX_INSPECT_ITEMS = 100;

function quoteString(value) {
  return "'" + value
    .replaceAll(String.fromCharCode(92), String.fromCharCode(92, 92))
    .replace(/'/g, "\\'")
    .replace(/\\n/g, "\\n")
    .replace(/\\r/g, "\\r")
    .replace(/\\t/g, "\\t") + "'";
}

function formatKey(key) {
  return /^[A-Za-z_$][\\w$]*$/.test(key) ? key : quoteString(key);
}

function inspectValue(value, depth, seen, nested) {
  if (typeof value === "string") return nested ? quoteString(value) : value;
  if (typeof value === "undefined") return "undefined";
  if (typeof value === "boolean") return String(value);
  if (value === null) return "null";
  if (typeof value === "number") {
    if (Number.isNaN(value)) return "NaN";
    if (value === Infinity) return "Infinity";
    if (value === -Infinity) return "-Infinity";
    if (Object.is(value, -0)) return "-0";
    return String(value);
  }
  if (typeof value === "bigint") return String(value) + "n";
  if (typeof value === "symbol") return String(value);
  if (typeof value === "function") {
    return value.name ? "[Function: " + value.name + "]" : "[Function (anonymous)]";
  }
  if (value instanceof RegExp) return String(value);
  if (value instanceof Date) {
    try { return isNaN(value.getTime()) ? "Invalid Date" : value.toISOString(); }
    catch { return "Invalid Date"; }
  }
  if (value instanceof Error) return (value.name || "Error") + (value.message ? ": " + value.message : "");
  if (depth >= MAX_INSPECT_DEPTH) return Array.isArray(value) ? "[Array]" : "[Object]";
  if (seen.has(value)) return "[Circular]";

  seen.add(value);
  let rendered;
  try {
    if (Array.isArray(value)) {
      const items = [];
      const count = Math.min(value.length, MAX_INSPECT_ITEMS);
      for (let index = 0; index < count; index += 1) {
        if (!(index in value)) {
          items.push("<empty item>");
          continue;
        }
        const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
        if (descriptor && !("value" in descriptor)) {
          items.push(descriptor.get && descriptor.set ? "[Getter/Setter]" : descriptor.get ? "[Getter]" : "[Setter]");
        } else {
          items.push(inspectValue(value[index], depth + 1, seen, true));
        }
      }
      if (value.length > count) items.push("... " + (value.length - count) + " more items");
      rendered = items.length ? "[ " + items.join(", ") + " ]" : "[]";
    } else if (value instanceof Map) {
      const entries = [];
      let count = 0;
      for (const [key, item] of value) {
        if (count >= MAX_INSPECT_ITEMS) break;
        entries.push(inspectValue(key, depth + 1, seen, true) + " => " + inspectValue(item, depth + 1, seen, true));
        count += 1;
      }
      if (value.size > count) entries.push("... " + (value.size - count) + " more items");
      rendered = value.size ? "Map(" + value.size + ") { " + entries.join(", ") + " }" : "Map(0) {}";
    } else if (value instanceof Set) {
      const items = [];
      let count = 0;
      for (const item of value) {
        if (count >= MAX_INSPECT_ITEMS) break;
        items.push(inspectValue(item, depth + 1, seen, true));
        count += 1;
      }
      if (value.size > count) items.push("... " + (value.size - count) + " more items");
      rendered = value.size ? "Set(" + value.size + ") { " + items.join(", ") + " }" : "Set(0) {}";
    } else {
      const keys = Object.keys(value);
      const fields = [];
      const count = Math.min(keys.length, MAX_INSPECT_ITEMS);
      for (const key of keys.slice(0, count)) {
        const descriptor = Object.getOwnPropertyDescriptor(value, key);
        const fieldValue = descriptor && !("value" in descriptor)
          ? descriptor.get && descriptor.set ? "[Getter/Setter]" : descriptor.get ? "[Getter]" : "[Setter]"
          : inspectValue(value[key], depth + 1, seen, true);
        fields.push(formatKey(key) + ": " + fieldValue);
      }
      if (keys.length > count) fields.push("... " + (keys.length - count) + " more items");
      const prefix = Object.getPrototypeOf(value) === null ? "[Object: null prototype] " : "";
      rendered = fields.length ? prefix + "{ " + fields.join(", ") + " }" : prefix + "{}";
    }
  } catch {
    rendered = "[Object]";
  } finally {
    seen.delete(value);
  }
  return rendered;
}

function stringifyValue(value) {
  return inspectValue(value, 0, new Set(), false);
}

self.onmessage = async (event) => {
  const { id, code } = event.data;
  const output = [];
  let outputChars = 0;
  let truncated = false;

  const pushLine = (line) => {
    if (truncated) return;
    const normalized = String(line);
    const nextLength = outputChars + normalized.length + (output.length > 0 ? 1 : 0);
    if (output.length >= MAX_OUTPUT_LINES || nextLength > MAX_OUTPUT_CHARS) {
      truncated = true;
      output.push("[output truncated after browser safety limits]");
      return;
    }
    output.push(normalized);
    outputChars = nextLength;
  };

  try {
    const log = (...values) => pushLine(values.map(stringifyValue).join(" "));
    const blocked = () => {
      throw new Error("CodeForge blocks browser-side networking and nested worker creation in the JavaScript runner.");
    };
    // A strict-mode function body may not declare a parameter named eval, so eval is blocked at
    // the worker scope below instead of being shadowed here.
    const consoleShim = {
      log,
      error: log,
      warn: log,
      info: log,
      // Browser semantics: a failing assertion is reported as console output and execution
      // continues, unlike a thrown Error.
      assert: (condition, ...values) => {
        if (!condition) pushLine(["Assertion failed:", ...values.map(stringifyValue)].join(" "));
      },
    };
    const runner = new RealFunction(
      "console",
      "globalThis",
      "self",
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
      '"use strict";\\n' + code,
    );
    const shared = Object.freeze({ setTimeout, clearTimeout, setInterval, clearInterval, Promise, Math, Date, JSON });
    const result = runner(
      consoleShim,
      shared,
      shared,
      blocked,
      blocked,
      blocked,
      blocked,
      blocked,
      blocked,
      blocked,
      blocked,
      blocked,
      undefined,
    );
    await Promise.resolve(result);
    await Promise.resolve();
    self.postMessage({ id, output: output.join("\\n") });
  } catch (error) {
    const stack = error && error.stack ? error.stack : String(error);
    const match = stack.match(/<anonymous>:(\\d+):(\\d+)/);
    self.postMessage({
      id,
      output: output.join("\\n"),
      error: error && error.message ? error.message : String(error),
      errorLine: match ? Math.max(1, Number(match[1]) - 1) : undefined,
    });
  }
};
`;

export class JavaScriptRunner {
  private worker: Worker | null = null;
  private sequence = 0;

  private getWorker() {
    if (this.worker) return this.worker;
    const source = URL.createObjectURL(new Blob([javascriptWorkerSource], { type: "text/javascript" }));
    this.worker = new Worker(source);
    URL.revokeObjectURL(source);
    return this.worker;
  }

  run(code: string, timeout = 2500): Promise<RunResult> {
    if (code.length > MAX_CODE_LENGTH) {
      return Promise.resolve({
        output: "",
        error: `This JavaScript submission is too large for the in-browser runner (${code.length} characters). Keep examples focused or split the work into smaller functions.`,
      });
    }

    const worker = this.getWorker();
    const id = ++this.sequence;
    return new Promise((resolve) => {
      const timer = window.setTimeout(() => {
        this.reset();
        resolve({ output: "", error: "The JavaScript worker took too long, so CodeForge stopped it. Check for a loop that never ends.", timedOut: true });
      }, timeout);
      const listener = (event: MessageEvent<WorkerMessage>) => {
        if (event.data.id !== id) return;
        window.clearTimeout(timer);
        worker.removeEventListener("message", listener);
        resolve(event.data);
      };
      worker.addEventListener("message", listener);
      worker.postMessage({ id, code });
    });
  }

  reset() {
    this.worker?.terminate();
    this.worker = null;
  }
}
