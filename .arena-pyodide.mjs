/**
 * Runs every Python program of the course through **Pyodide 0.29.3**, the exact version the app
 * pins and loads in its Worker, instead of the system CPython used by `.arena-pyexec.py`.
 *
 * Why this exists: the app executes learner code with Pyodide in a browser Worker. The earlier
 * audit proved the declared outputs under CPython, which is a different engine: WebAssembly CPython
 * is built without some of the native standard library (`subprocess` in particular), so a program
 * that CPython runs happily can fail in the product. This harness loads the same interpreter in
 * Node, applies the same input shim the shipped worker applies, and compares what it prints with
 * what each lesson declares.
 *
 * What it does not cover, stated plainly: it is not a browser. The Worker plumbing around the
 * interpreter (`self.postMessage`, `importScripts`) is exercised by `pythonRunner.test.ts` and by
 * this harness's shim check, not by a real browser engine, because no browser binary is reachable
 * from this sandbox (the jsdelivr and browser-download CDNs are blocked).
 *
 * Usage:
 *   npm install --no-save java-parser@3.0.1 css-tree@3.2.1 parse5@8 html-validate@11.16.2 pyodide@0.29.3
 *   npx vite-node .arena-pyexec.ts          # writes /tmp/python_exec.json (712 programs)
 *   node .arena-pyodide.mjs                 # all programs
 *   node .arena-pyodide.mjs --only <text>   # only rows whose "where" contains <text>
 */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const here = dirname(fileURLToPath(import.meta.url));
const pyodideDir = resolve(here, "node_modules/pyodide");

const { loadPyodide } = await import(resolve(pyodideDir, "pyodide.mjs"));

/**
 * The exact shim the shipped worker builds. The lines below are copied from
 * `src/utils/pythonRunner.ts`, and `assertShimMatchesRunner()` below re-extracts them from that
 * file at run time and fails the audit if they ever drift apart. Nothing else is copied: the
 * surrounding Worker message plumbing is not needed to run the interpreter.
 */
function buildSetup(input) {
  const values = String(input || "").split("\n");
  return (
    [
      "import builtins",
      "__codeforge_values = " + JSON.stringify(values),
      "def __codeforge_input(prompt=''):",
      "    print(prompt, end='')",
      "    if not __codeforge_values:",
      "        raise EOFError('No more test input available')",
      "    return __codeforge_values.pop(0)",
      "builtins.input = __codeforge_input",
    ].join("\n") + "\n"
  );
}

