import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { JavaScriptRunner } from "./javascriptRunner";

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
