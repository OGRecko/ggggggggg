import { courseById } from "./src/courses/catalog";
for (const id of ["cpp", "python", "java", "javascript", "htmlcss"]) {
  const course = courseById(id)!;
  const missing: string[] = [];
  for (const chapter of course.chapters) {
    for (const lesson of chapter.lessons) {
      if (lesson.quality?.authoredDepth !== "authored") continue;
      const patterns = lesson.exercise.checker?.requiredPatterns?.length ?? 0;
      if (patterns === 0) missing.push(`ch${chapter.number} ${lesson.kind} "${lesson.title.slice(0, 44)}"`);
      for (const example of lesson.examples) {
        if (example.lines.length !== example.code.split("\n").length) missing.push(`LINES-MISMATCH ch${chapter.number} ${lesson.kind} ${example.lines.length}/${example.code.split("\n").length}`);
      }
    }
  }
  console.log(`${id}: ${missing.length} authored lesson problems` + (missing.length ? "\n  " + missing.join("\n  ") : ""));
}
