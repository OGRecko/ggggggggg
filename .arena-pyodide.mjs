/**
 * Runs the Python corpus through the exact Worker source shipped by pythonRunner.ts and Pyodide
 * 0.29.3. Unlike the earlier standalone harness, this executes the same per-run globals, input
 * shim, output capture, and JSPI/no-JSPI branch as the product.
 *
 * Install audit runtime: npm install --no-save pyodide@0.29.3
 * Dump rows:             npx vite-node .arena-pyexec.ts
 * Run all / select rows: node .arena-pyodide.mjs [--only <text>]
 *
 * A real browser is not present in this sandbox. When WebAssembly.Suspending is absent, this also
 * verifies the worker's AST-based top-level asyncio.run fallback in the actual app interpreter.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import ts from "typescript";

const runnerSource = readFileSync(resolve("src/utils/pythonRunner.ts"), "utf8");
const runnerJavaScript = ts.transpile(runnerSource, {
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.ESNext,
});
const runnerModule = await import(`data:text/javascript;base64,${Buffer.from(runnerJavaScript).toString("base64")}`);
const { loadPyodide } = await import("pyodide");
const pyodide = await loadPyodide({ indexURL: resolve("node_modules/pyodide") + "/" });
const version = pyodide.runPython("import sys; sys.version.split()[0]");
const jspi = typeof WebAssembly.Suspending === "function";

const only = process.argv.includes("--only") ? process.argv[process.argv.indexOf("--only") + 1] : null;
const allRows = JSON.parse(readFileSync("/tmp/python_exec.json", "utf8"));
const rows = only ? allRows.filter((row) => row.where.includes(only)) : allRows;
console.log(`Pyodide 0.29.3 (Python ${version}) | ${rows.length} programs | WebAssembly.Suspending: ${jspi ? "present" : "absent"}`);

const BASE = "/tmp/codeforge-worker-audit";
pyodide.FS.mkdirTree(BASE);

const messages = [];
const fakeSelf = { postMessage: (message) => messages.push(message) };
const makeWorker = new Function("self", "importScripts", "loadPyodide", "WebAssembly", runnerModule.pythonWorkerSource);
makeWorker(fakeSelf, () => {}, async () => pyodide, WebAssembly);

async function runWorker(code, input = "", id = messages.length + 1) {
  const before = messages.length;
  await fakeSelf.onmessage({ data: { id, code, input } });
  return messages[before];
}

const smokeCases = [
  { label: "first run defines a name", code: "worker_private_value = 41\nprint(worker_private_value)", output: "41" },
  { label: "second run cannot reuse that name", code: "print(worker_private_value)", error: "NameError" },
  { label: "__name__ is __main__", code: "if __name__ == '__main__':\n    print('main entry')", output: "main entry" },
  { label: "input shim is isolated", code: "print(input())", input: "Ada", output: "Ada" },
  { label: "structured state is returned separately from stdout", code: "__codeforgeReportState({'count': 2, 'enabled': False})", state: { count: 2, enabled: false }, output: "" },
  { label: "asyncio.run works on this host capability", code: "import asyncio\nasync def main():\n    await asyncio.sleep(0)\n    print('awaited')\nasyncio.run(main())", output: "awaited" },
];
for (const [index, test] of smokeCases.entries()) {
  const result = await runWorker(test.code, test.input ?? "", index + 1);
  const passed = test.error
    ? result.error?.includes(test.error)
    : Object.hasOwn(test, "state")
      ? !result.error && result.output === test.output && result.stateCaptured === true && JSON.stringify(result.state) === JSON.stringify(test.state)
      : !result.error && result.output === test.output;
  if (!passed) {
    console.error(`Worker smoke failed: ${test.label}`, result);
    process.exit(1);
  }
}
console.log(`Worker smoke: ${smokeCases.length}/${smokeCases.length} passed (fresh globals, __main__, input, structured state, asyncio; JSPI ${jspi ? "present" : "absent"})`);

const stats = { matched: 0, mismatch: 0, inputBoundary: 0, error: 0, packageMissing: 0 };
const anomalies = [];

for (const [index, row] of rows.entries()) {
  const workdir = `${BASE}/run-${index}`;
  pyodide.FS.mkdirTree(workdir);
  pyodide.FS.chdir(workdir);
  const before = messages.length;
  await fakeSelf.onmessage({ data: { id: index + 1, code: row.code, input: row.input ?? "" } });
  const result = messages[before];
  const expected = (row.expected ?? "").trim();
  const printed = (result?.output ?? "").trim();
  const error = result?.error ?? "";

  if (!result) {
    stats.error += 1;
    anomalies.push(`NO RESULT ${row.where}`);
    continue;
  }

  // A Sandbox: declaration is not a transcript: it must quote real output or name the real error.
  if (/^Sandbox:/.test(expected)) {
    if (error) {
      const type = error.match(/([A-Za-z_]*Error)/)?.[1];
      if (type && !expected.includes(type)) {
        stats.mismatch += 1;
        anomalies.push(`BOUNDARY ${row.where} does not name ${type}\n  declared: ${JSON.stringify(expected.slice(0, 160))}`);
        continue;
      }
    } else if (printed && !expected.includes(printed)) {
      stats.mismatch += 1;
      anomalies.push(`BOUNDARY ${row.where} does not quote printed output\n  printed: ${JSON.stringify(printed.slice(0, 120))}`);
      continue;
    }
    stats.inputBoundary += 1;
    continue;
  }

  if (error) {
    if (/No module named|is not available|Package not found|Failed to load package|Unable to load package/i.test(error)) {
      stats.packageMissing += 1;
      anomalies.push(`PACKAGE ${row.where}\n  ${error.split("\n").filter(Boolean).at(-1)?.slice(0, 180) ?? error.slice(0, 180)}`);
      continue;
    }
    stats.error += 1;
    anomalies.push(`ERROR ${row.where}\n  ${error.split("\n").filter(Boolean).at(-1)?.slice(0, 200) ?? error.slice(0, 200)}`);
    continue;
  }

  if (printed === expected) stats.matched += 1;
  else {
    stats.mismatch += 1;
    anomalies.push(`MISMATCH ${row.where}\n  printed: ${JSON.stringify(printed.slice(0, 200))}\n  declared: ${JSON.stringify(expected.slice(0, 200))}`);
  }
}

console.log(`${stats.matched} matched | ${stats.mismatch} mismatched | ${stats.inputBoundary} documented sandbox boundary | ${stats.error} errors | ${stats.packageMissing} package-unavailable`);
if (anomalies.length) {
  console.log("\nAnomalies:");
  for (const anomaly of anomalies) console.log("  " + anomaly);
}
process.exit(stats.mismatch + stats.error > 0 ? 1 : 0);
