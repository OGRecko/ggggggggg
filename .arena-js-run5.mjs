import { readFileSync } from "node:fs";
import { javascriptWorkerSource } from "./src/utils/javascriptRunner.ts";
async function runInWorker(code) {
  const messages = [];
  const fakeSelf = { postMessage: (m) => messages.push(m) };
  const evaluate = new Function("self", "setTimeout", "clearTimeout", "setInterval", "clearInterval", "Promise",
    "fetch", "XMLHttpRequest", "WebSocket", "EventSource", "Worker", "SharedWorker", "importScripts", "postMessage", "close", "Function",
    `${javascriptWorkerSource}`);
  const blocked = () => { throw new Error("blocked"); };
  evaluate(fakeSelf, setTimeout, clearTimeout, setInterval, clearInterval, Promise, blocked, blocked, blocked, blocked, blocked, blocked, blocked, blocked, blocked, Function);
  await fakeSelf.onmessage({ data: { id: 1, code } });
  return messages[messages.length - 1];
}
const CANDIDATES = JSON.parse(readFileSync("/tmp/js4/run.json", "utf8"));
for (const item of CANDIDATES) {
  const result = await runInWorker(item.code);
  const actual = (result.output ?? "").trim();
  const expected = item.output.trim();
  console.log(`${actual === expected ? "MATCH   " : "MISMATCH"} ${item.name.padEnd(28)} declared ${JSON.stringify(expected)} actual ${JSON.stringify(actual)}${result.error ? " ERROR " + result.error : ""}`);
}
