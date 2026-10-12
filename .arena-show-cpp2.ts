import { courseById } from "./src/courses/catalog";
const course = courseById("cpp")!;
for (const n of [5, 11]) {
  const ch = course.chapters.find((c) => c.number === n)!;
  console.log(`ch${n}: ${ch.lessons.map((l) => `${l.kind}:${l.title.slice(0, 42)}`).join(" | ")}`);
}