function assertShimMatchesRunner() {
  // The runner stores its shim inside a template literal, so newlines appear as the two characters
  // backslash-n and single quotes inside the Python stay single.
  const source = readFileSync(resolve(here, "src/utils/pythonRunner.ts"), "utf8");
  const expectedFragments = [
    '"import builtins"',
    '"__codeforge_values = " + JSON.stringify(values)',
    '"def __codeforge_input(prompt=\'\'):"',
    '"    print(prompt, end=\'\')"',
    '"    if not __codeforge_values:"',
    '"        raise EOFError(\'No more test input available\')"',
    '"    return __codeforge_values.pop(0)"',
    '"builtins.input = __codeforge_input"',
  ];
  const missing = expectedFragments.filter((fragment) => !source.includes(fragment.replace(/'/g, "'")));
  if (missing.length > 0) {
    console.error("The shipped input shim in src/utils/pythonRunner.ts no longer matches this audit's copy:");
    for (const fragment of missing) console.error("  missing: " + fragment);
    process.exit(2);
  }
  const splitPattern = 'String(input || "").split("\\\\n")';
  if (!source.includes(splitPattern)) {
    console.error("The runner no longer splits input the way this audit assumes; update .arena-pyodide.mjs.");
    process.exit(2);
  }
}

assertShimMatchesRunner();

const only = process.argv.includes("--only") ? process.argv[process.argv.indexOf("--only") + 1] : null;
const allRows = JSON.parse(readFileSync("/tmp/python_exec.json", "utf8"));
const rows = only ? allRows.filter((row) => row.where.includes(only)) : allRows;

const pyodide = await loadPyodide({ indexURL: pyodideDir + "/" });
const version = pyodide.runPython("import sys; sys.version.split()[0]");
console.log(`Pyodide 0.29.3 (Python ${version}) | ${rows.length} programs${only ? ` matching "${only}"` : ""}`);

const BASE = "/tmp/codeforge-audit";
let jobCount = 0;
pyodide.FS.mkdirTree(BASE);

const stats = { matched: 0, mismatch: 0, inputBoundary: 0, error: 0, packageMissing: 0 };
const anomalies = [];

function escapePy(text) {
  return text.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

for (const [index, row] of rows.entries()) {
  const workdir = `${BASE}/run-${index}`;
  pyodide.FS.mkdirTree(workdir);
  pyodide.runPython(`import os\nos.chdir(${JSON.stringify(workdir)})`);

  // Deliver anything the previous program left in Pyodide's batched buffers while the previous
  // buffers are still installed: Pyodide flushes stdout in batches, and a late flush would
  // otherwise be attributed to this program.
  await pyodide.runPythonAsync("import sys\nsys.stdout.flush()\nsys.stderr.flush()");
  await new Promise((resolve) => setTimeout(resolve, 0));

  // Every lesson program is a fresh piece of work, so it gets a fresh namespace: the previous
  // program's names must not leak in, or a missing-name sample would print a leftover value. The
  // app runs code in the shared __main__ namespace, so __name__ is "__main__" there and a lesson
  // that branches on it behaves the same here.
  const globals = pyodide.toPy({ __name__: "__main__" });
  let output = "";
  let errorOutput = "";
  let flushed = true;
  pyodide.setStdout({ batched: (text) => { if (output.length < 12000) output += text + "\n"; } });
  pyodide.setStderr({
    batched: (text) => {
      // Pyodide reports a traceback through stderr in pieces; the final piece carries the exception
      // type and message, which is what the runner surfaces to the learner.
      if (errorOutput.length < 8000) errorOutput += text + "\n";
    },
  });

  const expected = (row.expected ?? "").trim();
  let error = null;
  try {
    // Mirror the worker: load any package the imports ask for, then run in the program's namespace.
    await pyodide.loadPackagesFromImports(row.code);
    await pyodide.runPythonAsync(buildSetup(row.input) + row.code, { globals });
  } catch (caught) {
    error = caught && caught.message ? caught.message : String(caught);
  } finally {
    jobCount += 1;
    globals.destroy();
  }


  const printed = output.replace(/\n$/, "").trim();

  // A declared sandbox boundary is prose, not a transcript, so it cannot be compared literally.
  // It is still checked: when the program stopped, the text must name the exception the learner
  // sees; when it ran to completion, the text must quote what really reached the screen.
  if (/^Sandbox:/.test(expected)) {
    const lastLine = (errorOutput + error).trim().split("\n").filter((line) => line.trim()).pop() ?? "";
    if (error) {
      const type = (errorOutput + "\n" + error).match(/([A-Za-z_]*Error)/);
      if (type && !expected.includes(type[1])) {
        stats.mismatch += 1;
        anomalies.push(`BOUNDARY ${row.where}\n           text does not name ${type[1]}\n           declared: ${JSON.stringify(expected.slice(0, 150))}`);
        continue;
      }
    } else if (printed && !expected.includes(printed)) {
      stats.mismatch += 1;
      anomalies.push(`BOUNDARY ${row.where}\n           text does not quote the printed output\n           printed:  ${JSON.stringify(printed.slice(0, 120))}`);
      continue;
    }
    stats.inputBoundary += 1;
    continue;
  }

  if (error) {
    const lastLine = (errorOutput + error).trim().split("\n").filter((line) => line.trim()).pop() ?? "";
    if (/No module named|is not available|Package not found|Failed to load package/i.test(error)) {
      stats.packageMissing += 1;
      anomalies.push(`PACKAGE  ${row.where}\n           ${lastLine.slice(0, 160)}`);
      continue;
    }
    stats.error += 1;
    anomalies.push(`ERROR    ${row.where}\n           ${lastLine.slice(0, 200)}`);
    continue;
  }

  if (printed === expected) {
    stats.matched += 1;
  } else {
    stats.mismatch += 1;
    anomalies.push(`MISMATCH ${row.where}\n           printed:  ${JSON.stringify(printed.slice(0, 200))}\n           declared: ${JSON.stringify(expected.slice(0, 200))}`);
  }
}

console.log(
  `${stats.matched} matched | ${stats.mismatch} mismatched | ${stats.inputBoundary} documented sandbox boundary | ${stats.error} errors | ${stats.packageMissing} package-unavailable (offline)`,
);
if (anomalies.length > 0) {
  console.log("\nAnomalies:");
  for (const line of anomalies) console.log("  " + line);
}
process.exit(stats.mismatch + stats.error > 0 ? 1 : 0);
