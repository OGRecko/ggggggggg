import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PythonRunner, pythonWorkerSource } from "./pythonRunner";
import type { RunResult } from "./pythonRunner";

type WorkerResult = RunResult & { id: number };
type WorkerRequest = { id: number; code: string; input: string };
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

type FakePyGlobals = {
  values: Map<string, unknown>;
  destroyed: boolean;
  set(name: string, value: unknown): void;
  destroy(): void;
};
type OutputBatch = (text: string) => void;
type SimulatePython = (stdout: OutputBatch, stderr: OutputBatch, source: string, globals: FakePyGlobals) => void;

function makePythonWorkerHarness(webAssembly: { Suspending?: unknown }, simulate?: SimulatePython) {
  const runs: Array<{ source: string; globals: FakePyGlobals }> = [];
  const namespaces: FakePyGlobals[] = [];
  const messages: WorkerResult[] = [];
  let stdout: OutputBatch = () => {};
  let stderr: OutputBatch = () => {};
  const pyodide = {
    setStdout: (config: { batched: OutputBatch }) => { stdout = config.batched; },
    setStderr: (config: { batched: OutputBatch }) => { stderr = config.batched; },
    loadPackagesFromImports: async () => {},
    runPython: () => {
      const globals: FakePyGlobals = {
        values: new Map(),
        destroyed: false,
        set(name, value) { this.values.set(name, value); },
        destroy() { this.destroyed = true; },
      };
      namespaces.push(globals);
      return globals;
    },
    runPythonAsync: async (source: string, options: { globals: FakePyGlobals }) => {
      runs.push({ source, globals: options.globals });
      if (!source.startsWith("import sys") && simulate) simulate(stdout, stderr, source, options.globals);
    },
  };
  const self: {
    postMessage: (message: WorkerResult) => void;
    onmessage?: (event: { data: { id: number; code: string; input?: string } }) => Promise<void>;
  } = { postMessage: (message) => messages.push(message) };
  const createWorker = new Function("self", "importScripts", "loadPyodide", "WebAssembly", pythonWorkerSource);
  createWorker(self, () => {}, async () => pyodide, webAssembly);
  return { self, runs, namespaces, messages };
}

describe("Python worker source", () => {
  it("creates a fresh __main__ namespace for each submission", async () => {
    const harness = makePythonWorkerHarness({});
    await harness.self.onmessage!({ data: { id: 1, code: "value = 41" } });
    await harness.self.onmessage!({ data: { id: 2, code: "print(value)" } });

    expect(harness.namespaces).toHaveLength(2);
    expect(harness.namespaces[0].values.get("__name__")).toBe("__main__");
    expect(harness.namespaces[1].values.get("__name__")).toBe("__main__");
    const programRuns = harness.runs.filter((run) => !run.source.startsWith("import sys"));
    const flushRuns = harness.runs.filter((run) => run.source.startsWith("import sys"));
    expect(programRuns).toHaveLength(2);
    expect(programRuns[0].globals).toBe(harness.namespaces[0]);
    expect(programRuns[1].globals).toBe(harness.namespaces[1]);
    expect(flushRuns).toHaveLength(2);
    expect(flushRuns[0].globals).toBe(harness.namespaces[0]);
    expect(flushRuns[1].globals).toBe(harness.namespaces[1]);
    expect(harness.namespaces.every((globals) => globals.destroyed)).toBe(true);
  });

  it("returns Python state through the structured Worker channel, separate from stdout", async () => {
    const harness = makePythonWorkerHarness({}, (_stdout, _stderr, _source, globals) => {
      const report = globals.values.get("__codeforgeReportState") as (value: unknown) => void;
      report({ points: 5, completed: false, labels: ["start", "review"] });
    });
    await harness.self.onmessage!({ data: { id: 1, code: "__codeforgeReportState({'points': 5})" } });
    expect(harness.messages[0]).toMatchObject({
      output: "",
      stateCaptured: true,
      state: { points: 5, completed: false, labels: ["start", "review"] },
    });
  });

  it("classifies an oversized structured state return as a resource limit", async () => {
    const harness = makePythonWorkerHarness({}, (_stdout, _stderr, _source, globals) => {
      const report = globals.values.get("__codeforgeReportState") as (value: unknown) => void;
      report({ payload: "x".repeat(8_100) });
    });
    await harness.self.onmessage!({ data: { id: 1, code: "pass" } });
    expect(harness.messages[0].failureKind).toBe("limit");
    expect(harness.messages[0].error).toContain("limits structured state");
  });

  it("uses top-level-await AST rewriting when WebAssembly.Suspending is absent", async () => {
    const harness = makePythonWorkerHarness({});
    const code = "import asyncio\\nasync def main():\\n    return 42\\nasyncio.run(main())";
    await harness.self.onmessage!({ data: { id: 1, code } });

    const executedSource = harness.runs[0].source;
    expect(executedSource).toContain("__CodeForgeRunToAwait");
    expect(executedSource).toContain("PyCF_ALLOW_TOP_LEVEL_AWAIT");
    expect(executedSource).toContain(JSON.stringify(code));
    expect(executedSource).not.toContain("asyncio.run(main())\\n");
  });

  it("leaves asyncio.run unchanged when the JSPI capability is present", async () => {
    const harness = makePythonWorkerHarness({ Suspending: function Suspending() {} });
    const code = "import asyncio\\nasyncio.run(main())";
    await harness.self.onmessage!({ data: { id: 1, code } });
    expect(harness.runs[0].source).toContain(code);
    expect(harness.runs[0].source).not.toContain("__CodeForgeRunToAwait");
  });

  it("caps actual Worker stdout and marks the result so truncated output cannot pass", async () => {
    const harness = makePythonWorkerHarness({}, (stdout) => stdout("x".repeat(20_000)));
    await harness.self.onmessage!({ data: { id: 1, code: "print('x')" } });
    const result = harness.messages[0];
    expect(result.output.length).toBeLessThanOrEqual(12_000);
    expect(result.output).toContain("[output truncated after sandbox safety limit]");
    expect(result.outputTruncated).toBe(true);
  });

  it("caps stderr as well as stdout", async () => {
    const harness = makePythonWorkerHarness({}, (_stdout, stderr) => {
      stderr("e".repeat(6_000));
      throw new Error("ValueError: test failure");
    });
    await harness.self.onmessage!({ data: { id: 1, code: "raise ValueError('test failure')" } });
    const result = harness.messages[0];
    expect(result.error?.length).toBeLessThanOrEqual(4_100);
    expect(result.error).toContain("[stderr truncated after sandbox safety limit]");
    expect(result.outputTruncated).toBe(true);
    expect(result.failureKind).toBe("runtime");
  });

  it("returns Python syntax and type classifications from real exception names", async () => {
    const syntaxHarness = makePythonWorkerHarness({}, () => { throw new SyntaxError("invalid Python syntax"); });
    await syntaxHarness.self.onmessage!({ data: { id: 1, code: "if" } });
    expect(syntaxHarness.messages[0].failureKind).toBe("syntax");

    const typeHarness = makePythonWorkerHarness({}, () => { throw new TypeError("unsupported operand"); });
    await typeHarness.self.onmessage!({ data: { id: 1, code: "1 + 'a'" } });
    expect(typeHarness.messages[0].failureKind).toBe("type");
  });
});

