import { writeFileSync } from "node:fs";
import { courseById } from "./src/courses/catalog";
const cpp = courseById("cpp")!;
const ids = ["cpp-12-3", "cpp-16-1"];
const rows = cpp.chapters.flatMap((c) => c.lessons).filter((l) => ids.includes(l.id))
  .map((l) => ({ id: l.id, kind: l.kind, title: l.title, examples: l.examples.map((e) => ({ title: e.title, code: e.code, output: e.output, lines: e.lines.length })), solution: l.exercise.solution, expected: l.exercise.testCases.map((t) => t.expected) }));
const ch12 = cpp.chapters[11].lessons.map((l) => `${l.id}:${l.kind}:${l.title}`);
writeFileSync("/tmp/cpp_new.json", JSON.stringify({ rows, ch12 }, null, 1));
console.log("ch12 lessons:", ch12.join(" | "));
