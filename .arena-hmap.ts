import { courseById } from "./src/courses/catalog";
const course = courseById("htmlcss")!;
for (const chapter of course.chapters) {
  const kinds = chapter.lessons.map((l) => `${l.kind}${l.quality?.authoredDepth === "authored" ? "*" : ""}`).join(",");
  console.log(`ch${String(chapter.number).padStart(2)} [${chapter.title.slice(0, 28)}] ${kinds}`);
}
