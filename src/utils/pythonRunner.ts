export type RunResult = {
  output: string;
  error?: string;
  errorLine?: number;
  timedOut?: boolean;
};

type WorkerMessage = RunResult & { id: number };

export const pythonWorkerSource = `
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

self.onmessage = async (event) => {
  const { id, code, input } = event.data;
  let output = "";
  let errorOutput = "";
  let globals;
  let pyodide;
  let response;
  let setupLineOffset = 0;
  try {
    if (code.length > 30000) throw new Error("Program is too large for the practice sandbox.");
    pyodide = await getPyodide();
    pyodide.setStdout({ batched: (text) => { if (output.length < 12000) output += text + "\\n"; } });
    pyodide.setStderr({ batched: (text) => { if (errorOutput.length < 4000) errorOutput += text + "\\n"; } });
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
    response = { id };
  } catch (error) {
    const message = error && error.message ? error.message : String(error);
    const userLine = message.match(/<codeforge-user>.*?line (\\d+)/i);
    const anyLine = hasJspi ? message.match(/line (\\d+)/i) : undefined;
    const line = userLine ? Number(userLine[1]) : anyLine ? Number(anyLine[1]) - setupLineOffset : undefined;
    response = {
      id,
      error: message,
      errorLine: line === undefined ? undefined : Math.max(1, line),
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
