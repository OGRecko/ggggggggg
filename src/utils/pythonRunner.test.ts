import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PythonRunner } from "./pythonRunner";

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
