import { writeFileSync } from "node:fs";
import { courses } from "./src/courses/catalog";
import { coverageAudit } from "./src/data/coverageAudit";

const esc = (value: string) => value.replaceAll("|", "\\|").replaceAll("\n", " ");
const lines: string[] = [
  "# Curriculum coverage map",
  "",
  "**Snapshot date:** 2026-10-13",
  "**Scope:** every shipped course, chapter, and lesson in the current workspace. This is an inventory, not a completion claim.",
  "",
  "## Measurement notes",
  "",
  "- Current catalog census: 5 languages, 125 chapters, 821 lessons, 141 lessons marked `authored`, 1,689 examples (317 inside authored lessons).",
  "- `hidden-test count` is **0 for every lesson and project** in this snapshot. The `TestCase` schema and behavioral grader support `hidden`, `append`, line-oriented `input`, `kind` (`output`/`throws`/`state`), and clamped `timeoutMs`, but those gates have not yet been attached to the shipped lesson/project corpus. Do not interpret a normal visible case as a hidden case.",
  "- `distinct outputs` counts distinct strings in the lesson's current `testCases`. A separate real-JavaScript-Worker infrastructure fixture proves starter failure, reference success, alternative-reference success, and hardcoded-transcript-cheat failure across low/standard/high/invalid outputs. Lesson-specific four-plus behavioral tests, alternative solutions, and cheat gates remain to be migrated.",
  "- This map measures current lesson metadata and grading fields. It does not certify browser behavior, compiler execution, correctness, or chapter completion.",
  "",
  "## Per-language totals and in-app execution boundary",
  "",
  "| Language | Chapters | Lessons | Authored lessons | Hidden lesson cases | Current in-app boundary |",
  "|---|---:|---:|---:|---:|---|",
];

const runtime: Record<string, string> = {
  python: "Pyodide Worker where supported; code/input, wall-clock, stdout, and stderr are capped; no hard memory cap; package/CDN, sqlite3, and OS process/thread behavior remain bounded or unverified.",
  java: "Static structural checking only in-app; no JVM/compiler is claimed.",
  javascript: "Browser Worker where supported; code/input, wall-clock, output, and scheduled-timer counts are capped; no hard memory cap; DOM/network boundaries are unavailable.",
  cpp: "Static structural checking only in-app; no compiler is claimed.",
  htmlcss: "Sandboxed preview plus parse5 DOM and PostCSS structure/accessibility/layout assertions; no full browser, geometry, or assistive-technology audit is claimed.",
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
  "Each lesson row lists its current authored-depth label, current hidden-case count, and concrete grading/content gaps visible in the shipped corpus. Chapter-level rows record the mixed-test and project checkpoints separately. The schema/grader already model the case modes; absence of lesson cases is a corpus gap, not a missing field.",
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
      `project hidden cases ${projectHidden}; ${projectCases} visible case(s); hidden behavioral project gates remain to be authored`,
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
        `${hidden} hidden case(s); add behaviorally distinct hidden cases to this lesson corpus`,
        `${distinct} distinct expected output(s); add at least 4 behaviorally distinct outputs including edges`,
        "alternate passing reference solution missing",
        "hardcoded-output cheat rejection missing",
        "append/input/throws/state/timeout are supported by the schema and grader; migrate lesson-specific hidden behavioral tests and an alternative passing implementation",
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
  "- The behavioral-grading schema, grader, hidden-failure reporting, and runner limits are implemented and unit/corpus-tested. Add hidden cases to real lesson/project corpus rows; keep each lesson at 4+ distinct behaviors with boundary cases, a passing alternative reference, and a failing hardcoded-output cheat.",
  "- Migrate JavaScript chapters 1–4 through those behavior gates, one chapter batch at a time, before beginning JavaScript 5–25. No JavaScript chapter 5 migration is started in this snapshot.",
  "- After JS1–4 gates, continue JavaScript 5–25; append genuine Python gap content without rewriting existing material; then proceed through Java, C++, and HTML/CSS in the requested order.",
  "- Expand chapter tests to 8–12 mixed items and add executed-code, cumulative, and realistic hidden-tested project checks.",
  "- JavaScript/Python wall-clock, code/input, and output caps are implemented; timeout, syntax/type/compile/runtime/logic/test-failure/resource-limit classes are explicit, and source highlighting occurs only for runner-reported user lines. A hard memory cap is not implemented or claimed. Java/C++ share static-only pattern review (no compiler). HTML/CSS now uses parse5 DOM and PostCSS checks; actual browser layout/accessibility verification remains open.",
  "- Browser walkthrough, accessibility verification, and dependency findings remain separate evidence obligations; never infer them from this static map.",
  "",
);

writeFileSync("CURRICULUM_COVERAGE_MAP.md", `${lines.join("\n").trimEnd()}\n`);
console.log(`Wrote CURRICULUM_COVERAGE_MAP.md with ${courses.length} courses, ${courses.reduce((total, course) => total + course.chapters.reduce((chapterTotal, chapter) => chapterTotal + chapter.lessons.length, 0), 0)} lesson rows.`);
