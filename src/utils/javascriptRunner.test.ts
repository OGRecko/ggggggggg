import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { JavaScriptRunner, javascriptWorkerSource } from "./javascriptRunner";

type WorkerListener = (event: MessageEvent<{ id: number; output?: string; error?: string }>) => void;

class MockWorker {
  static instances: MockWorker[] = [];

  static reset() {
    MockWorker.instances = [];
  }

  readonly listeners = new Set<WorkerListener>();
  readonly postedMessages: Array<{ id: number; code: string }> = [];
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

  postMessage(message: { id: number; code: string }) {
    this.postedMessages.push(message);
  }

  terminate() {
    this.terminated = true;
  }

  dispatch(data: { id: number; output?: string; error?: string }) {
    for (const listener of [...this.listeners]) {
      listener({ data } as MessageEvent<{ id: number; output?: string; error?: string }>);
    }
  }
}

type WorkerResult = { id: number; output?: string; error?: string; errorLine?: number };

/** Runs the real worker source in this process, so the sandbox semantics are actually exercised. */
async function runWorkerSource(code: string): Promise<WorkerResult> {
  const messages: WorkerResult[] = [];
  const fakeSelf: { postMessage: (message: WorkerResult) => void; onmessage?: (event: { data: { id: number; code: string } }) => Promise<void>; eval?: unknown; Function?: unknown } = {
    postMessage: (message) => messages.push(message),
  };
  const evaluate = new Function("self", "setTimeout", "clearTimeout", "setInterval", "clearInterval", "Promise", `${javascriptWorkerSource}`);
  evaluate(fakeSelf, setTimeout, clearTimeout, setInterval, clearInterval, Promise);
  await fakeSelf.onmessage!({ data: { id: 1, code } });
  return messages[messages.length - 1];
}

describe("JavaScript worker source", () => {
  it("executes user code and reports its console output", async () => {
    const result = await runWorkerSource('console.log("Hello, JavaScript!");');
    expect(result.error).toBeUndefined();
    expect(result.output).toBe("Hello, JavaScript!");
  });

  it("formats values the way the lessons describe them", async () => {
    const result = await runWorkerSource('console.log([1, 2, 3]);\nconsole.log({ mode: "study" });\nconsole.log(undefined);\nconsole.log(3 === Number("3"));');
    expect(result.error).toBeUndefined();
    expect(result.output).toBe('[1,2,3]\n{"mode":"study"}\nundefined\ntrue');
  });

  it("awaits async work before reporting the output", async () => {
    const result = await runWorkerSource('async function status() { return "ready"; }\nstatus().then(console.log);');
    expect(result.error).toBeUndefined();
    expect(result.output).toBe("ready");
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
    expect(result.output).toBe("");
  });

  it("blocks indirect eval at the worker scope", async () => {
    // In a real Worker, self is the global object, so assigning self.eval replaces indirect eval.
    // This harness mirrors that one assignment on globalThis and restores it afterwards; the
    // Function constructor is shadowed through the parameter list, which the harness exercises
    // directly.
    const savedEval = globalThis.eval;
    const messages: WorkerResult[] = [];
    const fakeSelf: { postMessage: (message: WorkerResult) => void; onmessage?: (event: { data: { id: number; code: string } }) => Promise<void>; eval?: unknown; Function?: unknown } = {
      postMessage: (message) => messages.push(message),
    };
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
    // The exact number depends on how the host formats stack frames, so the test only asserts that
    // the runner reports a usable line instead of inventing a browser-specific one.
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

    let resolved = false;
    const firstRun = runner.run('console.log("first")').then((value) => {
      resolved = true;
      return value;
    });

    expect(MockWorker.instances).toHaveLength(1);
    const worker = MockWorker.instances[0];
    expect(worker.postedMessages).toEqual([{ id: 1, code: 'console.log("first")' }]);

    worker.dispatch({ id: 999, output: "ignore me" });
    await Promise.resolve();
    expect(resolved).toBe(false);

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

  it("times out long-running code, resets the worker, and creates a fresh worker next time", async () => {
    const runner = new JavaScriptRunner();
    const timedOutRun = runner.run("while (true) {}", 25);

    expect(MockWorker.instances).toHaveLength(1);
    const firstWorker = MockWorker.instances[0];

    await vi.advanceTimersByTimeAsync(25);
    await expect(timedOutRun).resolves.toEqual({
      output: "",
      error: "The JavaScript worker took too long, so CodeForge stopped it. Check for a loop that never ends.",
      timedOut: true,
    });
    expect(firstWorker.terminated).toBe(true);

    const retriedRun = runner.run('console.log("after reset")');
    expect(MockWorker.instances).toHaveLength(2);
    const secondWorker = MockWorker.instances[1];
    secondWorker.dispatch({ id: 2, output: "after reset" });
    await expect(retriedRun).resolves.toEqual({ id: 2, output: "after reset" });
  });

  it("rejects oversized code before creating a worker", async () => {
    const runner = new JavaScriptRunner();
    const largeProgram = "x".repeat(20_001);

    await expect(runner.run(largeProgram)).resolves.toEqual({
      output: "",
      error: `This JavaScript submission is too large for the in-browser runner (${largeProgram.length} characters). Keep examples focused or split the work into smaller functions.`,
    });
    expect(MockWorker.instances).toHaveLength(0);
  });

  it("terminates the current worker when reset is called explicitly", () => {
    const runner = new JavaScriptRunner();
    void runner.run('console.log("keep worker alive")');

    expect(MockWorker.instances).toHaveLength(1);
    const worker = MockWorker.instances[0];
    runner.reset();
    expect(worker.terminated).toBe(true);
  });
});
