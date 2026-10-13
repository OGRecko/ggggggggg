export type RunFailureKind = "syntax" | "type" | "compile" | "runtime" | "logic" | "test-failure" | "timeout" | "limit";

export type RunResult = {
  output: string;
  error?: string;
  errorLine?: number;
  timedOut?: boolean;
  failureKind?: RunFailureKind;
  outputTruncated?: boolean;
  /** Structured, JSON-compatible state reported by a test-only append, separate from stdout. */
  state?: unknown;
  /** Distinguishes an explicitly reported `null` from no state report. */
  stateCaptured?: boolean;
};

type WorkerMessage = RunResult & { id: number };

const MAX_CODE_LENGTH = 30_000;
const MAX_INPUT_LENGTH = 20_000;
const MAX_TIMEOUT_MS = 10_000;
const MAX_OUTPUT_CHARS = 12_000;
const MAX_ERROR_CHARS = 4_000;
const MAX_STATE_CHARS = 8_000;
const MAX_OUTPUT_MARKER = "[output truncated after sandbox safety limit]";
const MAX_ERROR_MARKER = "[stderr truncated after sandbox safety limit]";

export const pythonWorkerSource = `
const MAX_CODE_LENGTH = ${MAX_CODE_LENGTH};
const MAX_INPUT_LENGTH = ${MAX_INPUT_LENGTH};
const MAX_OUTPUT_CHARS = ${MAX_OUTPUT_CHARS};
const MAX_ERROR_CHARS = ${MAX_ERROR_CHARS};
const MAX_STATE_CHARS = ${MAX_STATE_CHARS};
const MAX_OUTPUT_MARKER = ${JSON.stringify(MAX_OUTPUT_MARKER)};
const MAX_ERROR_MARKER = ${JSON.stringify(MAX_ERROR_MARKER)};
let pyodideInstance;
let loadingPromise;
const hasJspi = typeof WebAssembly.Suspending === "function";

async function getPyodide() {
  if (pyodideInstance) return pyodideInstance;
  if (!loadingPromise) {
    importScripts("https://cdn.jsdelivr.net/pyodide/v0.29.3/full/pyodide.js");
    loadingPromise = loadPyodide({ indexURL: "https://cdn.jsdelivr.net/pyodide/v0.29.3/full/" });
  }
  pyodideInstance = await loadingPromise;
  return pyodideInstance;
}

function appendBounded(current, text, limit, marker) {
  const addition = String(text) + "\\n";
  const contentLimit = Math.max(0, limit - marker.length - 1);
  if (current.length + addition.length <= contentLimit) return { value: current + addition, truncated: false };
  const prefix = (current + addition).slice(0, contentLimit);
  return { value: prefix + (prefix ? "\\n" : "") + marker, truncated: true };
}

function classifyPythonFailure(message) {
  if (/SyntaxError|IndentationError|TabError/i.test(message)) return "syntax";
  if (/TypeError/i.test(message)) return "type";
  if (/CompileError|CompilationError|Compilation failed|compile error/i.test(message)) return "compile";
  if (/too large|limit/i.test(message)) return "limit";
  return "runtime";
}

self.onmessage = async (event) => {
  const { id, code, input } = event.data;
  let output = "";
  let errorOutput = "";
  let outputTruncated = false;
  let errorOutputTruncated = false;
  let globals;
  let pyodide;
  let response;
  let stateCaptured = false;
  let capturedState;
  let setupLineOffset = 0;
  try {
    if (code.length > MAX_CODE_LENGTH) throw new Error("Program is too large for the practice sandbox.");
    if (String(input || "").length > MAX_INPUT_LENGTH) throw new Error("Test input is too large for the practice sandbox.");
    pyodide = await getPyodide();
    pyodide.setStdout({ batched: (text) => {
      if (outputTruncated) return;
      const next = appendBounded(output, text, MAX_OUTPUT_CHARS, MAX_OUTPUT_MARKER);
      output = next.value;
      outputTruncated = next.truncated;
    } });
    pyodide.setStderr({ batched: (text) => {
      if (errorOutputTruncated) return;
      const next = appendBounded(errorOutput, text, MAX_ERROR_CHARS, MAX_ERROR_MARKER);
      errorOutput = next.value;
      errorOutputTruncated = next.truncated;
    } });
    // Import any bundled packages before creating an isolated namespace for this submission.
    await pyodide.loadPackagesFromImports(code);
    const values = String(input || "").split("\\n");
    const setupLines = [
      "import builtins as __codeforge_builtin_module",
      "__codeforge_values = " + JSON.stringify(values),
      "def __codeforge_input(prompt=''):",
      "    print(prompt, end='')",
      "    if not __codeforge_values:",
      "        raise EOFError('No more test input available')",
      "    return __codeforge_values.pop(0)",
      "__codeforge_builtins = dict(vars(__codeforge_builtin_module))",
      "__codeforge_builtins['input'] = __codeforge_input",
      "__builtins__ = __codeforge_builtins",
    ];
    const setup = setupLines.join("\\n") + "\\n";
    setupLineOffset = setupLines.length;
    globals = pyodide.runPython("dict()");
    globals.set("__name__", "__main__");
    const reportPythonState = (value) => {
      let converted = value;
      if (value && typeof value.toJs === "function") {
        try {
          converted = value.toJs({ depth: 8, create_pyproxies: false, dict_converter: Object.fromEntries });
        } finally {
          if (typeof value.destroy === "function") value.destroy();
        }
      }
      let serialized;
      try {
        serialized = JSON.stringify(converted);
      } catch {
        throw new TypeError("CodeForge structured state must contain JSON-compatible values.");
      }
      if (typeof serialized !== "string") {
        throw new TypeError("CodeForge structured state must contain JSON-compatible values.");
      }
      if (serialized.length > MAX_STATE_CHARS) {
        throw new RangeError("The Python runner limits structured state returns to 8,000 characters.");
      }
      capturedState = JSON.parse(serialized);
      stateCaptured = true;
    };
    globals.set("__codeforgeReportState", reportPythonState);

    if (hasJspi) {
      await pyodide.runPythonAsync(setup + code, { globals });
    } else {
      // Top-level await is supported by runPythonAsync even on browsers without JSPI. Replace
      // module-scope asyncio.run(expr) calls with await expr through Python's AST, not a regex,
      // so strings/comments and calls inside function or class bodies remain untouched.
      const fallback = [
        "import ast as codeforge_ast",
        "import inspect as codeforge_inspect",
        "class __CodeForgeRunToAwait(codeforge_ast.NodeTransformer):",
        "    def visit_FunctionDef(self, node):",
        "        return node",
        "    def visit_AsyncFunctionDef(self, node):",
        "        return node",
        "    def visit_ClassDef(self, node):",
        "        return node",
        "    def visit_Lambda(self, node):",
        "        return node",
        "    def visit_Call(self, node):",
        "        node = self.generic_visit(node)",
        "        target = node.func",
        "        if (",
        "            isinstance(target, codeforge_ast.Attribute)",
        "            and target.attr == 'run'",
        "            and isinstance(target.value, codeforge_ast.Name)",
        "            and target.value.id == 'asyncio'",
        "            and len(node.args) == 1",
        "            and not node.keywords",
        "        ): ",
        "            awaited = codeforge_ast.Await(value=node.args[0])",
        "            return codeforge_ast.copy_location(awaited, node)",
        "        return node",
        "__codeforge_tree = codeforge_ast.parse(" + JSON.stringify(code) + ", filename='<codeforge-user>')",
        "__codeforge_tree = __CodeForgeRunToAwait().visit(__codeforge_tree)",
        "codeforge_ast.fix_missing_locations(__codeforge_tree)",
        "__codeforge_compiled = compile(__codeforge_tree, '<codeforge-user>', 'exec', flags=codeforge_ast.PyCF_ALLOW_TOP_LEVEL_AWAIT)",
        "__codeforge_result = eval(__codeforge_compiled, globals(), globals())",
        "if codeforge_inspect.isawaitable(__codeforge_result):",
        "    await __codeforge_result",
      ].join("\\n");
      await pyodide.runPythonAsync(setup + fallback, { globals });
    }
    response = { id, ...(stateCaptured ? { state: capturedState, stateCaptured: true } : {}) };
  } catch (error) {
    const errorName = error && error.name ? error.name : "Error";
    const message = error && error.message ? error.message : String(error);
    const classificationMessage = errorName + ": " + message;
    const userLine = message.match(/<codeforge-user>.*?line (\\d+)/i);
    const anyLine = hasJspi ? message.match(/line (\\d+)/i) : undefined;
    const line = userLine ? Number(userLine[1]) : anyLine ? Number(anyLine[1]) - setupLineOffset : undefined;
    response = {
      id,
      error: message,
      errorLine: line === undefined ? undefined : Math.max(1, line),
      failureKind: classifyPythonFailure(classificationMessage),
      ...(stateCaptured ? { state: capturedState, stateCaptured: true } : {}),
    };
  } finally {
    if (globals) {
      try {
        await pyodide.runPythonAsync("import sys\\nsys.stdout.flush()\\nsys.stderr.flush()", { globals });
      } catch {
        // Flushing is best-effort: a learner may deliberately replace or close the streams.
      }
      globals.destroy();
    }
  }
  response.output = output.replace(/\\n$/, "");
  if (response.error) response.error = (errorOutput + response.error).trim();
  if (outputTruncated || errorOutputTruncated) response.outputTruncated = true;
  self.postMessage(response);
};
`;

