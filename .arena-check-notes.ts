import { courseById } from "./src/courses/catalog";
const course = courseById(process.argv[2])!;
const lesson = course.chapters.flatMap((c) => c.lessons).find((l) => l.id === process.argv[3])!;
const sample = Number(process.argv[4]);
const ex = lesson.examples[sample];
const code = ex.code.split("\n");
console.log(`--- ${lesson.id} "${ex.title}" : ${code.length} code lines, ${ex.lines.length} notes ---`);
for (let i = 0; i < Math.max(code.length, ex.lines.length); i += 1) {
  const note = ex.lines[i] ?? "(no note)";
  const noteBody = note.replace(/^Line \d+: /, "").replace(/^`[^`]*`\. /, "").slice(0, 64);
  console.log(`${String(i + 1).padStart(2)} | ${(code[i] ?? "").padEnd(52).slice(0, 52)} | ${noteBody}`);
}
