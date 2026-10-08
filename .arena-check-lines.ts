import { courses } from "./src/courses/catalog";
for (const course of courses) {
  for (const chapter of course.chapters) {
    for (const lesson of chapter.lessons) {
      for (const ex of lesson.examples) {
        const n = ex.code.split("\n").length;
        if (ex.lines.length !== n) {
          console.log(`${course.id} ${lesson.id} "${ex.title}": code ${n} lines, notes ${ex.lines.length}`);
          ex.lines.forEach((l, i) => console.log(`    ${i + 1}: ${l.slice(0, 60)}`));
        }
      }
    }
  }
}
