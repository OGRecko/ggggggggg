import { courseById } from "./src/courses/catalog";
const c = courseById("python")!;
for (const ch of c.chapters) for (const l of ch.lessons) {
  if (l.id === "python-18-8" || l.id === "python-21-9" || l.id === "python-2-2" || l.id === "python-2-5" || l.id === "python-2-6") {
    console.log(`### ${l.id} kind=${l.kind} title=${l.title}`);
    console.log(`  description: ${l.description}`);
    console.log(`  prompt:      ${(l.exercise?.prompt ?? "").slice(0, 220)}`);
    console.log(`  starter:     ${(l.exercise?.starterCode ?? "").replace(/\n/g, " ").slice(0, 160)}`);
    console.log(`  solution:    ${(l.exercise?.solution ?? "").replace(/\n/g, " ").slice(0, 200)}`);
    console.log(`  expected:    ${JSON.stringify(l.exercise?.testCases?.[0]?.expected)}  input: ${JSON.stringify(l.exercise?.testCases?.[0]?.input)}`);
    for (const e of l.examples ?? []) console.log(`  example "${e.title}" output=${JSON.stringify(e.output)}\n    explanation: ${e.explanation}`);
    console.log();
  }
}
