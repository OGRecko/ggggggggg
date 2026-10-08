/**
 * Dumps every code string of one course to /tmp/<language>_code.json for out-of-tree parser checks.
 * Usage: npx vite-node .arena-dump-code.ts -- java
 */
import { writeFileSync } from "node:fs";
import { courseById } from "./src/courses/catalog";

const language = process.argv[process.argv.length - 1];
const course = courseById(language);
if (!course) throw new Error(`unknown course: ${language}`);

type Row = {
  where: string;
  kind: string;
  code: string;
  output?: string;
  requiredPatterns?: string[];
  /** Which lesson kind produced this string, so audits can judge it in context. */
  lessonKind?: string;
  /** True when the lesson ships the deliberately broken half of a debug pair. */
  lessonHasBrokenExample?: boolean;
};
const rows: Row[] = [];

for (const chapter of course.chapters) {
  for (const lesson of chapter.lessons) {
    const lessonHasBrokenExample = (lesson.examples ?? []).some((sample) => /broken/i.test(sample.title));
    for (const [index, sample] of (lesson.examples ?? []).entries()) {
      rows.push({ where: `${lesson.id}/${sample.title}`, kind: `example-${index}`, code: sample.code, output: sample.output, lessonKind: lesson.kind, lessonHasBrokenExample });
    }
    if (lesson.exercise) {
      rows.push({ where: `${lesson.id} [starter]`, kind: "starter", code: lesson.exercise.starterCode, output: lesson.exercise.testCases?.[0]?.expected, requiredPatterns: lesson.exercise.checker?.requiredPatterns, lessonKind: lesson.kind, lessonHasBrokenExample });
      rows.push({ where: `${lesson.id} [solution]`, kind: "solution", code: lesson.exercise.solution, output: lesson.exercise.testCases?.[0]?.expected, requiredPatterns: lesson.exercise.checker?.requiredPatterns, lessonKind: lesson.kind, lessonHasBrokenExample });
    }
  }
  if (chapter.project?.solution) rows.push({ where: `ch${chapter.number}/${chapter.project.title}`, kind: "project", code: chapter.project.solution, requiredPatterns: chapter.project.checker?.requiredPatterns });
}

writeFileSync(`/tmp/${language}_code.json`, JSON.stringify(rows, null, 1));
console.log(`${language}: ${rows.length} code strings -> /tmp/${language}_code.json`);
