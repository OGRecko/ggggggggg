import { describe, expect, it } from "vitest";
import { buildCourse } from "../courses/courseFactory";
import { authoredLesson, chapterPlan, projectPlan, q } from "../courses/chapterPlanHelpers";
import { javaCourse } from "../courses/java";
import { chapterHasAuthoredDepth, summarizeCourseQuality } from "./curriculumQuality";

const example = (title: string, code = 'console.log("ready");', output = "ready") => ({
  title,
  code,
  output,
  explanation: `${title} explanation with enough detail to be treated as substantial authored material in the quality audit.`,
  lines: ["Line 1: the code runs the focused example."],
  mistakes: [{ mistake: "typo", error: "error", fix: "fix the typo" }],
});

const exercise = (prompt = "Write one focused solution and print the expected value.") => ({
  prompt,
  starterCode: "// starter code with a visible boundary\n",
  solution: 'console.log("ready");',
  solutionExplanation: "The solution keeps the requested behavior explicit and reviewable.",
  testCases: [{ label: "ready", expected: "ready" }],
  hints: ["Write the smallest working answer."],
  checker: { mode: "patterns" as const, requiredPatterns: ["console\\.log"] },
});

function testQuestion(text = "Which construct produces the visible result?") {
  return q(text, ["console.log", "if", "for", "class"], 0, "console.log creates the visible output in this tiny test course.");
}

function plan(title: string, overrides: Record<string, unknown> = {}) {
  return chapterPlan({
    title,
    focus: `${title} focus with enough explanation to satisfy structural completeness in the test fixture.`,
    concepts: [`${title.toLowerCase()} concept`, `${title.toLowerCase()} syntax`],
    terminology: ["term one", "term two", "term three"],
    lessonKinds: ["learn"],
    prerequisiteChapters: [],
    major: true,
    project: projectPlan({
      title: `${title} project`,
      brief: `${title} project brief with enough text to model a real project application boundary.`,
      scenario: `${title} scenario`,
      requirements: ["Build the feature honestly."],
      milestones: ["Start small.", "Check one boundary.", "Review the result."],
      acceptanceCriteria: ["A project exists.", "The result stays reviewable."],
      edgeCases: ["Handle a missing or invalid case."],
      extensionTasks: ["Modify one requirement after the first passing version."],
      rubric: ["The chapter concept is visible."],
      prompt: `Build the ${title.toLowerCase()} feature and keep the core behavior visible.`,
      starterCode: "// project starter code\n",
      solution: 'console.log("project ready");',
      solutionExplanation: "The project applies the chapter idea in one small scenario.",
      testCases: [{ label: `${title} project`, expected: "project ready" }],
      hints: ["Keep the implementation small."],
      requiredPatterns: ["console\\.log"],
    }),
    test: [testQuestion(), testQuestion("Which step keeps the exercise reviewable?"), testQuestion("Why is the boundary explicit?")],
    ...overrides,
  });
}

function buildTestCourse(chapterPlans: ReturnType<typeof chapterPlan>[], deepDives?: Array<Record<string, unknown>>) {
  return buildCourse({
    id: "javascript",
    name: "Fixture JavaScript",
    version: "test",
    accent: "#000000",
    icon: "T",
    description: "Fixture course for truthful curriculum-quality tests.",
    titles: chapterPlans.map((chapter) => chapter.title),
    chapterPlans,
    deepDives: deepDives as never,
  });
}

