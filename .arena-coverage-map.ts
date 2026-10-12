import { writeFileSync } from "node:fs";
import { courses } from "./src/courses/catalog";
import { coverageAudit } from "./src/data/coverageAudit";

const esc = (value: string) => value.replaceAll("|", "\\|").replaceAll("\n", " ");
const lines: string[] = [
  "# Curriculum coverage map",
  "",
  "**Snapshot date:** 2026-10-12",
  "**Scope:** every shipped course, chapter, and lesson in the current workspace. This is an inventory, not a completion claim.",
  "",
  "## Measurement notes",
  "",
  "- Current catalog census: 5 languages, 125 chapters, 821 lessons, 141 lessons marked `authored`, 1,689 examples (317 inside authored lessons).",
  "- `hidden-test count` is **0 for every lesson and project** in this snapshot. `TestCase` currently has only `label`, optional `input`, and `expected`; there is no visibility/hidden-case field. Do not interpret a normal visible case as a hidden case.",
  "- `distinct outputs` counts distinct strings in the lesson's current `testCases`. The requested four-plus distinct-output behavioral corpus, alternative reference solutions, and hardcoded-output cheat checks are not implemented yet.",
  "- This map measures current lesson metadata and grading fields. It does not certify browser behavior, compiler execution, correctness, or chapter completion.",
  "",
  "## Per-language totals and in-app execution boundary",
  "",
  "| Language | Chapters | Lessons | Authored lessons | Hidden lesson cases | Current in-app boundary |",
  "|---|---:|---:|---:|---:|---|",
];

const runtime: Record<string, string> = {
  python: "Pyodide Worker where supported; package/CDN, sqlite3, OS process/thread behavior remain bounded or unverified.",
  java: "Static structural checking only in-app; no JVM/compiler is claimed.",
  javascript: "Browser Worker execution where supported; DOM/network/timer boundaries use preview or declared stubs.",
  cpp: "Static structural checking only in-app; no compiler is claimed.",
  htmlcss: "Sandboxed browser preview plus structural validation; no full accessibility/browser matrix is claimed.",
};

for (const course of courses) {
  const lessons = course.chapters.flatMap((chapter) => chapter.lessons);
  const authored = lessons.filter((lesson) => lesson.quality?.authoredDepth === "authored").length;
  lines.push(`| ${course.name} | ${course.chapters.length} | ${lessons.length} | ${authored} | 0 | ${runtime[course.id]} |`);
}

lines.push(
  "",
  "## Language → chapter → lesson detail",
  "",
  "Each lesson row lists its current authored-depth label, current hidden-case count, and concrete grading/content gaps visible in the shipped schema. Chapter-level rows record the mixed-test and project checkpoints separately.",
  "",
);

for (const course of courses) {
  lines.push(`### ${course.name}`, "", "| Chapter | Chapter title | Lesson | Authorship depth | Hidden tests | Missing work |", "|---:|---|---|---|---:|---|");
  for (const chapter of course.chapters) {
    const chapterTests = chapter.test?.length ?? 0;
    const projectHidden = 0;
    const projectCases = chapter.project?.testCases?.length ?? 0;
    const cumulative = chapter.cumulativeTest?.length ?? 0;
    const chapterGaps = [
      chapterTests < 8 ? `chapter test has ${chapterTests} questions; target is 8–12 mixed items` : "",
      `project hidden cases ${projectHidden}; ${projectCases} visible project case(s) only`,
      chapter.number % 5 === 0 && cumulative === 0 ? "missing cumulative checkpoint" : "",
    ].filter(Boolean).join("; ");
    lines.push(`| **${chapter.number}** | **${esc(chapter.title)}** | — | — | 0 | ${esc(chapterGaps || `chapter test ${chapterTests}; cumulative checkpoint ${cumulative || "none"}`)} |`);
    for (const lesson of chapter.lessons) {
      const depth = lesson.quality?.authoredDepth ?? "unclassified";
      const cases = lesson.exercise.testCases ?? [];
      const hidden = cases.filter((testCase) => "hidden" in testCase && Boolean((testCase as { hidden?: boolean }).hidden)).length;
      const distinct = new Set(cases.map((testCase) => testCase.expected)).size;
      const gaps = [
        depth === "scaffolded" ? "content remains scaffolded; author to topic-appropriate depth" : depth === "unclassified" ? "authorship depth is not explicitly tagged; review before promotion" : "",
        `${hidden} hidden case(s); hidden cases not supported by the current TestCase schema`,
        `${distinct} distinct expected output(s); add 4+ varied behavioral cases`,
        "alternate passing reference solution missing",
        "hardcoded-output cheat rejection missing",
        "appended harness/expected-throws/state/timeout modes not implemented; simple stdin is supported via TestCase.input",
      ].filter(Boolean).join("; ");
      lines.push(`| ${chapter.number} | ${esc(chapter.title)} | ${esc(lesson.title)} | ${depth} | ${hidden} | ${esc(gaps)} |`);
    }
  }
  lines.push("");
}

lines.push(
  "## Audit-led coverage statuses",
  "",
  "The product's `coverageAudit` remains conservative. `PARTIAL` is retained for all in-scope curriculum rows; the following four rows remain `MISSING` because the required support is not implemented:",
  "",
);
for (const [language, rows] of Object.entries(coverageAudit)) {
  const missing = rows.filter((row) => row.status === "MISSING");
  if (missing.length) {
    for (const row of missing) lines.push(`- **${language} — ${row.topic}: MISSING.** ${row.lessons}`);
  }
}
lines.push(
  "",
  "## Global work still required before any chapter can be called COMPLETE",
  "",
  "- Add and test behavioral grading modes for appended harness code, expected throws, state, timeout, and hidden cases; simple per-case stdin already exists through TestCase.input. Run the hidden corpus through supported real executors and show labeled hidden failures.",
  "- Gate exercises on 4+ distinct outputs, a failing hardcoded-output cheat, a passing alternative solution, and a failing starter.",
  "- Complete JavaScript chapters 5–25 before claiming a complete JavaScript course; fill genuine Python gaps without rewriting its 25-chapter curriculum; proceed through Java, C++, then HTML/CSS in the requested order.",
  "- Expand chapter tests to 8–12 mixed items and add executed-code, cumulative, and realistic hidden-tested project checks.",
  "- Extend partial runtime diagnostics consistently: JavaScript/Python already have Worker timeouts and error-line fields, but timeout is not separately labeled and static-check line feedback is heuristic; add error categories, regression tests, and keep Java/C++ explicitly static-only. Add parsed DOM/style assessment for HTML/CSS.",
  "- Browser walkthrough, accessibility verification, and dependency findings remain separate evidence obligations; never infer them from this static map.",
  "",
);

writeFileSync("CURRICULUM_COVERAGE_MAP.md", `${lines.join("\n").trimEnd()}\n`);
console.log(`Wrote CURRICULUM_COVERAGE_MAP.md with ${courses.length} courses, ${courses.reduce((total, course) => total + course.chapters.reduce((chapterTotal, chapter) => chapterTotal + chapter.lessons.length, 0), 0)} lesson rows.`);
