// @vitest-environment jsdom
/**
 * Sweeps every chapter and lesson page of the javascript course through the real `<App />`, with the
 * real CodeMirror editor, asserting that each page renders its title, its practice prompt, and — when
 * every earlier lesson is complete, as it is by the time a learner reaches it — no lock page.
 *
 * Why one file per course: mounting ~150-225 pages retains roughly a megabyte per mount in jsdom
 * (React's document machinery plus the editor), and the test worker's heap is bounded. Vitest runs
 * each file in its own worker, so splitting by course keeps the peak near 250 MB instead of pushing
 * a single file past two gigabytes. The five files together cover the whole corpus.
 */
import { expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import App from "./App";
import { courseById } from "./courses/catalog";
import { defaultProgress, saveProgress } from "./utils/storage";

it("javascript: every chapter and lesson page renders once its prerequisites are met", () => {
  const course = courseById("javascript")!;
  const completed: string[] = [];
  let chapters = 0;
  let lessons = 0;
  for (const chapter of course.chapters) {
    window.history.pushState({}, "", `/${course.id}/chapter-${chapter.number}`);
    const chapterView = render(<App />);
    expect(chapterView.container.textContent ?? "", `${course.id} chapter ${chapter.number}`).toContain(chapter.title);
    cleanup();
    chapters += 1;

    for (const lesson of chapter.lessons) {
      saveProgress({ ...defaultProgress, completedExercises: [...completed] });
      window.history.pushState({}, "", `/${course.id}/chapter-${chapter.number}/lesson-${lesson.order}`);
      const view = render(<App />);
      const text = view.container.textContent ?? "";
      expect(text, `${lesson.id} did not render its title`).toContain(lesson.title);
      expect(text, `${lesson.id} rendered the lock page although every earlier lesson was complete`).not.toContain("Lesson locked");
      expect(text, `${lesson.id} did not render its practice prompt`).toContain(lesson.exercise.prompt.slice(0, 40));
      cleanup();
      lessons += 1;
      completed.push(lesson.id);
    }
  }
  expect(chapters, "javascript chapter count").toBe(25);
  // A shrinking corpus must fail here rather than quietly sweep less.
  expect(lessons, "javascript lesson count").toBeGreaterThanOrEqual(141);
  console.log("javascript sweep: " + chapters + " chapter pages and " + lessons + " lesson pages rendered");
}, 300_000);
