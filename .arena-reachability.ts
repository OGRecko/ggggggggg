/**
 * Reachability probe for the app's defensive branches.
 *
 * Several branches in `src/App.tsx` handle states the shipped corpus does not contain — an
 * unavailable chapter, a chapter without a project, a course with no lessons, a checker whose
 * pattern list is invalid. This probe measures which of those states exist, so the report can say
 * "unreachable" from evidence instead of from reading the code.
 *
 * Usage: npx vite-node .arena-reachability.ts
 */
import { courses } from "./src/courses/catalog";
import { checkRequiredPatterns } from "./src/utils/exerciseCheck";

const chapters = courses.flatMap((course) => course.chapters.map((chapter) => ({ course, chapter })));
const lessons = courses.flatMap((course) => course.chapters.flatMap((chapter) => chapter.lessons));
const checkers = lessons.filter((lesson) => lesson.exercise.checker);

const misconfigured = checkers.filter((lesson) => {
  const { invalidPatterns, emptyPatterns } = checkRequiredPatterns(lesson.exercise.solution, lesson.exercise.checker!);
  return invalidPatterns.length > 0 || emptyPatterns.length > 0;
});

const rows: Array<[string, string]> = [
  ["chapters with available === false (the 'In production' view)", String(chapters.filter(({ chapter }) => !chapter.available).length)],
  ["chapters without a project (the null project branch)", String(chapters.filter(({ chapter }) => !chapter.project).length)],
  ["chapters without a test", String(chapters.filter(({ chapter }) => !chapter.test).length)],
  ["courses with zero lessons (the 'Planned' progress row)", String(courses.filter((course) => course.chapters.every((chapter) => chapter.lessons.length === 0)).length)],
  ["exercises with checker.mode 'html' outside htmlcss", String(lessons.filter((lesson) => lesson.exercise.checker?.mode === "html" && !lesson.id.startsWith("htmlcss-")).length)],
  ["lessons with readingCheck undefined (the generated reading check)", String(lessons.filter((lesson) => !lesson.readingCheck).length)],
  ["lessons with an empty examples array", String(lessons.filter((lesson) => lesson.examples.length === 0).length)],
  ["exercise checkers whose pattern list is invalid or empty (the misconfigured message)", String(misconfigured.length)],
];

for (const [label, value] of rows) console.log(`${value.padStart(5)}  ${label}`);
console.log(`\n${lessons.length} lessons, ${checkers.length} of them with a structure checker, across ${courses.length} courses`);
