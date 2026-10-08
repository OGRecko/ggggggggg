import { courseById } from "./src/courses/catalog";
const id = process.argv[2];
const nums = process.argv.slice(3).map(Number);
const course = courseById(id)!;
console.log(`== ${course.name} ==`);
for (const ch of course.chapters) {
  const flag = nums.length === 0 || nums.includes(ch.number) ? ">>" : "  ";
  console.log(`${flag} ch${String(ch.number).padStart(2)} ${ch.title}`);
  if (flag === ">>") {
    for (const l of ch.lessons) {
      const q = l.quality;
      console.log(`      ${l.id} | ${String(l.kind).padEnd(11)} | ${l.title}  [${q?.authoredDepth ?? "?"}]`);
    }
    const concepts = [...new Set(ch.lessons.flatMap((l) => l.quality?.coveredConcepts ?? []))];
    console.log(`      concepts: ${concepts.join(" ;; ")}`);
  }
}
