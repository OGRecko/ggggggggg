import { describe, expect, it } from "vitest";
import { courseById, courses } from "../courses/catalog";
import { chapterHasAuthoredDepth, hasEdgeCaseMaterial, hasMisleadingRuntimeClaim, summarizeCourseQuality } from "./curriculumQuality";
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

  it("keeps major chapters authored, edge-case aware, and honest about runtime limits", () => {
    for (const course of courses.filter((course) => course.id !== "python")) {
      for (const chapter of course.chapters.filter((candidate) => candidate.major)) {
        expect(chapterHasAuthoredDepth(chapter)).toBe(true);
        expect(chapter.prerequisiteChapters?.every((value) => value < chapter.number)).not.toBe(false);
        expect(chapter.lessons.some((lesson) => hasEdgeCaseMaterial(lesson, chapter.project, chapter.test))).toBe(true);
        expect(chapter.lessons.some((lesson) => hasMisleadingRuntimeClaim(lesson))).toBe(false);
      }
    }
  });

  it("detects suspicious repetition without flagging the whole curriculum as boilerplate", () => {
    for (const course of courses.filter((course) => course.id !== "python")) {
      const summary = summarizeCourseQuality(course);
      expect(summary.chaptersMissingAcceptanceCriteria).toEqual([]);
      expect(summary.chaptersWithInvalidPrerequisites).toEqual([]);
      expect(summary.authoredMajorChapters.length).toBeGreaterThanOrEqual(10);
      expect(summary.repetitiveFindings.length).toBeLessThan(24);
    }
  });

  it("keeps coverage audit conservative about static-only runtimes", () => {
    expect(coverageAudit.Java.every((item) => item.status !== "COMPLETE")).toBe(true);
    expect(coverageAudit["C++"].every((item) => item.status !== "COMPLETE")).toBe(true);
    expect(coverageAudit.Java.some((item) => item.execution.includes("does not claim Java execution"))).toBe(true);
    expect(coverageAudit["C++"].some((item) => item.execution.includes("does not claim C++ execution"))).toBe(true);
  });
});
