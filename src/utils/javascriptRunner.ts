import type { RunResult } from "./pythonRunner";

type WorkerMessage = RunResult & { id: number };

const MAX_CODE_LENGTH = 20_000;
const MAX_INPUT_LENGTH = 20_000;
const MAX_TIMEOUT_MS = 10_000;
const MAX_OUTPUT_LINES = 200;
const MAX_OUTPUT_CHARS = 8_000;
const MAX_SCHEDULED_TIMERS = 100;

export const javascriptWorkerSource = `
const MAX_OUTPUT_LINES = ${MAX_OUTPUT_LINES};
const MAX_OUTPUT_CHARS = ${MAX_OUTPUT_CHARS};
const MAX_SCHEDULED_TIMERS = ${MAX_SCHEDULED_TIMERS};

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
  const { id, code, input } = event.data;
  const output = [];
  let outputChars = 0;
  let truncated = false;
  const timeouts = new Set();
  const intervals = new Set();
  let scheduledTimers = 0;
  const truncationMarker = "[output truncated after browser safety limits]";

  const markTruncated = () => {
    if (truncated) return;
    truncated = true;
    while (output.length && output.length >= MAX_OUTPUT_LINES) output.pop();
    while (output.length && output.join("\\n").length + 1 + truncationMarker.length > MAX_OUTPUT_CHARS) output.pop();
    const prefix = output.join("\\n");
    const transcript = prefix ? prefix + "\\n" + truncationMarker : truncationMarker;
    output.length = 0;
    output.push(transcript.slice(0, MAX_OUTPUT_CHARS));
    outputChars = output[0].length;
  };

  const pushLine = (line) => {
    if (truncated) return;
    const normalized = String(line);
    const nextLength = outputChars + normalized.length + (output.length > 0 ? 1 : 0);
    if (output.length >= MAX_OUTPUT_LINES || nextLength + truncationMarker.length + 1 > MAX_OUTPUT_CHARS) {
      markTruncated();
      return;
    }
    output.push(normalized);
    outputChars = nextLength;
  };

  const readLines = input === undefined
    ? []
    : String(input).replace(/\\r\\n?/g, "\\n").split("\\n");
  let inputIndex = 0;
  const readLine = () => {
    if (inputIndex >= readLines.length) throw new Error("No more test input available.");
    return readLines[inputIndex++];
  };
  const schedule = (handler, delay, repeat) => {
    if (scheduledTimers >= MAX_SCHEDULED_TIMERS) throw new RangeError("The JavaScript runner limits each submission to 100 scheduled timers.");
    if (typeof handler !== "function") throw new TypeError("The JavaScript runner only accepts function timer callbacks.");
    scheduledTimers += 1;
    const boundedDelay = Math.max(0, Math.min(Number(delay) || 0, 5000));
    if (repeat) {
      const timer = setInterval(() => handler(), boundedDelay);
      intervals.add(timer);
      return timer;
    }
    let timer;
    timer = setTimeout(() => {
      timeouts.delete(timer);
      handler();
    }, boundedDelay);
    timeouts.add(timer);
    return timer;
  };
  const limitedSetTimeout = (handler, delay, ...args) => schedule(() => handler(...args), delay, false);
  const limitedSetInterval = (handler, delay, ...args) => schedule(() => handler(...args), delay, true);
  const limitedClearTimeout = (timer) => { clearTimeout(timer); timeouts.delete(timer); };
  const limitedClearInterval = (timer) => { clearInterval(timer); intervals.delete(timer); };

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
      "readLine",
      "setTimeout",
      "clearTimeout",
      "setInterval",
      "clearInterval",
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
    const shared = Object.freeze({ readLine, setTimeout: limitedSetTimeout, clearTimeout: limitedClearTimeout, setInterval: limitedSetInterval, clearInterval: limitedClearInterval, Promise, Math, Date, JSON });
    const result = runner(
      consoleShim,
      shared,
      shared,
      readLine,
      limitedSetTimeout,
      limitedClearTimeout,
      limitedSetInterval,
      limitedClearInterval,
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
    self.postMessage({ id, output: output.join("\\n"), ...(truncated ? { outputTruncated: true } : {}) });
  } catch (error) {
    const stack = error && error.stack ? error.stack : String(error);
    const match = stack.match(/<anonymous>:(\\d+):(\\d+)/);
    const errorName = error && error.name ? error.name : "Error";
    const errorMessage = error && error.message ? error.message : String(error);
    const failureKind = errorName === "SyntaxError" ? "syntax" : errorName === "TypeError" ? "type" : errorName === "RangeError" && errorMessage.includes("runner limits") ? "limit" : "runtime";
    self.postMessage({
      id,
      output: output.join("\\n"),
      error: error && error.message ? error.message : String(error),
      errorLine: match ? Math.max(1, Number(match[1]) - 1) : undefined,
      failureKind,
      ...(truncated ? { outputTruncated: true } : {}),
    });
  } finally {
    for (const timer of timeouts) clearTimeout(timer);
    for (const timer of intervals) clearInterval(timer);
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

  run(code: string, timeout = 2500, input?: string): Promise<RunResult> {
    if (code.length > MAX_CODE_LENGTH) {
      return Promise.resolve({
        output: "",
        error: `This JavaScript submission is too large for the in-browser runner (${code.length} characters; limit ${MAX_CODE_LENGTH}). Keep examples focused or split the work into smaller functions.`,
        failureKind: "limit",
      });
    }
    if ((input?.length ?? 0) > MAX_INPUT_LENGTH) {
      return Promise.resolve({
        output: "",
        error: `This JavaScript test input is too large for the in-browser runner (limit ${MAX_INPUT_LENGTH} characters).`,
        failureKind: "limit",
      });
    }

    const requestedTimeout = Number.isFinite(timeout) ? timeout : 2500;
    const timeoutLimit = Math.max(1, Math.min(requestedTimeout, MAX_TIMEOUT_MS));
    const worker = this.getWorker();
    const id = ++this.sequence;
    return new Promise((resolve) => {
      const timer = window.setTimeout(() => {
        this.reset();
        resolve({ output: "", error: "The JavaScript worker took too long, so CodeForge stopped it. Check for a loop that never ends.", timedOut: true, failureKind: "timeout" });
      }, timeoutLimit);
      const listener = (event: MessageEvent<WorkerMessage>) => {
        if (event.data.id !== id) return;
        window.clearTimeout(timer);
        worker.removeEventListener("message", listener);
        resolve(event.data);
      };
      worker.addEventListener("message", listener);
      worker.postMessage(input === undefined ? { id, code } : { id, code, input });
    });
  }

  reset() {
    this.worker?.terminate();
    this.worker = null;
  }
}
