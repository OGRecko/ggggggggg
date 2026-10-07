import { courseById } from "./src/courses/catalog";
const chapter = courseById("htmlcss")!.chapters[7];
console.log(`chapter ${chapter.number}: ${chapter.title}`);
console.log("qualitySummary:", chapter.qualitySummary);
for (const lesson of chapter.lessons) {
  const q = lesson.quality as { coveredConcepts?: string[] } | undefined;
  console.log(`- ${lesson.id} [${lesson.kind}] ${lesson.title} | concepts: ${JSON.stringify(q?.coveredConcepts ?? [])}`);
}
