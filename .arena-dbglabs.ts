/** Dumps the shipped Python debugging labs (id, examples, exercise) for out-of-tree execution. */
import { writeFileSync } from "node:fs";
import { courseById } from "./src/courses/catalog";

const course = courseById("python")!;
const rows = course.chapters
  .flatMap((chapter) => chapter.lessons)
  .filter((lesson) => lesson.kind === "debug")
  .map((lesson) => ({
    id: lesson.id,
    chapter: lesson.chapter,
    order: lesson.order,
    title: lesson.title,
    examples: lesson.examples.map((example) => ({ title: example.title, code: example.code, output: example.output, lineCount: example.lines.length })),
    exercise: {
      prompt: lesson.exercise.prompt,
      starter: lesson.exercise.starterCode,
      solution: lesson.exercise.solution,
      expected: lesson.exercise.testCases.map((testCase) => testCase.expected),
      hints: lesson.exercise.hints.length,
    },
    recap: lesson.recap.length,
    guide: lesson.decisionGuide?.length ?? 0,
  }));
writeFileSync("/tmp/python_debug_labs.json", JSON.stringify(rows, null, 1));
console.log(`debug lessons: ${rows.length} -> /tmp/python_debug_labs.json`);
