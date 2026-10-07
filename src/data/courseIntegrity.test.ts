import { describe, expect, it } from "vitest";
import { courseById, courses } from "../courses/catalog";
import { chapterHasAuthoredDepth, hasEdgeCaseMaterial, hasMisleadingRuntimeClaim, summarizeCourseQuality } from "./curriculumQuality";
import { checkRequiredPatterns } from "../utils/exerciseCheck";
import { verifiedModifiedOutputs } from "../courses/modifiedOutputs";
import { coverageAudit } from "./coverageAudit";

describe("CodeForge curriculum integrity", () => {
  it("loads the five supported courses with 25 sequential authored chapters", () => {
    expect(courses.map((course) => course.id)).toEqual(["python", "java", "javascript", "cpp", "htmlcss"]);
    for (const course of courses) {
      expect(courseById(course.id)).toBe(course);
      expect(course.chapters).toHaveLength(25);
      expect(course.chapters.map((chapter) => chapter.number)).toEqual(Array.from({ length: 25 }, (_, index) => index + 1));
      expect(course.chapters.every((chapter) => chapter.available)).toBe(true);
    }
  });

  it("keeps lesson ids unique and lesson orders sequential inside each chapter", () => {
    const ids = courses.flatMap((course) => course.chapters.flatMap((chapter) => chapter.lessons.map((lesson) => lesson.id)));
    expect(new Set(ids).size).toBe(ids.length);
    for (const course of courses) {
      for (const chapter of course.chapters) {
        expect(chapter.lessons.map((lesson) => lesson.order)).toEqual(chapter.lessons.map((_, index) => index + 1));
      }
    }
  });

  it("keeps every lesson educationally populated and every project reviewable", () => {
    for (const course of courses) {
      for (const chapter of course.chapters) {
        expect(chapter.project).toBeDefined();
        expect(chapter.project?.brief.trim().length).toBeGreaterThan(20);
        expect(chapter.test?.length).toBe(3);
        if (course.id === "python") {
          expect(chapter.project?.testCases?.length).toBeGreaterThan(0);
          expect(chapter.project?.hints?.length).toBeGreaterThan(0);
        } else {
          expect(chapter.project?.requirements?.length).toBeGreaterThan(1);
          expect(chapter.project?.acceptanceCriteria?.length).toBeGreaterThan(1);
          expect(chapter.project?.edgeCases?.length).toBeGreaterThan(0);
          if (chapter.number % 5 === 0) expect(chapter.cumulativeTest?.length).toBeGreaterThan(0);
        }
        for (const lesson of chapter.lessons) {
          expect(lesson.summary.trim().length).toBeGreaterThan(20);
          expect(lesson.explanation.trim().length).toBeGreaterThan(40);
          expect(lesson.learningGoals.length).toBeGreaterThanOrEqual(3);
          expect(lesson.keywordNotes.length).toBeGreaterThanOrEqual(3);
          expect(lesson.examples.length).toBeGreaterThanOrEqual(2);
          expect(lesson.readingCheck).toBeDefined();
          expect(lesson.exercise.prompt.trim()).not.toBe("");
          expect(lesson.exercise.solution.trim()).not.toBe("");
          expect(lesson.exercise.hints.length).toBeGreaterThan(0);
          expect(lesson.recap.length).toBeGreaterThanOrEqual(3);
          if (course.id !== "python") {
            expect(lesson.quality?.coveredConcepts.length ?? 0).toBeGreaterThan(0);
            expect(lesson.verification?.length ?? 0).toBeGreaterThan(0);
          }
        }
      }
    }
  });

  it("preserves milestone deep labs for non-Python courses without forcing every chapter to the same lesson count", () => {
    for (const language of ["java", "javascript", "cpp", "htmlcss"] as const) {
      const course = courseById(language)!;
      const lessonCounts = new Set(course.chapters.map((chapter) => chapter.lessons.length));
      expect(lessonCounts.size).toBeGreaterThan(1);
      for (const chapterNumber of [5, 10, 15, 20, 25]) {
        const chapter = course.chapters[chapterNumber - 1];
        expect(chapter.lessons.some((lesson) => lesson.kind === "deep-dive" && /^Lab:/.test(lesson.title))).toBe(true);
      }
    }
  });

  it("never repeats a lesson title inside the same chapter", () => {
    for (const course of courses) {
      for (const chapter of course.chapters) {
        const titles = chapter.lessons.map((lesson) => lesson.title);
        expect(new Set(titles).size).toBe(titles.length);
      }
    }
  });

  it("explains every line of every example across all five courses", () => {
    for (const course of courses) {
      for (const chapter of course.chapters) {
        for (const lesson of chapter.lessons) {
          for (const example of lesson.examples) {
            const codeLines = example.code.split("\n");
            expect(example.lines).toHaveLength(codeLines.length);
            for (const line of example.lines) {
              expect(line.trim().length).toBeGreaterThan(10);
              expect(line).toMatch(/^Line \d+:/);
            }
          }
        }
      }
    }
  });

  it("keeps the authored Java gap lessons present and honest", () => {
    const java = courseById("java")!;
    const chapterBlob = (number: number) => JSON.stringify(java.chapters[number - 1]);

    const javaLesson = (title: string) => {
      for (const chapter of java.chapters) {
        const lesson = chapter.lessons.find((candidate) => candidate.title === title);
        if (lesson) return lesson;
      }
      throw new Error(`missing Java lesson: ${title}`);
    };

    const textBlocks = javaLesson("Text blocks for multi-line text");
    expect(JSON.stringify(textBlocks)).toMatch(/text block/i);
    expect(textBlocks.examples.some((example) => example.code.includes('"""'))).toBe(true);

    expect(chapterBlob(5)).toMatch(/static initializer|static \{/i);
    expect(chapterBlob(5)).toMatch(/instance initializer/i);

    expect(chapterBlob(9)).toMatch(/default method/i);
    expect(chapterBlob(9)).toMatch(/default\s+String/);

    expect(chapterBlob(13)).toMatch(/anonymous/i);

    expect(chapterBlob(21)).toMatch(/module-info|module\s+codeforge/);
    expect(chapterBlob(21)).toMatch(/requires/);
    expect(chapterBlob(21)).toMatch(/exports/);

    for (const number of [5, 7, 9, 13, 21]) {
      const chapter = java.chapters[number - 1];
      const authored = chapter.lessons.filter((lesson) => lesson.quality?.authoredDepth === "authored");
      expect(authored.length).toBeGreaterThan(0);
      for (const lesson of authored) {
        for (const example of lesson.examples) {
          expect(example.lines).toHaveLength(example.code.split("\n").length);
        }
        expect(lesson.exercise.checker?.requiredPatterns?.length ?? 0).toBeGreaterThan(0);
      }
    }
  });

  it("never grades a required construct that the structure checker strips away", () => {
    // checkRequiredPatterns removes comments before matching, so a required pattern whose only
    // alternatives are comment markers can never pass. Comment requirements stay in the
    // learner-facing prompt, requirements, hints, and rubric instead.
    const commentOnlyPattern = (pattern: string) => {
      const tokens = pattern.replace(/\(\?:|\(|=|\)|\(|\|/g, " ").split(/\s+/).filter(Boolean);
      return tokens.length > 0 && tokens.every((token) => token.includes("//") || token.includes("/\\*"));
    };

    for (const course of courses) {
      for (const chapter of course.chapters) {
        const checkers = [
          ...chapter.lessons.map((lesson) => lesson.exercise?.checker),
          (chapter as { project?: { checker?: NonNullable<(typeof chapter.lessons)[number]["exercise"]>["checker"] } }).project?.checker,
        ].filter(Boolean);
        for (const checker of checkers) {
          for (const pattern of checker!.requiredPatterns ?? []) {
            expect(commentOnlyPattern(pattern), `${course.id} chapter ${chapter.number} requires ${pattern}`).toBe(false);
          }
          for (const group of checker!.requiredOneOf ?? []) {
            for (const pattern of group) {
              expect(commentOnlyPattern(pattern), `${course.id} chapter ${chapter.number} requires ${pattern}`).toBe(false);
            }
          }
        }
      }
    }
  });

  it("keeps every extended variation's expected output tied to its verified entry", () => {
    // The extended variation injects one extra statement into the chapter sample. Its expected
    // output is recorded in verifiedModifiedOutputs.ts from a real run (g++ for C++, Node for
    // JavaScript) or a documented hand derivation (Java), never from a guessed annotation.
    const suffixes = ["minimal version", "working program", "target behavior", "repaired version", "extended version"];
    for (const course of courses) {
      for (const chapter of course.chapters) {
        for (const lesson of chapter.lessons) {
          for (const example of lesson.examples) {
            expect(example.output ?? "", `${course.id} ${example.title}`).not.toContain("plus one added result");
          }
          const isModifiedKind = lesson.kind === "modify" || lesson.kind === "design" || lesson.kind === "compare";
          if (!isModifiedKind) continue;
          const anchor = lesson.examples.find((example) => suffixes.some((suffix) => example.title.endsWith(`: ${suffix}`)));
          if (!anchor) continue;
          const sampleTitle = anchor.title.slice(0, anchor.title.lastIndexOf(": "));
          const verified = verifiedModifiedOutputs[course.id]?.[sampleTitle];
          expect(verified, `${course.id} ${lesson.id} has no verified extended output for ${sampleTitle}`).toBeTruthy();
          expect(lesson.exercise.testCases[0]?.expected, `${course.id} ${lesson.id} expected output`).toBe(verified);

          const extended = lesson.examples.find((example) => example.title === `${sampleTitle}: extended version`);
          if (extended) expect(extended.output, `${course.id} ${extended.title}`).toBe(verified);
        }
      }
    }
  });

  it("covers every chapter sample with a verified extended-variation output", () => {
    for (const course of courses.filter((candidate) => candidate.id !== "python")) {
      for (const chapter of course.chapters) {
        const anchor = chapter.lessons
          .flatMap((lesson) => lesson.examples)
          .find((example) => ["minimal version", "working program", "target behavior", "repaired version"].some((suffix) => example.title.endsWith(`: ${suffix}`)));
        if (!anchor) continue;
        const sampleTitle = anchor.title.slice(0, anchor.title.lastIndexOf(": "));
        expect(verifiedModifiedOutputs[course.id]?.[sampleTitle], `${course.id} chapter ${chapter.number} (${sampleTitle})`).toBeTruthy();
      }
    }
  });

  it("keeps the repaired Java and C++ project solutions prompt-faithful and self-consistent", () => {
    // Java and C++ cannot run in this browser, so the strongest honest guarantee is that the
    // shipped answer to each project satisfies the project's own structural check and is not the
    // generated placeholder that older chapters shipped. The C++ answers were additionally
    // compiled and executed during authoring (see cppProjectSolutions.ts).
    for (const courseId of ["java", "cpp"] as const) {
    const course = courseById(courseId)!;
    for (const chapter of course.chapters) {
      const project = chapter.project as { solution?: string; checker?: NonNullable<(typeof chapter.lessons)[number]["exercise"]>["checker"] };
      expect(project.solution, `${courseId} chapter ${chapter.number} has no authored project solution`).toBeTruthy();
      expect(project.solution!, `${courseId} chapter ${chapter.number} still ships the generated placeholder`).not.toContain('"modified"');
      const result = checkRequiredPatterns(project.solution!, project.checker!);
      expect(result.missing, `${courseId} chapter ${chapter.number} project solution misses ${result.missing.join(", ")}`).toEqual([]);
      expect(result.forbidden).toEqual([]);
      expect(result.invalidPatterns).toEqual([]);
      expect(result.emptyPatterns).toEqual([]);

      for (const lesson of chapter.lessons) {
        const checker = lesson.exercise?.checker;
        if (!checker || checker.mode !== "patterns") continue;
        const lessonResult = checkRequiredPatterns(lesson.exercise.solution, checker);
        expect(lessonResult.missing, `${lesson.id} solution misses ${lessonResult.missing.join(", ")}`).toEqual([]);
        expect(lessonResult.forbidden, `${lesson.id} solution uses a forbidden construct`).toEqual([]);
      }
    }
    }
  });

  it("keeps the authored C++ gap lessons present and honest", () => {
    const cpp = courseById("cpp")!;
    const chapterBlob = (number: number) => JSON.stringify(cpp.chapters[number - 1]);

    expect(chapterBlob(7)).toMatch(/const\(\)\s*const|const member function|const-correctness/i);
    expect(chapterBlob(8)).toMatch(/operator\+/);
    expect(chapterBlob(8)).toMatch(/operator<</);
    expect(chapterBlob(10)).toMatch(/std::views::filter/);
    expect(chapterBlob(10)).toMatch(/std::ranges::distance/);
    expect(chapterBlob(13)).toMatch(/std::move/);
    expect(chapterBlob(13)).toMatch(/rule of five/i);
    expect(chapterBlob(14)).toMatch(/std::invalid_argument/);
    expect(chapterBlob(14)).toMatch(/noexcept/);
    expect(chapterBlob(15)).toMatch(/\[limit\]|capture/);
    expect(chapterBlob(15)).toMatch(/std::function/);
    expect(chapterBlob(17)).toMatch(/steady_clock/);
    expect(chapterBlob(17)).toMatch(/duration_cast/);

    for (const number of [7, 8, 10, 13, 14, 15, 17]) {
      const chapter = cpp.chapters[number - 1];
      const authored = chapter.lessons.filter((lesson) => lesson.quality?.authoredDepth === "authored");
      expect(authored.length).toBeGreaterThan(0);
      for (const lesson of authored) {
        for (const example of lesson.examples) {
          expect(example.lines).toHaveLength(example.code.split("\n").length);
          expect(lesson.exercise.checker?.requiredPatterns?.length ?? 0).toBeGreaterThan(0);
        }
      }
    }
  });

  it("keeps Python coverage broad across core and advanced language features", () => {
    const python = courseById("python")!;
    const chapter8 = JSON.stringify(python.chapters[7]);
    const chapter13 = JSON.stringify(python.chapters[12]);
    const chapter18 = JSON.stringify(python.chapters[17]);
    const chapter23 = JSON.stringify(python.chapters[22]);
    const chapter24 = JSON.stringify(python.chapters[23]);

    expect(chapter8).toMatch(/requirements\.txt|pyproject|venv|__init__\.py/i);

    expect(chapter13).toMatch(/zip\(/);
    expect(chapter13).toMatch(/map\(/);
    expect(chapter13).toMatch(/filter\(/);
    expect(chapter13).toMatch(/dictionary comprehension|set comprehensions?/i);

    expect(chapter18).toMatch(/ThreadPoolExecutor|ProcessPoolExecutor|GIL|SimpleQueue/i);

    expect(chapter23).toMatch(/match message|match\/case|structural pattern matching/i);
    expect(chapter23).toMatch(/__iter__/);
    expect(chapter23).toMatch(/__next__/);

    expect(chapter24).toMatch(/pyproject|environment|logging|deployment/i);
  });

  it("keeps the newer Python gap lessons present across the built catalog", () => {
    const python = courseById("python")!;
    const chapterBlob = (number: number) => JSON.stringify(python.chapters[number - 1]);

    expect(chapterBlob(2)).toMatch(/walrus/i);
    expect(chapterBlob(2)).toMatch(/:=/);

    expect(chapterBlob(4)).toMatch(/positional-only/i);
    expect(chapterBlob(4)).toMatch(/keyword-only/i);

    expect(chapterBlob(5)).toMatch(/frozenset/);
    expect(chapterBlob(5)).toMatch(/hashable/i);

    expect(chapterBlob(7)).toMatch(/fromisoformat/);
    expect(chapterBlob(7)).toMatch(/timedelta/);

    expect(chapterBlob(10)).toMatch(/Enum/);

    expect(chapterBlob(13)).toMatch(/itertools/);
    expect(chapterBlob(13)).toMatch(/yield from/);

    expect(chapterBlob(14)).toMatch(/format_exc/);
    expect(chapterBlob(14)).toMatch(/assert /);
    expect(chapterBlob(14)).toMatch(/browser worker/i);

    expect(chapterBlob(19)).toMatch(/__slots__/);
    expect(chapterBlob(19)).toMatch(/weakref/);

    expect(chapterBlob(21)).toMatch(/subprocess\.run/);
    expect(chapterBlob(21)).toMatch(/cannot create operating-system processes/i);
    expect(chapterBlob(21)).toMatch(/shell=True/);
  });

  it("keeps the standard-library workflow lessons present across the built catalog", () => {
    const python = courseById("python")!;
    const chapterBlob = (number: number) => JSON.stringify(python.chapters[number - 1]);

    expect(chapterBlob(6)).toMatch(/textwrap/);
    expect(chapterBlob(6)).toMatch(/Template/);

    expect(chapterBlob(7)).toMatch(/TemporaryDirectory/);
    expect(chapterBlob(7)).toMatch(/glob\.glob/);
    expect(chapterBlob(7)).toMatch(/shutil\.copyfile/);

    expect(chapterBlob(10)).toMatch(/singledispatch/);

    expect(chapterBlob(13)).toMatch(/itemgetter/);
    expect(chapterBlob(13)).toMatch(/attrgetter/);

    expect(chapterBlob(14)).toMatch(/debug specifier/i);
    expect(chapterBlob(14)).toMatch(/format specifier/i);

    expect(chapterBlob(15)).toMatch(/collections\.abc/);
    expect(chapterBlob(15)).toMatch(/Iterable\[int\]/);

    expect(chapterBlob(23)).toMatch(/__match_args__/);
    expect(chapterBlob(23)).toMatch(/contextlib\.suppress|suppress\(/);
    expect(chapterBlob(23)).toMatch(/ExitStack/);

    expect(chapterBlob(24)).toMatch(/configparser/);
    expect(chapterBlob(24)).toMatch(/dictConfig/);
    expect(chapterBlob(24)).toMatch(/DeprecationWarning/);
  });

  it("keeps every Python gadget lesson free of unsupported runtime promises", () => {
    const python = courseById("python")!;
    const blob = JSON.stringify(python);
    expect(blob).not.toMatch(/we (run|deploy|install) (pip|a real database|a server)/i);
    expect(blob).not.toMatch(/CodeForge installs (packages|dependencies)/i);
    expect(blob).not.toMatch(/CodeForge starts (a server|processes)/i);
  });

  it("keeps implementation practice in every non-Python major chapter and debugging coverage across most major chapters", () => {
    for (const course of courses.filter((course) => course.id !== "python")) {
      const quality = summarizeCourseQuality(course);
      const majorChapters = course.chapters.filter((candidate) => candidate.major);
      const chaptersWithDebugOrLab = majorChapters.filter((chapter) => quality.chaptersWithDebugging.includes(chapter.number) || chapter.lessons.some((lesson) => lesson.kind === "deep-dive")).length;
      for (const chapter of majorChapters) {
        expect(quality.chaptersWithBlankPage.includes(chapter.number)).toBe(true);
      }
      expect(chaptersWithDebugOrLab).toBeGreaterThanOrEqual(Math.ceil(majorChapters.length * 0.7));
    }
  });

  it("keeps major chapters edge-case aware, educationally complete, and honest about runtime limits", () => {
    for (const course of courses.filter((course) => course.id !== "python")) {
      const summary = summarizeCourseQuality(course);
      expect(summary.structuralCompleteness.chaptersMissingStructuralCompleteness).toEqual([]);
      expect(summary.educationalCompleteness.chaptersMissingExplanation).toEqual([]);
      expect(summary.educationalCompleteness.chaptersMissingSyntax).toEqual([]);
      expect(summary.educationalCompleteness.chaptersMissingTerminology).toEqual([]);
      expect(summary.educationalCompleteness.chaptersMissingMultipleExamples).toEqual([]);
      expect(summary.educationalCompleteness.chaptersMissingCodeReading).toEqual([]);
      expect(summary.educationalCompleteness.chaptersMissingPrediction).toEqual([]);
      expect(summary.educationalCompleteness.chaptersMissingModification).toEqual([]);
      expect(summary.educationalCompleteness.chaptersMissingBlankPage).toEqual([]);
      expect(summary.educationalCompleteness.chaptersMissingEdgeCase).toEqual([]);
      expect(summary.educationalCompleteness.chaptersMissingAssessment).toEqual([]);
      expect(summary.educationalCompleteness.chaptersMissingProjectApplication).toEqual([]);
      const majorDeepDiveChapters = summary.chapterDepthCounts.deepDiveChapters.filter((chapterNumber) => course.chapters[chapterNumber - 1]?.major);
      expect(summary.authoredMajorChapters).toEqual(expect.arrayContaining(majorDeepDiveChapters));
      expect(summary.chapterDepthCounts.deepDiveChapters).toEqual(expect.arrayContaining([5, 10, 15, 20, 25]));
      for (const chapter of course.chapters.filter((candidate) => candidate.major)) {
        expect(chapterHasAuthoredDepth(chapter, "scaffolded")).toBe(true);
        expect(chapter.prerequisiteChapters?.every((value) => value < chapter.number)).not.toBe(false);
        expect(chapter.lessons.some((lesson) => hasEdgeCaseMaterial(lesson, chapter.project, chapter.test))).toBe(true);
        expect(chapter.lessons.some((lesson) => hasMisleadingRuntimeClaim(lesson))).toBe(false);
      }
    }
  });

  it("keeps Python debugging coverage in authored labs that show a broken program and its repair", () => {
    const python = courseById("python")!;
    const summary = summarizeCourseQuality(python);
    expect(summary.educationalCompleteness.chaptersMissingDebugging).toEqual([]);

    const debugLabs = python.chapters.flatMap((chapter) => chapter.lessons).filter((lesson) => lesson.kind === "debug");
    expect(debugLabs.length).toBeGreaterThanOrEqual(21);

    const exampleCodes: string[] = [];
    for (const lab of debugLabs) {
      // A debugging lab must ship the failing program and the repaired program, each with one
      // authored line note per code line, plus a solution and the expected output it produces.
      expect(lab.examples.length).toBeGreaterThanOrEqual(2);
      expect(lab.exercise.solution.trim().length).toBeGreaterThan(20);
      expect(lab.exercise.testCases[0]?.expected.trim().length).toBeGreaterThan(0);
      for (const example of lab.examples) {
        expect(example.lines.length).toBe(example.code.split("\n").length);
        expect(example.lines.every((line) => line.length > 30)).toBe(true);
        exampleCodes.push(example.code);
      }
    }
    // The labs authored for chapters 3-25 each guide the repair with three hints; the chapter-1
    // debugging lesson predates them, so it is held only to the shared structural checks above.
    const authoredDebugLabs = debugLabs.filter((lesson) => lesson.chapter >= 3);
    expect(authoredDebugLabs.length).toBeGreaterThanOrEqual(21);
    for (const lab of authoredDebugLabs) {
      expect(lab.exercise.hints.length).toBeGreaterThanOrEqual(3);
    }
    // Authored labs describe different defects instead of reusing one example body.
    expect(new Set(exampleCodes).size).toBe(exampleCodes.length);
  });

  it("keeps default scaffold samples aligned with late-course chapter topics", () => {
    const java = courseById("java")!;
    const javaConcurrencyRead = java.chapters[15].lessons.find((lesson) => lesson.kind === "read");
    const javaNetworkingLearn = java.chapters[16].lessons.find((lesson) => lesson.kind === "learn");
    const javaProfessionalBuild = java.chapters[23].lessons.find((lesson) => lesson.kind === "build");
    expect(javaConcurrencyRead?.exercise.solution).toMatch(/AtomicInteger|CompletableFuture|Thread/);
    expect(javaConcurrencyRead?.exercise.solution).not.toMatch(/URI\.create/);
    expect(javaNetworkingLearn?.exercise.solution).toMatch(/URI\.create/);
    expect(javaProfessionalBuild?.exercise.solution).toMatch(/Logger|getLogger|logger/);

    const cpp = courseById("cpp")!;
    const cppPointersRead = cpp.chapters[5].lessons.find((lesson) => lesson.kind === "read");
    const cppDataStructuresRead = cpp.chapters[11].lessons.find((lesson) => lesson.kind === "read");
    const cppProfessionalBuild = cpp.chapters[23].lessons.find((lesson) => lesson.kind === "build");
    expect(cppPointersRead?.exercise.solution).toMatch(/int\*|int&|pointer/);
    expect(cppDataStructuresRead?.exercise.solution).toMatch(/queue|unordered_map/);
    expect(cppProfessionalBuild?.exercise.solution).toMatch(/service-ready|std::cerr/);
  });

  it("detects suspicious repetition without flagging the whole curriculum as boilerplate", () => {
    for (const course of courses.filter((course) => course.id !== "python")) {
      const summary = summarizeCourseQuality(course);
      expect(summary.chaptersMissingAcceptanceCriteria).toEqual([]);
      expect(summary.chaptersWithInvalidPrerequisites).toEqual([]);
      expect(summary.lessonDepthCounts["deep-dive"]).toBeGreaterThanOrEqual(5);
      expect(summary.repetitiveFindings).toEqual([]);
    }
  });

  it("ships lesson and project solutions that pass their own structure checkers", () => {
    // A learner who types the provided answer must not be told that required constructs are missing.
    // This invariant is what caught the chapters whose project shipped an unrelated sample solution.
    const failures: string[] = [];
    for (const course of courses) {
      for (const chapter of course.chapters) {
        const project = chapter.project;
        if (project?.checker && project.solution) {
          const result = checkRequiredPatterns(project.solution, project.checker);
          if (!result.passed) {
            failures.push(`${course.id} ch${chapter.number} project: missing ${result.missing.join(", ")}`);
          }
        }
        for (const lesson of chapter.lessons) {
          const exercise = lesson.exercise;
          if (!exercise?.checker) continue;
          const result = checkRequiredPatterns(exercise.solution, exercise.checker);
          if (!result.passed) {
            failures.push(`${course.id} ${lesson.id}: missing ${result.missing.join(", ")}`);
          }
        }
      }
    }
    expect(failures).toEqual([]);
  });

  it("never requires a construct that comment stripping makes impossible to match", () => {
    // Comment-only requirements are prose in the prompt; a structure checker that demands comment
    // syntax can never pass because the checker strips comments before matching.
    const commentTargeting = /(^|[^:\w])\s*\/\/|\/\\?\*|<!--/;
    const offenders: string[] = [];
    for (const course of courses) {
      for (const chapter of course.chapters) {
        const checkers = [
          { label: `${course.id} ch${chapter.number} project`, checker: chapter.project?.checker },
          ...chapter.lessons.map((lesson) => ({ label: `${course.id} ${lesson.id}`, checker: lesson.exercise?.checker })),
        ];
        for (const { label, checker } of checkers) {
          if (!checker) continue;
          for (const pattern of [...(checker.requiredPatterns ?? []), ...(checker.requiredOneOf ?? []).flat()]) {
            if (commentTargeting.test(pattern)) offenders.push(`${label}: ${pattern}`);
          }
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it("keeps coverage audit conservative about static-only runtimes", () => {
    expect(coverageAudit.Java.every((item) => item.status !== "COMPLETE")).toBe(true);
    expect(coverageAudit["C++"].every((item) => item.status !== "COMPLETE")).toBe(true);
    expect(coverageAudit.Java.some((item) => item.execution.includes("does not claim Java execution"))).toBe(true);
    expect(coverageAudit["C++"].some((item) => item.execution.includes("does not claim C++ execution"))).toBe(true);
  });
});
