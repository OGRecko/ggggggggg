import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { JavaScriptRunner, javascriptWorkerSource } from "./javascriptRunner";
import type { RunResult } from "./pythonRunner";

type WorkerResult = RunResult & { id: number };
type WorkerRequest = { id: number; code: string; input?: string };
type WorkerListener = (event: MessageEvent<WorkerResult>) => void;

class MockWorker {
  static instances: MockWorker[] = [];

  static reset() {
    MockWorker.instances = [];
  }

  readonly listeners = new Set<WorkerListener>();
  readonly postedMessages: WorkerRequest[] = [];
  terminated = false;

  constructor(readonly source: string | URL) {
    MockWorker.instances.push(this);
  }

  addEventListener(type: string, listener: WorkerListener) {
    if (type === "message") this.listeners.add(listener);
  }

  removeEventListener(type: string, listener: WorkerListener) {
    if (type === "message") this.listeners.delete(listener);
  }

  postMessage(message: WorkerRequest) {
    this.postedMessages.push(message);
  }

  terminate() {
    this.terminated = true;
  }

  dispatch(data: WorkerResult) {
    for (const listener of [...this.listeners]) listener({ data } as MessageEvent<WorkerResult>);
  }
}

/** Runs the real Worker source here so formatting, appended input, and output limits are exercised. */
async function runWorkerSource(code: string, input?: string): Promise<WorkerResult> {
  const messages: WorkerResult[] = [];
  const fakeSelf: {
    postMessage: (message: WorkerResult) => void;
    onmessage?: (event: { data: WorkerRequest }) => Promise<void>;
    eval?: unknown;
    Function?: unknown;
  } = { postMessage: (message) => messages.push(message) };
  const evaluate = new Function("self", "setTimeout", "clearTimeout", "setInterval", "clearInterval", "Promise", `${javascriptWorkerSource}`);
  evaluate(fakeSelf, setTimeout, clearTimeout, setInterval, clearInterval, Promise);
  await fakeSelf.onmessage!({ data: input === undefined ? { id: 1, code } : { id: 1, code, input } });
  return messages[messages.length - 1];
}

