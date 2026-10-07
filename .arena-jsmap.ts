import { courseById } from "./src/courses/catalog";
const course = courseById("javascript")!;
for (const chapter of course.chapters) {
  const kinds = chapter.lessons.map((l) => `${l.kind}${l.quality?.authoredDepth === "authored" ? "*" : ""}`);
  const concepts = new Set<string>();
  for (const lesson of chapter.lessons) for (const c of lesson.quality?.coveredConcepts ?? []) concepts.add(c);
  console.log(`ch${String(chapter.number).padStart(2)} [${chapter.title}] kinds: ${kinds.join(",")}`);
  console.log(`     concepts: ${[...concepts].join(" ;; ")}`);
}
