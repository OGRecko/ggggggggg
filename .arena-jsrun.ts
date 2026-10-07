/**
 * Runs candidate JavaScript snippets through the app's real shipped Worker source, exactly as
 * `src/data/javascriptRuntime.test.ts` does, so lesson outputs can be recorded from real execution
 * instead of being predicted. Usage: npx vite-node .arena-jsrun.ts -- <file.json>
 * The JSON file is [{ "name": "...", "code": "..." }]; output is printed per snippet.
 */
import { readFileSync } from "node:fs";
import { javascriptWorkerSource } from "./src/utils/javascriptRunner";

async function runInSandbox(code: string) {
  const messages: Array<{ output?: string; error?: string }> = [];
  const fakeSelf = {
    postMessage: (message: { output?: string; error?: string }) => messages.push(message),
  } as {
    postMessage: (message: { output?: string; error?: string }) => void;
    onmessage?: (event: { data: { id: number; code: string } }) => Promise<void>;
    eval?: unknown;
    Function?: unknown;
  };
  const evaluate = new Function(
    "self", "setTimeout", "clearTimeout", "setInterval", "clearInterval", "Promise", "fetch",
    "XMLHttpRequest", "WebSocket", "EventSource", "Worker", "SharedWorker", "importScripts",
    "postMessage", "close", "Function",
    `${javascriptWorkerSource}`,
  );
  evaluate(
    fakeSelf, setTimeout, clearTimeout, setInterval, clearInterval, Promise,
    ...Array.from({ length: 9 }, () => () => { throw new Error("blocked"); }), Function,
  );
  await fakeSelf.onmessage!({ data: { id: 1, code } });
  return messages[messages.length - 1];
}

const fs = await import("node:fs");
const target = process.argv.slice(2).filter((a) => !a.startsWith("--"))[0];
const rows: Array<{ name: string; code: string }> = fs.statSync(target).isDirectory()
  ? fs.readdirSync(target).filter((f: string) => f.endsWith(".js")).sort().map((f: string) => ({ name: f.replace(/\.js$/, ""), code: fs.readFileSync(`${target}/${f}`, "utf8") }))
  : JSON.parse(readFileSync(target, "utf8"));
for (const row of rows) {
  const result = await runInSandbox(row.code);
  console.log(`\n=== ${row.name}`);
  console.log(`  output: ${JSON.stringify(result?.output ?? "")}`);
  if (result?.error) console.log(`  error:  ${JSON.stringify(result.error)}`);
}
// give macrotasks a chance to run so any late output is visible rather than silently lost
await new Promise((resolve) => setTimeout(resolve, 50));
