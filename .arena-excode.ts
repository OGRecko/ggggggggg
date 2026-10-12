import { writeFileSync } from "node:fs";
import { courses } from "./src/courses/catalog";

type Row = { course: string; lessonId: string; chapter: number; kind: string; title: string; code: string };
const rows: Row[] = [];
for (const course of courses) {
  for (const chapter of course.chapters) {
    for (const lesson of chapter.lessons) {
      for (const example of lesson.examples ?? []) {
        rows.push({ course: course.id, lessonId: lesson.id, chapter: chapter.number, kind: lesson.kind ?? "learn", title: example.title, code: example.code });
      }
    }
  }
}
writeFileSync("/tmp/example_codes.json", JSON.stringify(rows, null, 1));
console.log(`example codes: ${rows.length}`);