export class PythonRunner {
  private worker: Worker | null = null;
  private sequence = 0;

  private getWorker() {
    if (this.worker) return this.worker;
    const source = URL.createObjectURL(new Blob([pythonWorkerSource], { type: "text/javascript" }));
    this.worker = new Worker(source);
    URL.revokeObjectURL(source);
    return this.worker;
  }

  run(code: string, input = "", timeout = 5000): Promise<RunResult> {
    if (code.length > MAX_CODE_LENGTH) {
      return Promise.resolve({ output: "", error: `Program is too large for the practice sandbox (limit ${MAX_CODE_LENGTH} characters).`, failureKind: "limit" });
    }
    if (input.length > MAX_INPUT_LENGTH) {
      return Promise.resolve({ output: "", error: `Test input is too large for the practice sandbox (limit ${MAX_INPUT_LENGTH} characters).`, failureKind: "limit" });
    }

    const requestedTimeout = Number.isFinite(timeout) ? timeout : 5000;
    const timeoutLimit = Math.max(1, Math.min(requestedTimeout, MAX_TIMEOUT_MS));
    const worker = this.getWorker();
    const id = ++this.sequence;
    return new Promise((resolve) => {
      const timer = window.setTimeout(() => {
        this.reset();
        resolve({ output: "", error: "The program took too long, so the sandbox stopped it. Check for a loop that never ends.", timedOut: true, failureKind: "timeout" });
      }, timeoutLimit);
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
