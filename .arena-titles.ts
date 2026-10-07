import { courseById } from "./src/courses/catalog";
for (const chapter of courseById("python")!.chapters) {
  const debug = chapter.lessons.find((lesson) => lesson.kind === "debug");
  console.log(`${chapter.number}|${chapter.title}|${debug?.title ?? "-"}|${debug?.examples[0]?.title ?? ""}`);
}
