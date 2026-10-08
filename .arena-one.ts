import { courseById } from "./src/courses/catalog";
const course = courseById(process.argv[2])!;
for (const n of process.argv[3].split(",").map(Number)) {
  const chapter = course.chapters[n - 1];
  console.log(`ch${n} [${chapter.title}] ${chapter.lessons.length} lessons:`);
  for (const l of chapter.lessons) console.log(`   ${l.kind.padEnd(12)} ${l.quality?.authoredDepth === "authored" ? "AUTHORED " : "scaffold "} ${l.title}`);
}
