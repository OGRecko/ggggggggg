/** Dumps every JavaScript code string plus its declared expected output to /tmp/js_snippets.json. */
import { writeFileSync } from "node:fs";
import { javascriptCourse } from "./src/courses/javascript";

type Row = { where: string; kind: string; code: string; output?: string; verification: string[] };
const rows: Row[] = [];

for (const chapter of javascriptCourse.chapters) {
  for (const lesson of chapter.lessons) {
    for (const sample of lesson.examples ?? []) {
      rows.push({
        where: `${lesson.id}/${sample.title}`,
        kind: "example",
        code: sample.code,
        output: sample.output,
        verification: lesson.verification ?? [],
      });
    }
    if (lesson.exercise) {
      rows.push({
        where: `${lesson.id} [starter]`,
        kind: "starter",
        code: lesson.exercise.starterCode,
        verification: lesson.verification ?? [],
      });
      rows.push({
        where: `${lesson.id} [solution]`,
        kind: "solution",
        code: lesson.exercise.solution,
        output: lesson.exercise.testCases?.[0]?.expected ?? (lesson.exercise as { expected?: string }).expected,
        verification: lesson.verification ?? [],
      });
    }
  }
  if (chapter.project) {
    rows.push({
      where: `ch${chapter.index}/${chapter.project.title}`,
      kind: "project-solution",
      code: chapter.project.solution ?? "",
      output: chapter.project.testCases?.[0]?.expected,
      verification: chapter.project.verification ?? [],
    });
  }
}

writeFileSync("/tmp/js_snippets.json", JSON.stringify(rows, null, 1));
console.log(`javascript code strings: ${rows.length}`);
