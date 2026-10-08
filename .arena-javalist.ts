import { courseById } from "./src/courses/catalog";
const course = courseById("java")!;
for (const chapter of course.chapters) {
  const rows = chapter.lessons.map((l) => `${l.kind}${l.quality?.authoredDepth === "authored" ? "*" : ""}:${l.title.slice(0, 46)}`);
  console.log(`ch${String(chapter.number).padStart(2)} [${chapter.title.slice(0, 26)}] ${rows.join(" | ")}`);
}