describe("curriculum quality semantics", () => {
  it("marks factory-generated lessons as scaffolded by default", () => {
    const course = buildTestCourse([plan("Generated Foundations")]);
    expect(course.chapters[0].lessons.every((lesson) => lesson.quality?.authoredDepth === "scaffolded")).toBe(true);
  });

  it("marks explicit authored lesson overrides as authored", () => {
    const course = buildTestCourse([
      plan("Authored Override", {
        authoredLessons: {
          learn: authoredLesson({
            title: "Authored lesson",
            summary: "This is a genuine authored lesson override rather than generated scaffolding.",
            learningGoals: ["Explain the real chapter boundary", "Read the chapter-specific example", "Practice the chapter-specific rule"],
            explanation: "This authored lesson is intentionally chapter-specific so the factory does not pretend generic scaffolding is bespoke authorship.",
            keywordNotes: ["chapter-specific", "authored", "override"],
            examples: [example("Authored example A"), example("Authored example B", 'console.log("override");', "override")],
            exercise: exercise("Write the chapter-specific authored answer and print the result."),
            recap: ["The lesson is explicitly authored.", "The chapter-specific explanation replaces generic scaffolding.", "The authored depth should be truthful."],
          }),
        },
      }),
    ]);

    expect(course.chapters[0].lessons[0].quality?.authoredDepth).toBe("authored");
    expect(chapterHasAuthoredDepth(course.chapters[0])).toBe(true);
  });

  it("preserves deep-dive labs as deep-dive authored material", () => {
    const chapter = javaCourse.chapters[4];
    const lab = chapter.lessons.find((lesson) => lesson.kind === "deep-dive");
    expect(lab?.quality?.authoredDepth).toBe("deep-dive");
    expect(chapterHasAuthoredDepth(chapter, "deep-dive")).toBe(true);
  });

  it("does not count scaffolded-only major chapters as authored", () => {
    const course = buildTestCourse([plan("Scaffolded Only")]);
    const summary = summarizeCourseQuality(course);
    expect(summary.authoredMajorChapters).toEqual([]);
    expect(summary.chapterDepthCounts.scaffoldedOnlyChapters).toEqual([1]);
  });

  it("produces truthful authored, scaffolded, and deep-dive summary counts", () => {
    const course = buildTestCourse([
      plan("Scaffolded Chapter"),
      plan("Authored Chapter", {
        authoredLessons: {
          learn: authoredLesson({ explanation: "A chapter-specific authored explanation with enough detail to count honestly." }),
        },
      }),
      plan("Deep Dive Chapter"),
    ], [
      {
        chapter: 3,
        title: "Lab: integrated capstone",
        summary: "A small integrated lab.",
        explanation: "This deep-dive lab combines the chapter ideas with an explicit edge path and should count as deep-dive material.",
        keywords: ["integrated", "lab", "deep-dive"],
        code: 'console.log("lab");',
        output: "lab",
        edgeCode: 'console.log("edge");',
        edgeOutput: "edge",
        prompt: "Build the integrated lab and print lab.",
        starterCode: "// integrated lab starter\n",
        solution: 'console.log("lab");',
        expected: "lab",
        required: ["console\\.log"],
        hints: ["Keep the lab small."],
        choices: [{ use: "an integrated lab", insteadOf: "another isolated snippet", reason: "The capstone should combine earlier ideas." }],
        reading: { prompt: "Why is this a deep-dive?", choices: ["It integrates several ideas", "It removes practice", "It has no edge path", "It hides the result"], correctIndex: 0, explanation: "Deep-dive work combines concepts into a more substantial exercise." },
      },
    ]);
    const summary = summarizeCourseQuality(course);

    expect(summary.lessonDepthCounts).toEqual({ scaffolded: 2, authored: 1, "deep-dive": 1 });
    expect(summary.chapterDepthCounts.scaffoldedOnlyChapters).toEqual([1]);
    expect(summary.chapterDepthCounts.authoredChapters).toEqual([2]);
    expect(summary.chapterDepthCounts.deepDiveChapters).toEqual([3]);
    expect(summary.authoredMajorChapters).toEqual([2, 3]);
  });

  it("catches deliberately bad curriculum examples", () => {
    const repeatedPrompt = "Write the exact same repeated answer and print the same repeated value for this deliberately bad curriculum example.";
    const repeatedExplanation = "This explanation is intentionally repeated across chapters to prove that the quality checker can catch boilerplate disguised as authored material in a deliberately bad fixture.";
    const repeatedStarter = "// identical repeated starter code\nconst value = 1;\n";
    const repeatedSolution = 'console.log("identical repeated solution");';
    const repeatedRequirement = "Use the exact same repeated requirement with no chapter-specific adaptation.";

    const badCourse = buildTestCourse([
      plan("Bad One", {
        lessonKinds: ["learn"],
        prerequisiteChapters: [2],
        project: projectPlan({
          title: "Bad project one",
          brief: "Bad project one brief with enough text to remain structurally valid.",
          scenario: "Bad scenario",
          requirements: [repeatedRequirement],
          milestones: ["Only one milestone."],
          acceptanceCriteria: [],
          edgeCases: ["Edge case."],
          extensionTasks: [],
          rubric: ["Rubric"],
          prompt: repeatedPrompt,
          starterCode: repeatedStarter,
          solution: repeatedSolution,
          solutionExplanation: "Repeated bad solution explanation.",
          testCases: [{ label: "bad", expected: "identical repeated solution" }],
          hints: ["Hint"],
          requiredPatterns: ["console\\.log"],
        }),
        authoredLessons: {
          learn: authoredLesson({
            summary: "Repeated bad authored summary.",
            explanation: repeatedExplanation,
            examples: [example("Repeated example one"), example("Repeated example two")],
            exercise: {
              ...exercise(repeatedPrompt),
              starterCode: repeatedStarter,
              solution: repeatedSolution,
            },
          }),
        },
        test: [testQuestion("Repeated question?"), testQuestion("Repeated question?"), testQuestion("Repeated question?")],
      }),
      plan("Bad Two", {
        lessonKinds: ["learn"],
        prerequisiteChapters: [1],
        project: projectPlan({
          title: "Bad project two",
          brief: "Bad project two brief with enough text to remain structurally valid.",
          scenario: "Bad scenario",
          requirements: [repeatedRequirement],
          milestones: ["Only one milestone."],
          acceptanceCriteria: [],
          edgeCases: ["Edge case."],
          extensionTasks: [],
          rubric: ["Rubric"],
          prompt: repeatedPrompt,
          starterCode: repeatedStarter,
          solution: repeatedSolution,
          solutionExplanation: "Repeated bad solution explanation.",
          testCases: [{ label: "bad", expected: "identical repeated solution" }],
          hints: ["Hint"],
          requiredPatterns: ["console\\.log"],
        }),
        authoredLessons: {
          learn: authoredLesson({
            summary: "Repeated bad authored summary.",
            explanation: repeatedExplanation,
            examples: [example("Repeated example one"), example("Repeated example two")],
            exercise: {
              ...exercise(repeatedPrompt),
              starterCode: repeatedStarter,
              solution: repeatedSolution,
            },
          }),
        },
        test: [testQuestion("Repeated question?"), testQuestion("Repeated question?"), testQuestion("Repeated question?")],
      }),
    ]);

    const summary = summarizeCourseQuality(badCourse);
    const repetitionKinds = new Set(summary.repetitiveFindings.map((finding) => finding.kind));

    expect(summary.chaptersWithInvalidPrerequisites).toEqual([1]);
    expect(summary.chaptersMissingAcceptanceCriteria).toEqual([1, 2]);
    expect(summary.educationalCompleteness.chaptersMissingPrediction).toEqual([1, 2]);
    expect(summary.educationalCompleteness.chaptersMissingDebugging).toEqual([1, 2]);
    expect(summary.educationalCompleteness.chaptersMissingBlankPage).toEqual([1, 2]);
    expect(repetitionKinds).toEqual(new Set(["lesson-prompt", "project-prompt", "lesson-explanation", "test-question", "project-requirement", "starter-code", "solution"]));
  });
});
