import { javascriptWorkerSource } from "./src/utils/javascriptRunner.ts";

async function runInWorker(code) {
  const messages = [];
  const fakeSelf = { postMessage: (m) => messages.push(m) };
  const evaluate = new Function(
    "self", "setTimeout", "clearTimeout", "setInterval", "clearInterval", "Promise",
    "fetch", "XMLHttpRequest", "WebSocket", "EventSource", "Worker", "SharedWorker", "importScripts", "postMessage", "close", "Function",
    `${javascriptWorkerSource}`,
  );
  const blocked = () => { throw new Error("blocked"); };
  evaluate(fakeSelf, setTimeout, clearTimeout, setInterval, clearInterval, Promise, blocked, blocked, blocked, blocked, blocked, blocked, blocked, blocked, blocked, Function);
  await fakeSelf.onmessage({ data: { id: 1, code } });
  return messages[messages.length - 1];
}

const candidates = {
  "await inside async function": 'async function main() {\n  const value = await Promise.resolve(21);\n  console.log(value * 2);\n}\nmain();',
  "await with several steps": 'async function load() {\n  const first = await Promise.resolve("read");\n  const second = await Promise.resolve("build");\n  return first + ", " + second;\n}\nload().then((text) => console.log(text));',
  "await in a loop": 'async function total(values) {\n  let sum = 0;\n  for (const value of values) {\n    sum += await Promise.resolve(value);\n  }\n  return sum;\n}\ntotal([1, 2, 3]).then((value) => console.log(value));',
  "export statement": 'export const topics = ["read", "build"];\nconsole.log(topics.length);',
  "fetch call": 'const response = await fetch("https://example.test/topics");\nconsole.log(response.ok);',
  "async method with await": 'class Loader {\n  async read() {\n    const value = await Promise.resolve("ready");\n    return value;\n  }\n}\nnew Loader().read().then((value) => console.log(value));',
};

for (const [name, code] of Object.entries(candidates)) {
  const result = await runInWorker(code);
  const status = result.error ? "ERROR " : "OUTPUT";
  console.log(`${status} ${name.padEnd(28)} -> ${result.error ?? JSON.stringify(result.output)}`);
}
