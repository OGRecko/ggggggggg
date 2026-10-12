/** Dumps every lesson's prose and code fields so construct claims can be audited out of tree. */
import { writeFileSync } from "node:fs";
import { courses } from "./src/courses/catalog";

const rows = courses.flatMap((course) =>
  course.chapters.flatMap((chapter) =>
    chapter.lessons.map((lesson) => ({
      course: course.id,
      id: lesson.id,
      chapter: chapter.number,
      kind: lesson.kind ?? "learn",
      title: lesson.title,
      summary: lesson.summary,
      goals: lesson.learningGoals ?? [],
      keywords: lesson.keywordNotes ?? [],
      explanation: lesson.explanation,
      recap: lesson.recap ?? [],
      guide: (lesson.decisionGuide ?? []).flatMap((row) => [row.use, row.insteadOf, row.reason]),
      readingCheck: lesson.readingCheck ? [lesson.readingCheck.prompt, lesson.readingCheck.explanation, ...lesson.readingCheck.choices] : [],
      hints: lesson.exercise?.hints ?? [],
      solutionExplanation: lesson.exercise?.solutionExplanation ?? "",
      examples: (lesson.examples ?? []).map((example) => ({ title: example.title, code: example.code, lines: example.lines })),
      starterCode: lesson.exercise?.starterCode ?? "",
      solution: lesson.exercise?.solution ?? "",
      prompt: lesson.exercise?.prompt ?? "",
    })),
  ),
);
writeFileSync("/tmp/lesson_claims.json", JSON.stringify(rows, null, 1));
console.log(`lessons dumped: ${rows.length}`);
