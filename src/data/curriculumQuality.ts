import type { AuthoredDepth, Chapter, ChapterTest, Course, Lesson, LessonKind, ProjectExercise } from "./types";

export type RepetitionFinding = {
  kind: "lesson-prompt" | "project-prompt" | "lesson-explanation" | "test-question" | "project-requirement" | "starter-code" | "solution";
  firstId: string;
  secondId: string;
  similarity: number;
  firstText: string;
  secondText: string;
};

export type StructuralCompletenessSummary = {
  chaptersMissingProjectExercise: number[];
  chaptersMissingChapterTests: number[];
  chaptersMissingAcceptanceCriteria: number[];
  chaptersWithInvalidPrerequisites: number[];
  chaptersMissingStructuralCompleteness: number[];
};

export type EducationalCompletenessSummary = {
  chaptersMissingExplanation: number[];
  chaptersMissingSyntax: number[];
  chaptersMissingTerminology: number[];
  chaptersMissingMultipleExamples: number[];
  chaptersMissingCodeReading: number[];
  chaptersMissingPrediction: number[];
  chaptersMissingDebugging: number[];
  chaptersMissingModification: number[];
  chaptersMissingBlankPage: number[];
  chaptersMissingEdgeCase: number[];
  chaptersMissingAssessment: number[];
  chaptersMissingProjectApplication: number[];
  chaptersMissingEducationalCompleteness: number[];
};

export type CourseQualitySummary = {
  chaptersWithDebugging: number[];
  chaptersWithBlankPage: number[];
  chaptersMissingAcceptanceCriteria: number[];
  chaptersWithInvalidPrerequisites: number[];
  authoredMajorChapters: number[];
  lessonDepthCounts: Record<AuthoredDepth, number>;
  chapterDepthCounts: {
    scaffoldedOnlyChapters: number[];
    authoredChapters: number[];
    deepDiveChapters: number[];
  };
  structuralCompleteness: StructuralCompletenessSummary;
  educationalCompleteness: EducationalCompletenessSummary;
  repetitiveFindings: RepetitionFinding[];
};

type EducationalDimension = Exclude<keyof EducationalCompletenessSummary, "chaptersMissingEducationalCompleteness">;

type PreparedRepetitionItem = {
  id: string;
  text: string;
  normalized: string;
  tokens: string[];
  tokenSet: Set<string>;
};

type RepetitionRule = {
  threshold: number;
  minLength: number;
  minTokens: number;
};

const STOP_WORDS = new Set([
  "a", "an", "and", "the", "to", "for", "of", "in", "on", "with", "this", "that", "use", "build", "chapter", "lesson", "code", "program", "result", "working", "real", "language", "requested", "practice", "from", "your", "their", "into", "then", "after", "before", "one", "two", "small", "focus", "using", "write", "create", "value", "values", "print", "return", "then", "line", "lines",
]);

