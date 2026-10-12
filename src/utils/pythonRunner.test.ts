import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PythonRunner, pythonWorkerSource } from "./pythonRunner";

type WorkerListener = (event: MessageEvent<{ id: number; output?: string; error?: string; errorLine?: number }>) => void;

class MockWorker {
  static instances: MockWorker[] = [];

  static reset() {
    MockWorker.instances = [];
  }

  readonly listeners = new Set<WorkerListener>();
  readonly postedMessages: Array<{ id: number; code: string; input: string }> = [];
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

  postMessage(message: { id: number; code: string; input: string }) {
    this.postedMessages.push(message);
  }

  terminate() {
    this.terminated = true;
  }

  dispatch(data: { id: number; output?: string; error?: string; errorLine?: number }) {
    for (const listener of [...this.listeners]) {
      listener({ data } as MessageEvent<{ id: number; output?: string; error?: string; errorLine?: number }>);
    }
  }
}

type FakePyGlobals = {
  values: Map<string, unknown>;
  destroyed: boolean;
  set(name: string, value: unknown): void;
  destroy(): void;
};

function makePythonWorkerHarness(webAssembly: { Suspending?: unknown }) {
  const runs: Array<{ source: string; globals: FakePyGlobals }> = [];
  const namespaces: FakePyGlobals[] = [];
  const messages: Array<{ id: number; output?: string; error?: string }> = [];
  const pyodide = {
    setStdout: () => {},
    setStderr: () => {},
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
    },
  };
  const self: {
    postMessage: (message: { id: number; output?: string; error?: string }) => void;
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

    let resolved = false;
    const run = runner.run('name = input()\nprint(name)', "Ada").then((value) => {
      resolved = true;
      return value;
    });

    expect(MockWorker.instances).toHaveLength(1);
    const worker = MockWorker.instances[0];
    expect(worker.postedMessages).toEqual([{ id: 1, code: 'name = input()\nprint(name)', input: "Ada" }]);

    worker.dispatch({ id: 77, output: "ignore me" });
    await Promise.resolve();
    expect(resolved).toBe(false);

    worker.dispatch({ id: 1, output: "Ada" });
    await expect(run).resolves.toEqual({ id: 1, output: "Ada" });
    expect(worker.listeners.size).toBe(0);
  });

  it("returns worker errors with the reported line number", async () => {
    const runner = new PythonRunner();
    const run = runner.run("print(1/0)");

    expect(MockWorker.instances).toHaveLength(1);
    const worker = MockWorker.instances[0];
    worker.dispatch({ id: 1, output: "", error: "ZeroDivisionError: division by zero", errorLine: 1 });

    await expect(run).resolves.toEqual({ id: 1, output: "", error: "ZeroDivisionError: division by zero", errorLine: 1 });
  });

  it("times out long-running code, resets the worker, and creates a new worker for the retry", async () => {
    const runner = new PythonRunner();
    const timedOutRun = runner.run("while True:\n    pass", "", 40);

    expect(MockWorker.instances).toHaveLength(1);
    const firstWorker = MockWorker.instances[0];

    await vi.advanceTimersByTimeAsync(40);
    await expect(timedOutRun).resolves.toEqual({
      output: "",
      error: "The program took too long, so the sandbox stopped it. Check for a loop that never ends.",
      timedOut: true,
    });
    expect(firstWorker.terminated).toBe(true);

    const retriedRun = runner.run('print("done")');
    expect(MockWorker.instances).toHaveLength(2);
    const secondWorker = MockWorker.instances[1];
    secondWorker.dispatch({ id: 2, output: "done" });
    await expect(retriedRun).resolves.toEqual({ id: 2, output: "done" });
  });

  it("terminates the current worker when reset is called explicitly", () => {
    const runner = new PythonRunner();
    void runner.run('print("keep worker alive")');

    expect(MockWorker.instances).toHaveLength(1);
    const worker = MockWorker.instances[0];
    runner.reset();
    expect(worker.terminated).toBe(true);
  });
});
