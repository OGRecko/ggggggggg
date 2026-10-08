import { writeFileSync } from "node:fs";
import { courseById } from "./src/courses/catalog";
const ids = ["python-6-9", "python-7-11", "python-8-9", "python-24-4", "python-15-8", "python-21-2"];
const rows = courseById("python")!.chapters.flatMap((c) => c.lessons).filter((l) => ids.includes(l.id))
  .map((l) => ({ id: l.id, examples: l.examples.map((e) => ({ title: e.title, code: e.code, output: e.output, lines: e.lines.length })), solution: l.exercise.solution, expected: l.exercise.testCases.map((t) => t.expected) }));
writeFileSync("/tmp/changed_python.json", JSON.stringify(rows, null, 1));
console.log(`dumped ${rows.length} changed lessons`);
