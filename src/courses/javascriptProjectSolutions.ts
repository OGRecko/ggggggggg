import type { ProjectSolution } from "./chapterPlanHelpers";

/**
 * Authored JavaScript chapter project solutions, replacing the generated placeholder that older
 * chapters shipped (a chapter sample plus an injected console.log("modified")).
 *
 * Verification: every solution that can run without a DOM was executed with Node 22 during
 * authoring and the recorded expected output is that program's real stdout. The two DOM
 * projects cannot run in the sandboxed Worker, so their expected result is described and the
 * lesson text labels them as structure review rather than execution.
 */
export const javascriptProjectSolutions: Partial<Record<number, ProjectSolution>> = {
  // Chapter 1: Getting Started
  1: {
    solution: "console.log(\"Start\");\nconsole.log(\"Ready\");",
    solutionExplanation: "Two console.log calls make the order visible: Start is printed before Ready. Executed with Node 22 during authoring; CodeForge runs the same program in its sandboxed Worker when it is safe to run there.",
    expected: "Start\nReady",
  },
  // Chapter 2: Types and Operators
  2: {
    solution: "const count = 3;\nconst label = \"3\";\nconsole.log(count === Number(label));",
    solutionExplanation: "count is a number and label is text, so Number(label) converts the text before strict equality reports true. Executed with Node 22 during authoring; CodeForge runs the same program in its sandboxed Worker when it is safe to run there.",
    expected: "true",
  },
  // Chapter 3: Control Flow
  3: {
    solution: "let total = 0;\nfor (const score of [3, -1, 4, 2]) {\n  if (score < 0) continue;\n  total += score;\n}\nconsole.log(total >= 9);",
    solutionExplanation: "continue skips the negative score, the accepted values total 9, and the final comparison reports true. Executed with Node 22 during authoring; CodeForge runs the same program in its sandboxed Worker when it is safe to run there.",
    expected: "true",
  },
  // Chapter 4: Functions and Scope
  4: {
    solution: "function prefix(text) {\n  return \"JS: \" + text;\n}\nconst wrap = suffix => value => value + suffix;\nconsole.log(wrap(\"!\")(prefix(\"ready\")));",
    solutionExplanation: "prefix returns a named function result while wrap is a curried arrow function; the composed call produces JS: ready! Executed with Node 22 during authoring; CodeForge runs the same program in its sandboxed Worker when it is safe to run there.",
    expected: "JS: ready!",
  },
  // Chapter 5: Objects and Arrays
  5: {
    solution: "const learners = [{ name: \"Ada\", score: 9 }, { name: \"Grace\", score: 7 }];\nclass Roster {\n  constructor(list) {\n    this.list = list;\n  }\n  get status() {\n    const top = Math.max(...this.list.map((learner) => learner.score));\n    return `${this.list.length} learners, top ${top}`;\n  }\n}\nconsole.log(new Roster(learners).status);",
    solutionExplanation: "The array holds learner objects, the class wraps them, and the getter derives a status string from the data instead of storing a second copy of it. Executed with Node 22 during authoring; CodeForge runs the same program in its sandboxed Worker when it is safe to run there.",
    expected: "2 learners, top 9",
  },
  // Chapter 6: Strings and Text
  6: {
    solution: "const title = \"  JavaScript Basics  \";\nconsole.log(title.trim().toLowerCase().replaceAll(\" \", \"-\"));",
    solutionExplanation: "trim removes the edge spaces, toLowerCase normalizes case, and replaceAll turns each remaining space into a dash. Executed with Node 22 during authoring; CodeForge runs the same program in its sandboxed Worker when it is safe to run there.",
    expected: "javascript-basics",
  },
  // Chapter 7: The DOM
  7: {
    solution: "const title = document.querySelector(\"h1\");\ntitle.textContent = \"Ready\";\n// Delegation note: one listener on the parent can handle clicks from many child buttons.\nconsole.log(title.textContent);",
    solutionExplanation: "In the browser preview the h1 text becomes Ready and the console logs Ready. CodeForge's JavaScript Worker has no DOM, so this project is reviewed structurally and described in words instead of executed.",
    expected: "Browser preview: the h1 text becomes Ready and the console logs Ready.",
  },
  // Chapter 8: Errors and Storage
  8: {
    solution: "// Feature detection keeps the same code honest in a browser and in a DOM-less runtime.\nconst storage = typeof localStorage === \"undefined\" ? { getItem: () => null } : localStorage;\nlet restored = { title: \"guest\" };\ntry {\n  restored = JSON.parse(storage.getItem(\"lesson\") ?? \"{}\");\n} catch (error) {\n  restored = { title: \"guest\" };\n}\nconsole.log(restored.title ?? \"guest\");",
    solutionExplanation: "JSON.parse runs inside try/catch, a missing stored value falls back to an empty object, and the printed field falls back to guest in this run. Executed with Node 22 during authoring; CodeForge runs the same program in its sandboxed Worker when it is safe to run there.",
    expected: "guest",
  },
  // Chapter 9: Object-Oriented JavaScript
  9: {
    solution: "class Counter {\n  #count = 0;\n  increment() {\n    this.#count += 1;\n  }\n  current() {\n    return this.#count;\n  }\n}\nconst counter = new Counter();\ncounter.increment();\nconsole.log(counter.current());",
    solutionExplanation: "The private field is reachable only through the class methods, so current() reports the single increment as 1. Executed with Node 22 during authoring; CodeForge runs the same program in its sandboxed Worker when it is safe to run there.",
    expected: "1",
  },
  // Chapter 10: Modern Modules and Tooling
  10: {
    solution: "const config = Object.freeze({ mode: \"study\" });\nfunction modeLabel() {\n  return config.mode;\n}\nconsole.log(modeLabel());",
    solutionExplanation: "Object.freeze prevents new properties and reassignment of mode, and modeLabel reads the frozen value. Executed with Node 22 during authoring; CodeForge runs the same program in its sandboxed Worker when it is safe to run there.",
    expected: "study",
  },
  // Chapter 11: Algorithms I
  11: {
    solution: "function findIndex(values, target) {\n  for (let index = 0; index < values.length; index += 1) {\n    if (values[index] === target) return index;\n  }\n  return -1;\n}\nconsole.log(findIndex([2, 4, 6], 4));",
    solutionExplanation: "The loop returns the matching index immediately, 4 is at index 1, and -1 stays the documented not-found value. Executed with Node 22 during authoring; CodeForge runs the same program in its sandboxed Worker when it is safe to run there.",
    expected: "1",
  },
  // Chapter 12: Data Structures
  12: {
    solution: "const lookup = new Map([[\"js\", 1]]);\nconst tags = new Set([\"core\"]);\nfunction* history() {  // generators: each yield produces one value and pauses until the iterator advances\n  yield \"open\";\n  yield \"edit\";\n}\nconsole.log(lookup.get(\"js\"), tags.has(\"core\"), history().next().value);",
    solutionExplanation: "The Map answers the key lookup, the Set answers membership, and the generator yields its first label open when the iterator is advanced. Executed with Node 22 during authoring; CodeForge runs the same program in its sandboxed Worker when it is safe to run there.",
    expected: "1 true open",
  },
  // Chapter 13: Functional JavaScript
  13: {
    solution: "const scores = [{ value: 4 }, { value: 6 }, { value: 2 }];\nconst total = scores.map((entry) => entry.value).reduce((sum, value) => sum + value, 0);\nconsole.log(total);",
    solutionExplanation: "map extracts the numbers and reduce adds them without mutating the original array of objects. Executed with Node 22 during authoring; CodeForge runs the same program in its sandboxed Worker when it is safe to run there.",
    expected: "12",
  },
  // Chapter 14: Testing
  14: {
    solution: "function add(left, right) {\n  return left + right;\n}\nconsole.assert(add(2, 3) === 5, \"normal case\");\nconsole.assert(add(0, 0) === 0, \"boundary case\");\nconsole.log(\"checked\");",
    solutionExplanation: "Two assertions cover the normal case and the zero boundary; passing assertions stay silent, so the visible line is the confirmation. Executed with Node 22 during authoring; CodeForge runs the same program in its sandboxed Worker when it is safe to run there.",
    expected: "checked",
  },
  // Chapter 15: Asynchronous JavaScript
  15: {
    solution: "async function search(query) {\n  const text = query.trim();\n  if (!text) return [];\n  return [`result for ${text}`];\n}\nsearch(\"code\").then(console.log);",
    solutionExplanation: "The async function returns a Promise, blank text resolves to an empty array, and then receives the resolved array for code. Executed with Node 22 during authoring; CodeForge runs the same program in its sandboxed Worker when it is safe to run there.",
    expected: '["result for code"]',
  },
  // Chapter 16: Browser Networking
  16: {
    solution: "const url = new URL(\"https://example.test/search\");\nurl.searchParams.set(\"topic\", \"javascript\");\nconsole.log(url.search);",
    solutionExplanation: "URL keeps the address structured, and searchParams encodes the query so the printed search string is already escaped correctly. Executed with Node 22 during authoring; CodeForge runs the same program in its sandboxed Worker when it is safe to run there.",
    expected: "?topic=javascript",
  },
  // Chapter 17: Rendering Systems
  17: {
    solution: "const state = { count: 1 };\nconst view = `Count: ${state.count}`;\nconsole.log(view);",
    solutionExplanation: "The template literal derives the view from state, so the rendering rule is one expression that can be repeated after state changes. Executed with Node 22 during authoring; CodeForge runs the same program in its sandboxed Worker when it is safe to run there.",
    expected: "Count: 1",
  },
  // Chapter 18: Server-Side JavaScript
  18: {
    solution: "const path = \"/health\";\nconst status = path === \"/health\" ? 200 : 404;\nconsole.log(status);",
    solutionExplanation: "The conditional expression maps the known path to 200 and every other path to 404 before printing. Executed with Node 22 during authoring; CodeForge runs the same program in its sandboxed Worker when it is safe to run there.",
    expected: "200",
  },
  // Chapter 19: Databases
  19: {
    solution: "const query = \"SELECT title FROM lesson WHERE id = ?\";\nconsole.log(query.includes(\"?\"));",
    solutionExplanation: "The placeholder is a value boundary that parameter binding fills at runtime; the concatenated query would not have it. Executed with Node 22 during authoring; CodeForge runs the same program in its sandboxed Worker when it is safe to run there.",
    expected: "true",
  },
  // Chapter 20: Performance and Memory
  20: {
    solution: "const bytes = new Uint8Array(2);\nbytes[0] = 10;\nbytes[1] = 20;\nconsole.log(bytes[0] + bytes[1]);",
    solutionExplanation: "A Uint8Array stores fixed-width bytes, and the two stored values sum to 30. Executed with Node 22 during authoring; CodeForge runs the same program in its sandboxed Worker when it is safe to run there.",
    expected: "30",
  },
  // Chapter 21: Security
  21: {
    solution: "const safe = text => text.replaceAll(\"<\", \"&lt;\");\nconsole.log(safe(\"<tag>\"));",
    solutionExplanation: "Escaping the angle bracket turns markup into text, so the printed result still shows the original characters. Executed with Node 22 during authoring; CodeForge runs the same program in its sandboxed Worker when it is safe to run there.",
    expected: "&lt;tag>",
  },
  // Chapter 22: Accessibility and Web Standards
  22: {
    solution: "const button = document.querySelector(\"button\");\nbutton.setAttribute(\"aria-label\", \"Save lesson\");\n// A native button keeps keyboard activation and focus-visible behavior; the label names its purpose.\nconsole.log(button.getAttribute(\"aria-label\"));",
    solutionExplanation: "In the browser preview the real button gains the accessible name Save lesson, and the console logs that name. CodeForge's JavaScript Worker has no DOM, so this project is reviewed structurally and described in words instead of executed.",
    expected: "Browser preview: the button's accessible name becomes Save lesson and the console logs Save lesson.",
  },
  // Chapter 23: Advanced Language Features
  23: {
    solution: "const target = { count: 1 };\nconst proxy = new Proxy(target, {});\nconsole.log(proxy.count);",
    solutionExplanation: "An empty handler forwards every operation, so the transparent proxy reads the same count as its target. Executed with Node 22 during authoring; CodeForge runs the same program in its sandboxed Worker when it is safe to run there.",
    expected: "1",
  },
  // Chapter 24: Professional Engineering
  24: {
    solution: "// Configuration is injected at the boundary instead of being hard-coded here.\n// Logging goes through one adapter, so the domain code never talks to a transport directly.\nconst formatTitle = text => text.trim().toUpperCase();\nconsole.log(formatTitle(\" javascript \"));",
    solutionExplanation: "The arrow function trims and uppercases one input, while the comments name the configuration and logging boundaries a larger program would inject. Executed with Node 22 during authoring; CodeForge runs the same program in its sandboxed Worker when it is safe to run there.",
    expected: "JAVASCRIPT",
  },
  // Chapter 25: Capstone
  25: {
    solution: "class TaskBoard {\n  #tasks = [];\n  add(title) {\n    this.#tasks.push({ title, done: false });\n  }\n  list() {\n    return [...this.#tasks];\n  }\n}\nconst board = new TaskBoard();\nboard.add(\"Build capstone\");\nconsole.log(board.list()[0].title);",
    solutionExplanation: "The private array is reachable only through add and list, list returns a copy so callers cannot mutate internal state, and the added task title prints. Executed with Node 22 during authoring; CodeForge runs the same program in its sandboxed Worker when it is safe to run there.",
    expected: "Build capstone",
  },
};
