/** Validate Java code strings with the real Lezer Java grammar used by the editor.
 *  Usage: npx vite-node .arena-javaparse.ts [-- <course>|all] */
import { javaLanguage } from "@codemirror/lang-java";
import { courseById, courses } from "./src/courses/catalog";

type Row = { where: string; kind: string; code?: string };
function codeRows(courseId: string): Row[] {
  const course = courseById(courseId)!;
  const rows: Row[] = [];
  for (const chapter of course.chapters) {
    for (const lesson of chapter.lessons) {
      (lesson.examples ?? []).forEach((ex, i) => rows.push({ where: `${lesson.id}/ex${i} ${ex.title.slice(0, 38)}`, kind: "example", code: ex.code }));
      if (lesson.exercise) {
        rows.push({ where: `${lesson.id} [starter]`, kind: "starter", code: lesson.exercise.starterCode });
        rows.push({ where: `${lesson.id} [solution]`, kind: "solution", code: lesson.exercise.solution });
      }
    }
    rows.push({ where: `ch${chapter.number} [project]`, kind: "project", code: chapter.project?.solution });
  }
  return rows;
}

function errors(code: string): string[] {
  const tree = javaLanguage.parser.parse(code);
  const out: string[] = [];
  tree.iterate({ enter: (node) => { if (node.name.includes("⚠") || node.type.isError) out.push(`${node.name}@${node.from}-${node.to}`); } });
  return out;
}

const argv = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const wanted = argv.length === 0 || argv.includes("all") ? courses.map((c) => c.id) : argv;
for (const id of wanted) {
  const rows = codeRows(id).filter((r) => (r.code ?? "").trim().length > 0);
  const bad: Array<[Row, string[]]> = [];
  for (const row of rows) {
    const errs = errors(row.code!);
    if (errs.length) bad.push([row, errs]);
  }
  console.log(`\n=== ${id}: ${rows.length} code strings | ${bad.length} with grammar errors`);
  for (const [row, errs] of bad.slice(0, 40)) {
    console.log(`  ${row.where} [${row.kind}] -> ${errs.slice(0, 3).join(", ")}`);
    console.log(`      ${(row.code ?? "").split("\n").slice(0, 3).join(" ⏎ ").slice(0, 150)}`);
  }
}