const EDUCATIONAL_DIMENSIONS: Array<{ key: EducationalDimension; check: (chapter: Chapter) => boolean }> = [
  { key: "chaptersMissingExplanation", check: (chapter) => chapter.lessons.some((lesson) => lesson.quality?.explanation ?? lesson.explanation.trim().length > 40) },
  { key: "chaptersMissingSyntax", check: (chapter) => chapter.lessons.some((lesson) => lesson.quality?.syntax ?? Boolean(lesson.exercise.checker || lesson.keywordNotes.length || lesson.exercise.solution.trim())) },
  { key: "chaptersMissingTerminology", check: (chapter) => chapter.lessons.some((lesson) => lesson.quality?.terminology ?? lesson.keywordNotes.length >= 3) },
  { key: "chaptersMissingMultipleExamples", check: (chapter) => chapter.lessons.some((lesson) => lesson.quality?.multipleExamples ?? lesson.examples.length >= 2) },
  { key: "chaptersMissingCodeReading", check: (chapter) => chapter.lessons.some((lesson) => lesson.quality?.codeReading ?? Boolean(lesson.readingCheck || lesson.examples.length)) },
  { key: "chaptersMissingPrediction", check: (chapter) => chapter.lessons.some((lesson) => (lesson.quality?.prediction) ?? (lesson.kind === "predict" || /predict|what .*result|which .*result|which .*output/i.test(`${lesson.title} ${lesson.readingCheck?.prompt ?? ""}`))) },
  { key: "chaptersMissingDebugging", check: (chapter) => chapter.lessons.some((lesson) => (lesson.quality?.debugging) ?? (lesson.kind === "debug" || /debug|repair|fix|broken/i.test(`${lesson.title} ${lesson.exercise.prompt}`))) },
  { key: "chaptersMissingModification", check: (chapter) => chapter.lessons.some((lesson) => lesson.quality?.modification ?? /modify|change|extend|adapt|refactor/i.test(`${lesson.title} ${lesson.summary} ${lesson.exercise.prompt}`)) || Boolean(chapter.project?.extensionTasks?.length) || hasStarterToSolutionDelta(chapter.project) },
  { key: "chaptersMissingBlankPage", check: (chapter) => chapter.lessons.some((lesson) => lesson.quality?.blankPage ?? ["blank-page", "build", "challenge", "integration"].includes(lesson.kind ?? "learn")) },
  { key: "chaptersMissingEdgeCase", check: (chapter) => chapter.lessons.some((lesson) => lesson.quality?.edgeCase ?? hasEdgeCaseMaterial(lesson, chapter.project, chapter.test)) },
  { key: "chaptersMissingAssessment", check: (chapter) => chapter.lessons.some((lesson) => lesson.quality?.assessment ?? Boolean(lesson.readingCheck)) || Boolean(chapter.test?.length || chapter.cumulativeTest?.length) },
  { key: "chaptersMissingProjectApplication", check: (chapter) => Boolean(chapter.project?.prompt.trim()) && (Boolean(chapter.project?.brief.trim()) || Boolean(chapter.project?.testCases?.length)) },
];

const REPETITION_RULES: Record<RepetitionFinding["kind"], RepetitionRule> = {
  "lesson-prompt": { threshold: 0.96, minLength: 90, minTokens: 10 },
  "project-prompt": { threshold: 0.96, minLength: 90, minTokens: 10 },
  "lesson-explanation": { threshold: 0.97, minLength: 140, minTokens: 14 },
  "test-question": { threshold: 0.98, minLength: 15, minTokens: 2 },
  "project-requirement": { threshold: 0.97, minLength: 45, minTokens: 6 },
  "starter-code": { threshold: 0.99, minLength: 30, minTokens: 5 },
  solution: { threshold: 0.99, minLength: 30, minTokens: 5 },
};

