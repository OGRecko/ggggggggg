/** Dump one lesson's code + notes for precise editing. Usage: npx vite-node .arena-lesson.ts -- <course> <chapter> <kind> */
import { courseById } from "./src/courses/catalog";

const [courseId, chapterNo, onlyKind] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const course = courseById(courseId);
if (!course) throw new Error(`unknown course ${courseId}`);
const chapter = course.chapters.find((c) => c.number === Number(chapterNo));
if (!chapter) throw new Error(`unknown chapter ${chapterNo}`);

for (const lesson of chapter.lessons) {
  if (onlyKind && lesson.kind !== onlyKind) continue;
  console.log(`===== ch${chapter.number} kind=${lesson.kind} title=${lesson.title}`);
  const examples = (lesson as unknown as { examples?: Array<Record<string, unknown>> }).examples ?? [];
  examples.forEach((example, i) => {
    const code = String(example.code ?? "");
    const notes = (example.lines ?? []) as string[];
    console.log(`--- example[${i}] ${String(example.title ?? "")} | output=${JSON.stringify(example.output ?? example.expectedOutput ?? "")} | lines=${code.split("\n").length} notes=${notes.length}`);
    code.split("\n").forEach((line, n) => console.log(`    ${String(n + 1).padStart(2)}| ${line}`));
    notes.forEach((note, n) => console.log(`    note${String(n + 1).padStart(2)}| ${note}`));
  });
}
