import type { Chapter, Course, Lesson } from "../data/types";

export type ExportScope = "course" | "chapter" | "lesson";

export function resolveExportTargets(course: Course, scope: ExportScope, chapterNumber: number, lessonId: string): Chapter[] {
  if (scope === "course") return course.chapters.filter((chapter) => chapter.available);
  const chapter = course.chapters.find((candidate) => candidate.number === chapterNumber);
  if (scope === "chapter") return chapter ? [chapter] : [];
  const lesson = course.chapters.flatMap((candidate) => candidate.lessons).find((candidate) => candidate.id === lessonId);
  if (!lesson) return [];
  const lessonChapter = course.chapters.find((candidate) => candidate.number === lesson.chapter);
  return lessonChapter ? [{ ...lessonChapter, lessons: [lesson] }] : [];
}

export function firstLessonId(course: Course) {
  return course.chapters.flatMap((chapter) => chapter.lessons)[0]?.id ?? "";
}

export function lessonsForChapter(course: Course, chapterNumber: number): Lesson[] {
  return course.chapters.find((chapter) => chapter.number === chapterNumber)?.lessons ?? [];
}