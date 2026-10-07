import { courseById } from "./src/courses/catalog";
const course = courseById("htmlcss")!;
for (const n of [9, 10, 12]) {
  const ch = course.chapters.find((c) => c.number === n)!;
  console.log(`ch${n}: ${ch.lessons.map((l) => `${l.kind}:${l.title.slice(0, 30)}`).join(" | ")}`);
}
