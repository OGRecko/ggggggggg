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
const candidates = {
  "two sequential awaits + log": 'async function main() {\n  const first = await Promise.resolve("read");\n  const second = await Promise.resolve("build");\n  console.log(first + " then " + second);\n}\nmain();',
  "Promise.all destructured + log": 'async function main() {\n  const [left, right] = await Promise.all([Promise.resolve(2), Promise.resolve(3)]);\n  console.log(left + right);\n}\nmain();',
  "try/catch around rejected await": 'async function main() {\n  try {\n    await Promise.reject(new Error("offline"));\n  } catch (error) {\n    console.log("caught " + error.message);\n  }\n}\nmain();',
  "async method awaited in main": 'class Loader {\n  async read() {\n    return await Promise.resolve("ready");\n  }\n}\nasync function main() {\n  const value = await new Loader().read();\n  console.log(value);\n}\nmain();',
  "sequential awaits one log line": 'async function main() {\n  const a = await Promise.resolve(1);\n  const b = await Promise.resolve(a + 1);\n  console.log(a, b);\n}\nmain();',
  "await then finally block": 'async function main() {\n  try {\n    console.log(await Promise.resolve("step"));\n  } finally {\n    console.log("cleanup");\n  }\n}\nmain();',
  "async arrow function": 'const main = async () => {\n  const value = await Promise.resolve("done");\n  console.log(value);\n};\nmain();',
};
for (const [name, code] of Object.entries(candidates)) {
  const result = await runInWorker(code);
  console.log(`${result.error ? "ERROR " : "OUTPUT"} ${name.padEnd(34)} -> ${result.error ?? JSON.stringify(result.output)}`);
}
