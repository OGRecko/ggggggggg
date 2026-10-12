import { courseById } from "./src/courses/catalog";
const course = courseById("java")!;
for (const n of [6, 7]) {
  const ch = course.chapters.find((c) => c.number === n)!;
  console.log(`ch${n} lesson kinds:`, ch.lessons.map((l) => l.kind).join(","));
  for (const l of ch.lessons) console.log("   ", l.id, "|", l.kind, "|", l.title);
}
