import { describe, expect, it } from "vitest";
import { courseById, courses } from "../courses/catalog";
import { firstLessonId, lessonsForChapter, resolveExportTargets } from "./exportTargets";

describe("export target selection", () => {
  it("exports a full course without unrelated content", () => {
    for (const course of courses) {
      const target = resolveExportTargets(course, "course", 1, "");
      expect(target).toHaveLength(25);
      expect(new Set(target.map((chapter) => chapter.number)).size).toBe(25);
    }
  });

  it("exports one chapter only", () => {
    const java = courseById("java")!;
    const target = resolveExportTargets(java, "chapter", 5, "");
    expect(target).toHaveLength(1);
    expect(target[0].number).toBe(5);
    expect(target[0].lessons.every((lesson) => lesson.chapter === 5)).toBe(true);
  });

  it("exports one lesson only", () => {
    const javascript = courseById("javascript")!;
    const lesson = javascript.chapters[4].lessons[0];
    const target = resolveExportTargets(javascript, "lesson", 5, lesson.id);
    expect(target).toHaveLength(1);
    expect(target[0].number).toBe(5);
    expect(target[0].lessons).toEqual([lesson]);
  });

  it("returns the first lesson id and chapter lesson list for every supported language", () => {
    for (const course of courses) {
      expect(firstLessonId(course)).toBe(course.chapters[0].lessons[0].id);
      expect(lessonsForChapter(course, 1)[0].chapter).toBe(1);
    }
  });

  it("does not leak another chapter into a lesson export", () => {
    const cpp = courseById("cpp")!;
    const lesson = cpp.chapters[9].lessons[0];
    const target = resolveExportTargets(cpp, "lesson", 10, lesson.id);
    expect(target[0].lessons.every((candidate) => candidate.chapter === lesson.chapter)).toBe(true);
  });
});
