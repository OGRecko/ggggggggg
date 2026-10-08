/**
 * Dumps every executable Python program of the Python course with its declared output and the
 * input its first test case supplies, so the programs can be executed outside the app and compared
 * against what the lessons claim. Usage:
 *
 *   npx vite-node .arena-pyexec.ts          # writes /tmp/python_exec.json
 *   python3 .arena-pyexec.py                # executes and compares (see that file for the shim)
 *
 * The runner is not a second implementation: `.arena-pyexec.py` reproduces the shipped Pyodide
 * runner's input shim line for line, so "the app's output" means the same prompt handling, the same
 * lack of echo, and the same EOFError when no line is available.
 */
import { writeFileSync } from "node:fs";
import { courseById } from "./src/courses/catalog";

const course = courseById("python");
if (!course) throw new Error("unknown course: python");

type Row = { where: string; kind: string; code: string; expected?: string; input?: string };
const rows: Row[] = [];

for (const chapter of course.chapters) {
  for (const lesson of chapter.lessons) {
    for (const [index, sample] of (lesson.examples ?? []).entries()) {
      rows.push({ where: `${lesson.id}/${sample.title}`, kind: `example-${index}`, code: sample.code, expected: sample.output });
    }
    if (lesson.exercise) {
      const testCase = lesson.exercise.testCases?.[0];
      rows.push({ where: `${lesson.id} [solution]`, kind: "solution", code: lesson.exercise.solution, expected: testCase?.expected, input: testCase?.input });
    }
  }
  const testCase = chapter.project?.testCases?.[0];
  if (chapter.project?.solution) rows.push({ where: `ch${chapter.number}/${chapter.project.title}`, kind: "project", code: chapter.project.solution, expected: testCase?.expected, input: testCase?.input });
}

writeFileSync("/tmp/python_exec.json", JSON.stringify(rows, null, 1));
const withoutOutput = rows.filter((row) => row.expected === undefined).length;
console.log(`${rows.length} Python programs dumped (${rows.length - withoutOutput} with a declared output, ${withoutOutput} without) -> /tmp/python_exec.json`);
