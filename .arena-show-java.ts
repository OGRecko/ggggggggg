import { courseById } from "./src/courses/catalog";
const course = courseById("java")!;
for (const n of [6, 7, 15, 17]) {
  const ch = course.chapters.find((c) => c.number === n)!;
  console.log(`ch${n}: ${ch.lessons.map((l) => `${l.kind}:${l.title.slice(0, 34)}`).join(" | ")}`);
}
