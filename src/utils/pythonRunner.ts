export type RunResult = {
  output: string;
  error?: string;
  errorLine?: number;
  timedOut?: boolean;
};

type WorkerMessage = RunResult & { id: number };

const workerSource = `
let pyodideInstance;
let loadingPromise;

async function getPyodide() {
  if (pyodideInstance) return pyodideInstance;
  if (!loadingPromise) {
    importScripts("https://cdn.jsdelivr.net/pyodide/v0.29.3/full/pyodide.js");
    loadingPromise = loadPyodide({ indexURL: "https://cdn.jsdelivr.net/pyodide/v0.29.3/full/" });
  }
  pyodideInstance = await loadingPromise;
  return pyodideInstance;
}

self.onmessage = async (event) => {
  const { id, code, input } = event.data;
  let output = "";
  let errorOutput = "";
  try {
    if (code.length > 30000) throw new Error("Program is too large for the practice sandbox.");
    const pyodide = await getPyodide();
    pyodide.setStdout({ batched: (text) => { if (output.length < 12000) output += text + "\\n"; } });
    pyodide.setStderr({ batched: (text) => { if (errorOutput.length < 4000) errorOutput += text + "\\n"; } });
    // Let Pyodide load bundled packages required by a learner's imports before execution.
    await pyodide.loadPackagesFromImports(code);
    const values = String(input || "").split("\\n");
    const setup = [
      "import builtins",
      "__codeforge_values = " + JSON.stringify(values),
      "def __codeforge_input(prompt=''):",
      "    print(prompt, end='')",
      "    if not __codeforge_values:",
      "        raise EOFError('No more test input available')",
      "    return __codeforge_values.pop(0)",
      "builtins.input = __codeforge_input",
    ].join("\\n") + "\\n";
    await pyodide.runPythonAsync(setup + code);
    self.postMessage({ id, output: output.replace(/\\n$/, "") });
  } catch (error) {
    const message = error && error.message ? error.message : String(error);
    const match = message.match(/line (\\d+)/i);
    self.postMessage({
      id,
      output: output.replace(/\\n$/, ""),
      error: (errorOutput + message).trim(),
      errorLine: match ? Math.max(1, Number(match[1]) - 8) : undefined,
    });
  }
};
`;

export class PythonRunner {
  private worker: Worker | null = null;
  private sequence = 0;

  private getWorker() {
    if (this.worker) return this.worker;
    const source = URL.createObjectURL(new Blob([workerSource], { type: "text/javascript" }));
    this.worker = new Worker(source);
    URL.revokeObjectURL(source);
    return this.worker;
  }

  run(code: string, input = "", timeout = 5000): Promise<RunResult> {
    const worker = this.getWorker();
    const id = ++this.sequence;
    return new Promise((resolve) => {
      const timer = window.setTimeout(() => {
        this.reset();
        resolve({ output: "", error: "The program took too long, so the sandbox stopped it. Check for a loop that never ends.", timedOut: true });
      }, timeout);
      const listener = (event: MessageEvent<WorkerMessage>) => {
        if (event.data.id !== id) return;
        window.clearTimeout(timer);
        worker.removeEventListener("message", listener);
        resolve(event.data);
      };
      worker.addEventListener("message", listener);
      worker.postMessage({ id, code, input });
    });
  }

  reset() {
    this.worker?.terminate();
    this.worker = null;
  }
}