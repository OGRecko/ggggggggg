/** Extract every code string of a chapter (examples, exercises, projects) into files for real compilation.
 *  Usage: npx vite-node .arena-extract.ts -- <course> <chapter[,chapter...]> [outdir]
 *  Writes <outdir>/<course>-<chapter>-<where>.cpp plus manifest.json with declared outputs. */
import { mkdirSync, writeFileSync } from "node:fs";
import { courseById } from "./src/courses/catalog";

const [courseId, chaptersArg, outdirArg] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const outdir = outdirArg ?? "/tmp/extract";
mkdirSync(outdir, { recursive: true });
const course = courseById(courseId);
if (!course) throw new Error(`unknown course ${courseId}`);

type Entry = { file: string; where: string; output: string; isMain: boolean };
const entries: Entry[] = [];
const chapters = chaptersArg === "all" ? course.chapters.map((c) => c.number) : chaptersArg.split(",").map(Number);

function put(where: string, code: string | undefined, output = ""): void {
  if (!code || !code.trim()) return;
  const safe = where.replace(/[^a-z0-9_-]+/gi, "_");
  const hasMain = /\bint\s+main\s*\(/.test(code);
  const file = `${courseId}-${safe}.cpp`;
  writeFileSync(`${outdir}/${file}`, code + "\n");
  entries.push({ file, where, output, isMain: hasMain });
}

for (const number of chapters) {
  const chapter = course.chapters.find((c) => c.number === number);
  if (!chapter) continue;
  for (const lesson of chapter.lessons) {
    const anyLesson = lesson as unknown as Record<string, any>;
    (anyLesson.examples ?? []).forEach((ex: any, i: number) =>
      put(`ch${number}-${lesson.kind}-${i}-${ex.title ?? "example"}`, ex.code, ex.output ?? ""),
    );
    if (anyLesson.exercise?.starterCode) put(`ch${number}-${lesson.kind}-starter`, anyLesson.exercise.starterCode);
    if (anyLesson.exercise?.solution) put(`ch${number}-${lesson.kind}-solution`, anyLesson.exercise.solution, anyLesson.exercise.testCases?.[0]?.expected ?? "");
  }
  if (chapter.project) {
    const project = chapter.project as unknown as Record<string, any>;
    put(`ch${number}-project-starter`, project.starterCode);
    put(`ch${number}-project-solution`, project.solution ?? project.referenceSolution, project.expectedOutput ?? "");
  }
}
writeFileSync(`${outdir}/manifest.json`, JSON.stringify(entries, null, 2));
console.log(`wrote ${entries.length} code files to ${outdir} (${entries.filter((e) => e.isMain).length} complete programs)`);
for (const entry of entries) console.log(`  ${entry.isMain ? "PROGRAM" : "fragment"} ${entry.file} | declared output: ${JSON.stringify(entry.output)}`);
