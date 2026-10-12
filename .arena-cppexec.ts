/**
 * Dumps every C++ code string that the lesson presents with a declared result — lesson examples,
 * exercise solutions, chapter projects, and exercise starters — together with the lesson context
 * the driver needs to judge it fairly (lesson kind, and whether the lesson ships a deliberately
 * broken example). Usage:
 *
 *   npx vite-node .arena-cppexec.ts     # writes /tmp/cpp_exec.json
 *   python3 .arena-cppexec.py           # compiles and runs each program with g++
 *
 * A starter is an instruction, not a finished program: most are scaffolds that cannot compile
 * until the learner writes the requested pieces, and the debug lessons deliberately ship a broken
 * scaffold (`std::cot`). The driver therefore syntax-checks starters as fragments and classifies
 * the result instead of demanding a match, and it keeps the two kinds of expectation apart for
 * complete programs: ordinary samples must compile, run, and print exactly what the lesson claims,
 * while a deliberately broken sample must fail — a broken sample that compiles and matches would be
 * the surprise, because the lesson tells the learner to hunt for a defect that is not there.
 */
import { writeFileSync } from "node:fs";
import { courseById } from "./src/courses/catalog";

const course = courseById("cpp");
if (!course) throw new Error("unknown course: cpp");

type Row = {
  where: string;
  kind: string;
  code: string;
  expected?: string;
  lessonKind?: string;
  lessonHasBrokenExample?: boolean;
};
const rows: Row[] = [];

for (const chapter of course.chapters) {
  for (const lesson of chapter.lessons) {
    const lessonHasBrokenExample = (lesson.examples ?? []).some((sample) => /broken/i.test(sample.title));
    for (const [index, sample] of (lesson.examples ?? []).entries()) {
      rows.push({ where: `${lesson.id}/${sample.title}`, kind: `example-${index}`, code: sample.code, expected: sample.output, lessonKind: lesson.kind, lessonHasBrokenExample });
    }
    if (lesson.exercise) {
      rows.push({ where: `${lesson.id} [starter]`, kind: "starter", code: lesson.exercise.starterCode, expected: lesson.exercise.testCases?.[0]?.expected, lessonKind: lesson.kind, lessonHasBrokenExample });
      rows.push({ where: `${lesson.id} [solution]`, kind: "solution", code: lesson.exercise.solution, expected: lesson.exercise.testCases?.[0]?.expected, lessonKind: lesson.kind, lessonHasBrokenExample });
    }
  }
  const testCase = chapter.project?.testCases?.[0];
  if (chapter.project?.solution) {
    rows.push({ where: `ch${chapter.number}/${chapter.project.title}`, kind: "project", code: chapter.project.solution, expected: testCase?.expected, lessonKind: "project" });
  }
}

writeFileSync("/tmp/cpp_exec.json", JSON.stringify(rows, null, 1));
const withoutOutput = rows.filter((row) => row.expected === undefined).length;
console.log(`${rows.length} C++ strings dumped (${rows.length - withoutOutput} with a declared result, ${withoutOutput} without) -> /tmp/cpp_exec.json`);
