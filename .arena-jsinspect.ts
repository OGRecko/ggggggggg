import { courseById } from "./src/courses/catalog";
const course = courseById("javascript")!;
for (const n of [1, 3, 23]) {
  const ch = course.chapters.find((c) => c.number === n)!;
  console.log(`--- ch${n} ${ch.title} ---`);
  for (const l of ch.lessons) {
    console.log(`  ${l.id} ${l.kind}: ${l.title}`);
    for (const s of l.examples) console.log(`      ex: ${s.title} -> ${JSON.stringify(s.output).slice(0, 40)}`);
  }
}