describe("PythonRunner", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    MockWorker.reset();
    vi.stubGlobal("window", globalThis as unknown as Window & typeof globalThis);
    vi.stubGlobal("Worker", MockWorker as unknown as typeof Worker);
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:python-runner");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("sends code and input to the worker and resolves the matching Python result", async () => {
    const runner = new PythonRunner();
    const run = runner.run('name = input()\nprint(name)', "Ada");
    expect(MockWorker.instances).toHaveLength(1);
    const worker = MockWorker.instances[0];
    expect(worker.postedMessages).toEqual([{ id: 1, code: 'name = input()\nprint(name)', input: "Ada" }]);

    worker.dispatch({ id: 77, output: "ignore me" });
    await Promise.resolve();
    worker.dispatch({ id: 1, output: "Ada" });
    await expect(run).resolves.toEqual({ id: 1, output: "Ada" });
    expect(worker.listeners.size).toBe(0);
  });

  it("returns worker errors with a reported line and classification", async () => {
    const runner = new PythonRunner();
    const run = runner.run("print(1/0)");
    const worker = MockWorker.instances[0];
    worker.dispatch({ id: 1, output: "", error: "ZeroDivisionError: division by zero", errorLine: 1, failureKind: "runtime" });
    await expect(run).resolves.toEqual({ id: 1, output: "", error: "ZeroDivisionError: division by zero", errorLine: 1, failureKind: "runtime" });
  });

  it("times out code, resets the worker, and creates a new worker for the retry", async () => {
    const runner = new PythonRunner();
    const timedOutRun = runner.run("while True:\n    pass", "", 40);
    const firstWorker = MockWorker.instances[0];
    await vi.advanceTimersByTimeAsync(40);
    await expect(timedOutRun).resolves.toEqual({
      output: "",
      error: "The program took too long, so the sandbox stopped it. Check for a loop that never ends.",
      timedOut: true,
      failureKind: "timeout",
    });
    expect(firstWorker.terminated).toBe(true);

    const retriedRun = runner.run('print("done")');
    const secondWorker = MockWorker.instances[1];
    secondWorker.dispatch({ id: 2, output: "done" });
    await expect(retriedRun).resolves.toEqual({ id: 2, output: "done" });
  });

  it("clamps test timeouts to ten seconds", async () => {
    const runner = new PythonRunner();
    const pending = runner.run("while True: pass", "", 90_000);
    await vi.advanceTimersByTimeAsync(9_999);
    expect(MockWorker.instances[0].terminated).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await expect(pending).resolves.toMatchObject({ timedOut: true, failureKind: "timeout" });
  });

  it("rejects oversized code and input before starting Pyodide", async () => {
    const runner = new PythonRunner();
    await expect(runner.run("x".repeat(30_001))).resolves.toMatchObject({ failureKind: "limit" });
    await expect(runner.run("print(1)", "x".repeat(20_001))).resolves.toMatchObject({ failureKind: "limit" });
    expect(MockWorker.instances).toHaveLength(0);
  });

  it("terminates the current worker when reset is called explicitly", () => {
    const runner = new PythonRunner();
    void runner.run('print("keep worker alive")');
    const worker = MockWorker.instances[0];
    runner.reset();
    expect(worker.terminated).toBe(true);
  });
});
