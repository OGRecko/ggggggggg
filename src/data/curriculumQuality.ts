import type { AuthoredDepth, Chapter, ChapterTest, Course, Lesson, LessonKind, ProjectExercise } from "./types";

export type RepetitionFinding = {
  kind: "lesson-prompt" | "lesson-explanation" | "test-question" | "project-requirement" | "starter-code" | "solution";
  firstId: string;
  secondId: string;
  similarity: number;
  firstText: string;
  secondText: string;
};

export type CourseQualitySummary = {
  chaptersWithDebugging: number[];
  chaptersWithBlankPage: number[];
  chaptersMissingAcceptanceCriteria: number[];
  chaptersWithInvalidPrerequisites: number[];
  authoredMajorChapters: number[];
  repetitiveFindings: RepetitionFinding[];
};

const STOP_WORDS = new Set([
  "a", "an", "and", "the", "to", "for", "of", "in", "on", "with", "this", "that", "use", "build", "chapter", "lesson", "code", "program", "result", "working", "real", "language", "requested", "practice", "from", "your", "their", "into", "then", "after", "before", "one", "two", "small", "focus", "using", "write", "create",
]);

function tokenize(text: string) {
  return text
    .toLowerCase()
    .replace(/[`"'“”‘’]/g, "")
    .replace(/[0-9]+/g, " ")
    .replace(/[^a-z#+.\s-]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
}

function similarity(left: string, right: string) {
  const a = new Set(tokenize(left));
  const b = new Set(tokenize(right));
  if (!a.size || !b.size) return 0;
  const shared = [...a].filter((token) => b.has(token)).length;
  return shared / Math.max(a.size, b.size);
}

function normalizedFingerprint(text: string) {
  return text
    .toLowerCase()
    .replace(/[`"'“”‘’]/g, "")
    .replace(/[0-9]+/g, " ")
    .replace(/[^a-z#+.\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function repeated(kind: RepetitionFinding["kind"], items: Array<{ id: string; text: string }>, threshold = 0.97) {
  const findings: RepetitionFinding[] = [];
  for (let index = 0; index < items.length; index += 1) {
    for (let other = index + 1; other < items.length; other += 1) {
      const left = items[index].text.trim();
      const right = items[other].text.trim();
      const leftTokens = tokenize(left);
      const rightTokens = tokenize(right);
      const sameFingerprint = normalizedFingerprint(left) === normalizedFingerprint(right);
      const score = similarity(left, right);
      const substantialPair = left.length >= 120 && right.length >= 120 && Math.min(leftTokens.length, rightTokens.length) >= 12;
      if (sameFingerprint || (substantialPair && score >= threshold)) {
        findings.push({ kind, firstId: items[index].id, secondId: items[other].id, similarity: sameFingerprint ? 1 : score, firstText: items[index].text, secondText: items[other].text });
      }
    }
  }
  return findings;
}

function lessonKinds(chapter: Chapter) {
  return new Set(chapter.lessons.map((lesson) => lesson.kind));
}

function authoredMajorChapters(course: Course) {
  return course.chapters.filter((chapter) => chapter.major && chapter.lessons.some((lesson) => lesson.quality?.authoredDepth === "authored" || lesson.quality?.authoredDepth === "deep-dive")).map((chapter) => chapter.number);
}

function invalidPrerequisites(course: Course) {
  return course.chapters
    .filter((chapter) => (chapter.prerequisiteChapters ?? []).some((value) => value < 1 || value >= chapter.number))
    .map((chapter) => chapter.number);
}

function flattenProjectRequirements(chapter: Chapter) {
  return (chapter.project?.requirements ?? []).map((text, index) => ({ id: `${chapter.number}-requirement-${index}`, text }));
}

function flattenTests(chapter: Chapter) {
  return [...(chapter.test ?? []), ...(chapter.cumulativeTest ?? [])].map((question, index) => ({ id: `${chapter.number}-test-${index}`, text: question.question }));
}

function flattenLessons(chapter: Chapter, field: "prompt" | "explanation" | "starterCode" | "solution") {
  return chapter.lessons.map((lesson) => ({
    id: lesson.id,
    text: field === "prompt"
      ? lesson.exercise.prompt
      : field === "explanation"
        ? lesson.explanation
        : field === "starterCode"
          ? lesson.exercise.starterCode
          : lesson.exercise.solution,
  }));
}

export function summarizeCourseQuality(course: Course): CourseQualitySummary {
  const chaptersWithDebugging = course.chapters.filter((chapter) => lessonKinds(chapter).has("debug")).map((chapter) => chapter.number);
  const chaptersWithBlankPage = course.chapters.filter((chapter) => {
    const kinds = lessonKinds(chapter);
    return kinds.has("blank-page") || kinds.has("build") || kinds.has("challenge");
  }).map((chapter) => chapter.number);
  const chaptersMissingAcceptanceCriteria = course.chapters.filter((chapter) => !chapter.project?.acceptanceCriteria?.length).map((chapter) => chapter.number);
  const chaptersWithInvalidPrerequisites = invalidPrerequisites(course);
  const repetitiveFindings = [
    ...repeated("lesson-prompt", course.chapters.flatMap((chapter) => flattenLessons(chapter, "prompt"))),
    ...repeated("lesson-explanation", course.chapters.flatMap((chapter) => flattenLessons(chapter, "explanation")), 0.98),
    ...repeated("test-question", course.chapters.flatMap(flattenTests), 0.98),
    ...repeated("project-requirement", course.chapters.flatMap(flattenProjectRequirements), 0.98),
  ].filter((finding) => {
    const firstChapter = Number(finding.firstId.split("-")[1] ?? 0);
    const secondChapter = Number(finding.secondId.split("-")[1] ?? 0);
    return firstChapter !== secondChapter;
  });

  return {
    chaptersWithDebugging,
    chaptersWithBlankPage,
    chaptersMissingAcceptanceCriteria,
    chaptersWithInvalidPrerequisites,
    authoredMajorChapters: authoredMajorChapters(course),
    repetitiveFindings,
  };
}

export function hasMisleadingRuntimeClaim(lesson: Lesson) {
  const text = `${lesson.summary} ${lesson.explanation} ${lesson.exercise.solutionExplanation}`.toLowerCase();
  const structuralOnly = lesson.verification?.includes("structurally-checked") || lesson.verification?.includes("pattern-checked");
  if (!structuralOnly) return false;
  return /(compiled here|compiled in codeforge|compiler verified|compiler checks this automatically|executed by the jvm|run by the jvm here|native c\+\+ runtime executes|this lesson executes java|this lesson executes c\+\+)/.test(text);
}

export function hasEdgeCaseMaterial(lesson: Lesson, project?: ProjectExercise, test?: ChapterTest[]) {
  return Boolean(
    lesson.kind === "edge-case"
    || lesson.examples.some((example) => /edge|empty|blank|missing|duplicate|null|range|boundary/i.test(`${example.title} ${example.explanation} ${example.output}`))
    || project?.edgeCases?.length
    || test?.some((question) => /edge|empty|boundary|duplicate|invalid|blank/i.test(question.question)),
  );
}

export function chapterHasAuthoredDepth(chapter: Chapter, minimum: AuthoredDepth = "authored") {
  const order = { scaffolded: 0, authored: 1, "deep-dive": 2 } as const;
  return chapter.lessons.some((lesson) => order[lesson.quality?.authoredDepth ?? "scaffolded"] >= order[minimum]);
}

export function kindsForChapter(chapter: Chapter): LessonKind[] {
  return chapter.lessons.map((lesson) => lesson.kind ?? "learn");
}
