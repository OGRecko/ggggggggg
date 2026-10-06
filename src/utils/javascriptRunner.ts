import type { RunResult } from "./pythonRunner";

type WorkerMessage = RunResult & { id: number };

const MAX_CODE_LENGTH = 20_000;
const MAX_OUTPUT_LINES = 200;
const MAX_OUTPUT_CHARS = 8_000;

const workerSource = `
const MAX_OUTPUT_LINES = ${MAX_OUTPUT_LINES};
const MAX_OUTPUT_CHARS = ${MAX_OUTPUT_CHARS};

function stringifyValue(value) {
  if (typeof value === "string") return value;
  if (typeof value === "undefined") return "undefined";
  if (typeof value === "function") return "[function]";
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
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
    const runner = new Function(
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
      "eval",
      '"use strict";\\n' + code,
    );
    const result = runner(
      { log, error: log, warn: log, info: log },
      Object.freeze({ setTimeout, clearTimeout, setInterval, clearInterval, Promise, Math, Date, JSON }),
      Object.freeze({ setTimeout, clearTimeout, setInterval, clearInterval, Promise, Math, Date, JSON }),
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
    const source = URL.createObjectURL(new Blob([workerSource], { type: "text/javascript" }));
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
