import type { RunResult } from "./pythonRunner";

type WorkerMessage = RunResult & { id: number };

const workerSource = `
self.onmessage = async (event) => {
  const { id, code } = event.data;
  const output = [];
  try {
    const log = (...values) => output.push(values.map((value) => typeof value === "string" ? value : JSON.stringify(value)).join(" "));
    const runner = new Function("console", '"use strict";\\n' + code);
    const result = runner({ log, error: log, warn: log });
    // Allow Promise callbacks scheduled by a synchronous entry point to settle before output is captured.
    await Promise.resolve(result);
    await Promise.resolve();
    self.postMessage({ id, output: output.join("\\n") });
  } catch (error) {
    const stack = error && error.stack ? error.stack : String(error);
    const match = stack.match(/<anonymous>:(\\d+):(\\d+)/);
    self.postMessage({ id, output: output.join("\\n"), error: error && error.message ? error.message : String(error), errorLine: match ? Math.max(1, Number(match[1]) - 1) : undefined });
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