function tokenize(text: string) {
  return text
    .toLowerCase()
    .replace(/[`"'“”‘’]/g, "")
    .replace(/[0-9]+/g, " ")
    .replace(/[^a-z0-9_#+.\s-]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
}

function normalizedFingerprint(text: string) {
  return text
    .toLowerCase()
    .replace(/[`"'“”‘’]/g, "")
    .replace(/[0-9]+/g, " ")
    .replace(/[^a-z0-9_#+.\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isGenericScaffold(kind: RepetitionFinding["kind"], text: string) {
  if (kind !== "starter-code") return false;
  const normalized = normalizedFingerprint(text);
  return /build the requested (javascript|java|c\+\+|accessible structure)/.test(normalized)
    || normalized.includes("// build the requested")
    || normalized.includes("<!-- build the requested accessible structure here -->");
}

function prepare(kind: RepetitionFinding["kind"], items: Array<{ id: string; text: string }>): PreparedRepetitionItem[] {
  return items
    .filter((item) => item.text.trim().length > 0 && !isGenericScaffold(kind, item.text))
    .map((item) => {
      const normalized = normalizedFingerprint(item.text);
      const tokens = Array.from(new Set(tokenize(item.text)));
      return { id: item.id, text: item.text, normalized, tokens, tokenSet: new Set(tokens) };
    });
}

function similarity(left: PreparedRepetitionItem, right: PreparedRepetitionItem) {
  if (!left.tokenSet.size || !right.tokenSet.size) return 0;
  let shared = 0;
  for (const token of left.tokenSet) {
    if (right.tokenSet.has(token)) shared += 1;
  }
  return shared / Math.max(left.tokenSet.size, right.tokenSet.size);
}

function chapterNumberFromArtifactId(id: string) {
  const match = id.match(/(?:^|[^0-9])(\d+)(?:[^0-9]|$)/);
  return match ? Number(match[1]) : Number.NaN;
}

function distinctSorted(values: number[]) {
  return [...new Set(values)].sort((left, right) => left - right);
}

function hasStarterToSolutionDelta(exercise?: Pick<ProjectExercise, "starterCode" | "solution">) {
  if (!exercise?.starterCode?.trim() || !exercise.solution?.trim()) return false;
  return normalizedFingerprint(exercise.starterCode) !== normalizedFingerprint(exercise.solution);
}

function authoredDepthForLesson(lesson: Lesson): AuthoredDepth {
  if (lesson.quality?.authoredDepth) return lesson.quality.authoredDepth;
  return lesson.kind === "deep-dive" ? "deep-dive" : "authored";
}

function authoredMajorChapters(course: Course) {
  return course.chapters
    .filter((chapter) => chapter.major && chapter.lessons.some((lesson) => {
      const depth = authoredDepthForLesson(lesson);
      return depth === "authored" || depth === "deep-dive";
    }))
    .map((chapter) => chapter.number);
}

function invalidPrerequisites(course: Course) {
  return course.chapters
    .filter((chapter) => (chapter.prerequisiteChapters ?? []).some((value) => value < 1 || value >= chapter.number))
    .map((chapter) => chapter.number);
}

function flattenProjectPrompts(chapter: Chapter) {
  return chapter.project?.prompt?.trim() ? [{ id: `chapter-${chapter.number}-project-prompt`, text: chapter.project.prompt }] : [];
}

function flattenProjectRequirements(chapter: Chapter) {
  return (chapter.project?.requirements ?? []).map((text, index) => ({ id: `chapter-${chapter.number}-requirement-${index}`, text }));
}

function flattenProjectCode(chapter: Chapter, field: "starterCode" | "solution") {
  const value = chapter.project?.[field];
  return value?.trim() ? [{ id: `chapter-${chapter.number}-project-${field}`, text: value }] : [];
}

function flattenTests(chapter: Chapter) {
  return [...(chapter.test ?? []), ...(chapter.cumulativeTest ?? [])].map((question, index) => ({ id: `chapter-${chapter.number}-test-${index}`, text: question.question }));
}

function flattenLessons(chapter: Chapter, field: "prompt" | "explanation" | "starterCode" | "solution") {
  return chapter.lessons.map((lesson) => ({
    id: `${lesson.id}-${field}`,
    text: field === "prompt"
      ? lesson.exercise.prompt
      : field === "explanation"
        ? lesson.explanation
        : field === "starterCode"
          ? lesson.exercise.starterCode
          : lesson.exercise.solution,
  }));
}

function repeated(kind: RepetitionFinding["kind"], items: Array<{ id: string; text: string }>) {
  const rule = REPETITION_RULES[kind];
  const prepared = prepare(kind, items);
  const findings: RepetitionFinding[] = [];
  const exactGroups = new Map<string, number[]>();
  const tokenFrequency = new Map<string, number>();
  const candidateIndex = new Map<string, number[]>();
  const seenPairs = new Set<string>();

  prepared.forEach((item, index) => {
    exactGroups.set(item.normalized, [...(exactGroups.get(item.normalized) ?? []), index]);
    for (const token of item.tokens) tokenFrequency.set(token, (tokenFrequency.get(token) ?? 0) + 1);
  });

  const informativeTokens = prepared.map((item) => item.tokens
    .slice()
    .sort((left, right) => {
      const frequencyGap = (tokenFrequency.get(left) ?? 0) - (tokenFrequency.get(right) ?? 0);
      if (frequencyGap !== 0) return frequencyGap;
      return right.length - left.length;
    })
    .slice(0, 6));

  informativeTokens.forEach((tokens, index) => {
    for (const token of tokens) candidateIndex.set(token, [...(candidateIndex.get(token) ?? []), index]);
  });

  for (const indexes of exactGroups.values()) {
    if (indexes.length < 2) continue;
    for (let leftIndex = 0; leftIndex < indexes.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < indexes.length; rightIndex += 1) {
        const left = prepared[indexes[leftIndex]];
        const right = prepared[indexes[rightIndex]];
        if (left.normalized.length < Math.max(12, rule.minLength)) continue;
        const pairKey = `${left.id}::${right.id}`;
        seenPairs.add(pairKey);
        findings.push({ kind, firstId: left.id, secondId: right.id, similarity: 1, firstText: left.text, secondText: right.text });
      }
    }
  }

  for (let index = 0; index < prepared.length; index += 1) {
    const left = prepared[index];
    const candidates = new Set<number>();
    for (const token of informativeTokens[index]) {
      for (const otherIndex of candidateIndex.get(token) ?? []) {
        if (otherIndex > index) candidates.add(otherIndex);
      }
    }

    for (const otherIndex of candidates) {
      const right = prepared[otherIndex];
      const pairKey = `${left.id}::${right.id}`;
      if (seenPairs.has(pairKey)) continue;
      if (left.normalized === right.normalized) continue;
      if (Math.min(left.text.trim().length, right.text.trim().length) < rule.minLength) continue;
      if (Math.min(left.tokens.length, right.tokens.length) < rule.minTokens) continue;
      const score = similarity(left, right);
      if (score >= rule.threshold) {
        seenPairs.add(pairKey);
        findings.push({ kind, firstId: left.id, secondId: right.id, similarity: score, firstText: left.text, secondText: right.text });
      }
    }
  }

  return findings.filter((finding) => chapterNumberFromArtifactId(finding.firstId) !== chapterNumberFromArtifactId(finding.secondId));
}

function lessonDepthCounts(course: Course): Record<AuthoredDepth, number> {
  return course.chapters.flatMap((chapter) => chapter.lessons).reduce<Record<AuthoredDepth, number>>((counts, lesson) => {
    counts[authoredDepthForLesson(lesson)] += 1;
    return counts;
  }, { scaffolded: 0, authored: 0, "deep-dive": 0 });
}

function chapterDepthCounts(course: Course) {
  const scaffoldedOnlyChapters = course.chapters
    .filter((chapter) => chapter.lessons.every((lesson) => authoredDepthForLesson(lesson) === "scaffolded"))
    .map((chapter) => chapter.number);
  const authoredChapters = course.chapters
    .filter((chapter) => chapter.lessons.some((lesson) => authoredDepthForLesson(lesson) === "authored"))
    .map((chapter) => chapter.number);
  const deepDiveChapters = course.chapters
    .filter((chapter) => chapter.lessons.some((lesson) => authoredDepthForLesson(lesson) === "deep-dive"))
    .map((chapter) => chapter.number);
  return { scaffoldedOnlyChapters, authoredChapters, deepDiveChapters };
}

export function coverageForChapter(chapter: Chapter) {
  return EDUCATIONAL_DIMENSIONS.reduce<Record<EducationalDimension, boolean>>((coverage, dimension) => {
    coverage[dimension.key] = dimension.check(chapter);
    return coverage;
  }, {
    chaptersMissingExplanation: false,
    chaptersMissingSyntax: false,
    chaptersMissingTerminology: false,
    chaptersMissingMultipleExamples: false,
    chaptersMissingCodeReading: false,
    chaptersMissingPrediction: false,
    chaptersMissingDebugging: false,
    chaptersMissingModification: false,
    chaptersMissingBlankPage: false,
    chaptersMissingEdgeCase: false,
    chaptersMissingAssessment: false,
    chaptersMissingProjectApplication: false,
  });
}

export function summarizeCourseQuality(course: Course): CourseQualitySummary {
  const chaptersWithDebugging = course.chapters.filter((chapter) => coverageForChapter(chapter).chaptersMissingDebugging).map((chapter) => chapter.number);
  const chaptersWithBlankPage = course.chapters.filter((chapter) => coverageForChapter(chapter).chaptersMissingBlankPage).map((chapter) => chapter.number);
  const structuralCompleteness: StructuralCompletenessSummary = {
    chaptersMissingProjectExercise: course.chapters.filter((chapter) => !chapter.project?.prompt?.trim() || !chapter.project?.solution?.trim()).map((chapter) => chapter.number),
    chaptersMissingChapterTests: course.chapters.filter((chapter) => !chapter.test?.length).map((chapter) => chapter.number),
    chaptersMissingAcceptanceCriteria: course.chapters.filter((chapter) => !chapter.project?.acceptanceCriteria?.length).map((chapter) => chapter.number),
    chaptersWithInvalidPrerequisites: invalidPrerequisites(course),
    chaptersMissingStructuralCompleteness: [],
  };
  structuralCompleteness.chaptersMissingStructuralCompleteness = distinctSorted([
    ...structuralCompleteness.chaptersMissingProjectExercise,
    ...structuralCompleteness.chaptersMissingChapterTests,
    ...structuralCompleteness.chaptersMissingAcceptanceCriteria,
    ...structuralCompleteness.chaptersWithInvalidPrerequisites,
  ]);

  const educationalCompleteness = EDUCATIONAL_DIMENSIONS.reduce<EducationalCompletenessSummary>((summary, dimension) => {
    summary[dimension.key] = course.chapters.filter((chapter) => !dimension.check(chapter)).map((chapter) => chapter.number);
    return summary;
  }, {
    chaptersMissingExplanation: [],
    chaptersMissingSyntax: [],
    chaptersMissingTerminology: [],
    chaptersMissingMultipleExamples: [],
    chaptersMissingCodeReading: [],
    chaptersMissingPrediction: [],
    chaptersMissingDebugging: [],
    chaptersMissingModification: [],
    chaptersMissingBlankPage: [],
    chaptersMissingEdgeCase: [],
    chaptersMissingAssessment: [],
    chaptersMissingProjectApplication: [],
    chaptersMissingEducationalCompleteness: [],
  });
  educationalCompleteness.chaptersMissingEducationalCompleteness = distinctSorted(EDUCATIONAL_DIMENSIONS.flatMap((dimension) => educationalCompleteness[dimension.key]));

  const repetitiveFindings = [
    ...repeated("lesson-prompt", course.chapters.flatMap((chapter) => flattenLessons(chapter, "prompt"))),
    ...repeated("project-prompt", course.chapters.flatMap(flattenProjectPrompts)),
    ...repeated("lesson-explanation", course.chapters.flatMap((chapter) => flattenLessons(chapter, "explanation"))),
    ...repeated("test-question", course.chapters.flatMap(flattenTests)),
    ...repeated("project-requirement", course.chapters.flatMap(flattenProjectRequirements)),
    ...repeated("starter-code", [
      ...course.chapters.flatMap((chapter) => flattenLessons(chapter, "starterCode")),
      ...course.chapters.flatMap((chapter) => flattenProjectCode(chapter, "starterCode")),
    ]),
    ...repeated("solution", [
      ...course.chapters.flatMap((chapter) => flattenLessons(chapter, "solution")),
      ...course.chapters.flatMap((chapter) => flattenProjectCode(chapter, "solution")),
    ]),
  ];

  return {
    chaptersWithDebugging,
    chaptersWithBlankPage,
    chaptersMissingAcceptanceCriteria: structuralCompleteness.chaptersMissingAcceptanceCriteria,
    chaptersWithInvalidPrerequisites: structuralCompleteness.chaptersWithInvalidPrerequisites,
    authoredMajorChapters: authoredMajorChapters(course),
    lessonDepthCounts: lessonDepthCounts(course),
    chapterDepthCounts: chapterDepthCounts(course),
    structuralCompleteness,
    educationalCompleteness,
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
    || lesson.examples.some((example) => /edge|empty|blank|missing|duplicate|null|range|boundary|invalid|timeout/i.test(`${example.title} ${example.explanation} ${example.output}`))
    || project?.edgeCases?.length
    || test?.some((question) => /edge|empty|boundary|duplicate|invalid|blank|missing|timeout/i.test(question.question)),
  );
}

export function chapterHasAuthoredDepth(chapter: Chapter, minimum: AuthoredDepth = "authored") {
  const order = { scaffolded: 0, authored: 1, "deep-dive": 2 } as const;
  return chapter.lessons.some((lesson) => order[authoredDepthForLesson(lesson)] >= order[minimum]);
}

export function kindsForChapter(chapter: Chapter): LessonKind[] {
  return chapter.lessons.map((lesson) => lesson.kind ?? "learn");
}
