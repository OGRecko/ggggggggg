/**
 * Dumps per-chapter project specs and every exercise whose shipped solution does not satisfy its own
 * checker, listing the patterns that are missing. Usage: npx vite-node .arena-dump-verify.ts -- java
 */
import { writeFileSync } from "node:fs";
import { courseById } from "./src/courses/catalog";
import { checkRequiredPatterns } from "./src/utils/exerciseCheck";

const language = process.argv[process.argv.length - 1];
const course = courseById(language);
if (!course) throw new Error(`unknown course: ${language}`);

type Row = Record<string, unknown>;
const projectRows: Row[] = [];
const failures: Row[] = [];
const projectFailures: Row[] = [];

for (const chapter of course.chapters) {
  const project = chapter.project;
  projectRows.push({
    chapter: chapter.number,
    title: chapter.title,
    prompt: project?.prompt,
    requiredPatterns: project?.checker?.requiredPatterns ?? null,
    requiredOneOf: project?.checker?.requiredOneOf ?? null,
    forbidden: project?.checker?.forbiddenPatterns ?? null,
    hints: project?.hints,
    requirements: (project as { requirements?: string[] })?.requirements,
    acceptanceCriteria: (project as { acceptanceCriteria?: string[] })?.acceptanceCriteria,
    edgeCases: (project as { edgeCases?: string[] })?.edgeCases,
    solution: project?.solution,
    solutionExplanation: project?.solutionExplanation,
    testCases: project?.testCases,
    verification: project?.verification ?? chapter.verification ?? null,
  });

  if (project?.solution && project.checker && !checkRequiredPatterns(project.solution, project.checker).passed) {
    projectFailures.push({
      chapter: chapter.number,
      title: chapter.title,
      missing: checkRequiredPatterns(project.solution, project.checker).missing,
      requiredPatterns: project.checker.requiredPatterns ?? null,
      solution: project.solution,
    });
  }

  for (const lesson of chapter.lessons) {
    const exercise = lesson.exercise;
    if (!exercise || !exercise.checker) continue;
    const result = checkRequiredPatterns(exercise.solution, exercise.checker);
    if (result.passed) continue;
    const patterns = exercise.checker?.requiredPatterns ?? [];
    const missing = patterns.filter((pattern) => {
      try {
        return !new RegExp(pattern, "is").test(exercise.solution.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:\\])\/\/.*$/gm, "$1"));
      } catch {
        return true;
      }
    });
    failures.push({
      lesson: lesson.id,
      kind: lesson.kind,
      prompt: exercise.prompt,
      verification: lesson.verification,
      requiredPatterns: patterns,
      requiredOneOf: exercise.checker?.requiredOneOf ?? null,
      forbidden: exercise.checker?.forbiddenPatterns ?? null,
      missing,
      message: result.message,
      solution: exercise.solution,
      hints: exercise.hints,
      testCases: exercise.testCases,
    });
  }
}

const out = `/tmp/${language}_verify_dump.json`;
writeFileSync(out, JSON.stringify({ projectRows, failures, projectFailures }, null, 1));
console.log(`${language}: ${projectRows.length} chapters | ${failures.length} failing lesson exercises | ${projectFailures.length} failing chapter projects -> ${out}`);