describe("JavaScript worker source", () => {
  it("executes user code and reports its console output", async () => {
    const result = await runWorkerSource('console.log("Hello, JavaScript!");');
    expect(result.error).toBeUndefined();
    expect(result.output).toBe("Hello, JavaScript!");
  });

  it("formats numbers, collections, objects, and functions like a readable console", async () => {
    const result = await runWorkerSource([
      "console.log(NaN, Infinity, -Infinity, -0, 5n);",
      'console.log([1, "a"]);',
      'console.log({ a: 1, "needs-quote": "ready" });',
      "function f() {}",
      "console.log(f);",
      "console.log(undefined);",
      'console.log(3 === Number("3"));',
    ].join("\n"));
    expect(result.error).toBeUndefined();
    expect(result.output).toBe([
      "NaN Infinity -Infinity -0 5n",
      "[ 1, 'a' ]",
      "{ a: 1, 'needs-quote': 'ready' }",
      "[Function: f]",
      "undefined",
      "true",
    ].join("\n"));
  });

  it("renders cycles without crashing or hiding the rest of the console line", async () => {
    const result = await runWorkerSource('const item = { label: "loop" }; item.self = item; console.log(item);');
    expect(result.error).toBeUndefined();
    expect(result.output).toBe("{ label: 'loop', self: [Circular] }");
  });

  it("reads line-oriented test input from the same Worker run", async () => {
    const result = await runWorkerSource('console.log(readLine());\nconsole.log(readLine());', "Ada\nChen");
    expect(result.error).toBeUndefined();
    expect(result.output).toBe("Ada\nChen");
  });

  it("reports missing test input rather than inventing an empty line", async () => {
    const result = await runWorkerSource("readLine();");
    expect(result.error).toContain("No more test input available");
    expect(result.failureKind).toBe("runtime");
  });

  it("awaits async work before reporting the output", async () => {
    const result = await runWorkerSource('async function status() { return "ready"; }\nstatus().then(console.log);');
    expect(result.error).toBeUndefined();
    expect(result.output).toBe("ready");
  });

  it("returns bounded JSON-compatible state separately from console output", async () => {
    const result = await runWorkerSource('console.log("preview"); __codeforgeReportState({ count: 2, enabled: false, values: [1, "ready"] });');
    expect(result.error).toBeUndefined();
    expect(result.output).toBe("preview");
    expect(result.stateCaptured).toBe(true);
    expect(result.state).toEqual({ count: 2, enabled: false, values: [1, "ready"] });

    const nullState = await runWorkerSource("__codeforgeReportState(null);");
    expect(nullState.stateCaptured).toBe(true);
    expect(nullState.state).toBeNull();
  });

  it("rejects oversized and circular structured state instead of silently truncating it", async () => {
    const oversized = await runWorkerSource('__codeforgeReportState({ value: "x".repeat(8100) });');
    expect(oversized.failureKind).toBe("limit");
    expect(oversized.error).toContain("runner limits structured state");

    const circular = await runWorkerSource('const state = {}; state.self = state; __codeforgeReportState(state);');
    expect(circular.failureKind).toBe("type");
    expect(circular.error).toContain("must not contain circular references");
  });

  it("caps console output and reports truncation rather than passing a partial transcript", async () => {
    const result = await runWorkerSource('console.log("x".repeat(9000));');
    expect(result.output?.length).toBeLessThanOrEqual(8_000);
    expect(result.output).toContain("[output truncated after browser safety limits]");
    expect(result.outputTruncated).toBe(true);
  });

  it("caps the number of printed lines and keeps the transcript bounded", async () => {
    const result = await runWorkerSource('for (let i = 0; i < 250; i += 1) console.log(i);');
    expect(result.output?.length).toBeLessThanOrEqual(8_000);
    expect(result.output?.split("\n")).toHaveLength(200);
    expect(result.outputTruncated).toBe(true);
  });

  it("limits timer scheduling within one submission", async () => {
    const result = await runWorkerSource('for (let i = 0; i < 101; i += 1) setTimeout(() => {}, 0);');
    expect(result.error).toContain("limits each submission to 100 scheduled timers");
    expect(result.failureKind).toBe("limit");
  });

  it("reports a failing console.assert as output instead of throwing", async () => {
    const result = await runWorkerSource('console.assert(1 === 2, "mismatch");\nconsole.log("still running");');
    expect(result.error).toBeUndefined();
    expect(result.output).toBe("Assertion failed: mismatch\nstill running");
  });

  it("keeps a passing console.assert silent", async () => {
    const result = await runWorkerSource('console.assert(2 + 2 === 4);\nconsole.log("checked");');
    expect(result.error).toBeUndefined();
    expect(result.output).toBe("checked");
  });

  it("blocks shadowed networking and worker names with an honest message", async () => {
    const result = await runWorkerSource('fetch("https://example.test");');
    expect(result.error).toBe("CodeForge blocks browser-side networking and nested worker creation in the JavaScript runner.");
    expect(result.failureKind).toBe("runtime");
    expect(result.output).toBe("");
  });

  it("blocks indirect eval at the worker scope", async () => {
    const savedEval = globalThis.eval;
    const messages: WorkerResult[] = [];
    const fakeSelf: {
      postMessage: (message: WorkerResult) => void;
      onmessage?: (event: { data: WorkerRequest }) => Promise<void>;
      eval?: unknown;
      Function?: unknown;
    } = { postMessage: (message) => messages.push(message) };
    const mirror = new Proxy(fakeSelf, {
      set(target, property, value) {
        if (property === "eval") (globalThis as { eval: unknown }).eval = value;
        (target as Record<string | symbol, unknown>)[property] = value;
        return true;
      },
    });
    try {
      const evaluate = new Function("self", "setTimeout", "clearTimeout", "setInterval", "clearInterval", "Promise", `${javascriptWorkerSource}`);
      evaluate(mirror, setTimeout, clearTimeout, setInterval, clearInterval, Promise);
      await fakeSelf.onmessage!({ data: { id: 1, code: '(0, eval)("1 + 1");' } });
    } finally {
      (globalThis as { eval: unknown }).eval = savedEval;
    }
    expect(messages[messages.length - 1].error).toContain("CodeForge blocks browser-side networking");
  });

  it("reports a real error message and line for browser-only code", async () => {
    const result = await runWorkerSource('const title = document.querySelector("h1");');
    expect(result.output).toBe("");
    expect(result.error).toContain("document is not defined");
    expect(result.failureKind).toBe("runtime");
    expect(result.errorLine).toBeGreaterThanOrEqual(1);
  });
});

