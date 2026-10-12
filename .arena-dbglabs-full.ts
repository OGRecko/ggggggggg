/** Dumps the full text of the shipped Python debugging labs for out-of-tree claim checks. */
import { writeFileSync } from "node:fs";
import { courseById } from "./src/courses/catalog";

const rows = courseById("python")!.chapters
  .flatMap((chapter) => chapter.lessons)
  .filter((lesson) => lesson.kind === "debug")
  .map((lesson) => ({
    id: lesson.id,
    chapter: lesson.chapter,
    title: lesson.title,
    summary: lesson.summary,
    goals: lesson.learningGoals,
    explanation: lesson.explanation,
    keywords: lesson.keywordNotes,
    recap: lesson.recap,
    guide: lesson.decisionGuide ?? [],
    examples: lesson.examples.map((example) => ({ title: example.title, code: example.code, output: example.output, explanation: example.explanation })),
    exercise: lesson.exercise,
  }));
writeFileSync("/tmp/python_debug_labs_full.json", JSON.stringify(rows, null, 1));
console.log(`dumped ${rows.length} debug labs`);