describe("JavaScriptRunner", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    MockWorker.reset();
    vi.stubGlobal("window", globalThis as unknown as Window & typeof globalThis);
    vi.stubGlobal("Worker", MockWorker as unknown as typeof Worker);
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:javascript-runner");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("routes worker output back to the matching run and reuses one worker", async () => {
    const runner = new JavaScriptRunner();
    const firstRun = runner.run('console.log("first")');
    const worker = MockWorker.instances[0];
    expect(worker.postedMessages).toEqual([{ id: 1, code: 'console.log("first")' }]);

    worker.dispatch({ id: 999, output: "ignore me" });
    await Promise.resolve();
    worker.dispatch({ id: 1, output: "first" });
    await expect(firstRun).resolves.toEqual({ id: 1, output: "first" });
    expect(worker.listeners.size).toBe(0);

    const secondRun = runner.run('console.log("second")');
    expect(MockWorker.instances).toHaveLength(1);
    expect(worker.postedMessages[1]).toEqual({ id: 2, code: 'console.log("second")' });
    worker.dispatch({ id: 2, output: "second" });
    await expect(secondRun).resolves.toEqual({ id: 2, output: "second" });
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:javascript-runner");
  });

  it("sends a case's input only when one is supplied", async () => {
    const runner = new JavaScriptRunner();
    const noInput = runner.run("console.log(1)");
    const worker = MockWorker.instances[0];
    expect(worker.postedMessages[0]).toEqual({ id: 1, code: "console.log(1)" });
    worker.dispatch({ id: 1, output: "1" });
    await noInput;

    const withInput = runner.run("console.log(readLine())", 500, "Ada");
    expect(worker.postedMessages[1]).toEqual({ id: 2, code: "console.log(readLine())", input: "Ada" });
    worker.dispatch({ id: 2, output: "Ada" });
    await withInput;
  });

  it("times out code, resets the worker, and uses a fresh worker for the retry", async () => {
    const runner = new JavaScriptRunner();
    const timedOutRun = runner.run("while (true) {}", 25);
    const firstWorker = MockWorker.instances[0];
    await vi.advanceTimersByTimeAsync(25);
    await expect(timedOutRun).resolves.toEqual({
      output: "",
      error: "The JavaScript worker took too long, so CodeForge stopped it. Check for a loop that never ends.",
      timedOut: true,
      failureKind: "timeout",
    });
    expect(firstWorker.terminated).toBe(true);

    const retriedRun = runner.run('console.log("after reset")');
    expect(MockWorker.instances).toHaveLength(2);
    const secondWorker = MockWorker.instances[1];
    secondWorker.dispatch({ id: 2, output: "after reset" });
    await expect(retriedRun).resolves.toEqual({ id: 2, output: "after reset" });
  });

  it("clamps test timeouts to ten seconds", async () => {
    const runner = new JavaScriptRunner();
    const pending = runner.run("while (true) {}", 90_000);
    await vi.advanceTimersByTimeAsync(9_999);
    expect(MockWorker.instances[0].terminated).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await expect(pending).resolves.toMatchObject({ timedOut: true, failureKind: "timeout" });
  });

  it("rejects oversized code and input before creating a worker", async () => {
    const runner = new JavaScriptRunner();
    await expect(runner.run("x".repeat(20_001))).resolves.toMatchObject({ failureKind: "limit" });
    await expect(runner.run("console.log(1)", 2500, "x".repeat(20_001))).resolves.toMatchObject({ failureKind: "limit" });
    expect(MockWorker.instances).toHaveLength(0);
  });

  it("terminates the current worker when reset is called explicitly", () => {
    const runner = new JavaScriptRunner();
    void runner.run('console.log("keep worker alive")');
    const worker = MockWorker.instances[0];
    runner.reset();
    expect(worker.terminated).toBe(true);
  });
});
