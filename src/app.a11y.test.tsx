// @vitest-environment jsdom
/**
 * Resilience and structural naming.
 *
 * Two things are checked here, both as DOM facts rather than as verdicts about software I cannot run:
 *
 *   1. A browser that refuses to save (private mode, a full quota) must not lose the learner's work
 *      silently: the app shows its own warning, and the learner can dismiss it.
 *   2. On every page shape, interactive controls carry a name — an aria-label, a title, visible text,
 *      a placeholder, or an associated `<label>` — and each page has exactly one `<h1>`.
 *
 * Point 2 is a *presence* check in the DOM. It is deliberately NOT an accessibility audit and NOT a
 * claim about any assistive technology, which no test in this repository can run: there is no browser
 * and no screen reader here. It catches the silent rot where a new icon-only button or an unlabelled
 * select loses its name.
 */
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import App from "./App";
import { courseById } from "./courses/catalog";
import { clearProgress, defaultProgress, saveProgress } from "./utils/storage";
import type { Course, Lesson } from "./data/types";

const allLessons = (course: Course) => course.chapters.flatMap((chapter) => chapter.lessons);
const route = (path: string) => window.history.pushState({}, "", path);

function seedThrough(courseId: Course["id"], targetLessonId: string) {
  const course = courseById(courseId)!;
  const completed: string[] = [];
  for (const lesson of allLessons(course)) {
    if (lesson.id === targetLessonId) break;
    completed.push(lesson.id);
  }
  saveProgress({ ...defaultProgress, completedExercises: completed });
  return course;
}

beforeAll(() => {
  window.scrollTo = (() => {}) as typeof window.scrollTo;
});

beforeEach(() => {
  clearProgress();
  sessionStorage.clear();
  route("/");
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("resilience", () => {
  it("warns when the browser refuses to save, and dismisses on request", async () => {
    route("/settings");
    const view = render(<App />);
    expect(view.container.querySelector(".save-warning"), "no warning while saving works").toBeNull();

    // A browser that throws on write: private mode, or a full quota.
    const blocked = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("QuotaExceededError");
    });
    fireEvent.click(screen.getByRole("button", { name: /^dark$/i }));

    await waitFor(() => expect(view.container.querySelector(".save-warning"), "the learner is told").not.toBeNull());
    expect(view.container.textContent).toContain("this browser could not save it");
    // The work stays usable in the tab even though it could not be stored.
    expect(document.documentElement.dataset.theme, "the change still applies for this session").toBe("dark");

    blocked.mockRestore();
    fireEvent.click(screen.getByRole("button", { name: /dismiss storage warning/i }));
    expect(view.container.querySelector(".save-warning"), "the warning can be dismissed").toBeNull();
  });

  it("ignores a corrupted export hand-off instead of failing to render", () => {
    sessionStorage.setItem("codeforge-export-preference", "{not json at all");
    route("/export");
    const view = render(<App />);

    expect(view.container.textContent).toContain("Export PDF");
    expect((screen.getByRole("radio", { name: /whole python course/i }) as HTMLInputElement).checked, "the default scope applies").toBe(true);
    expect((screen.getByLabelText(/^Language/, { selector: "select" }) as HTMLSelectElement).value).toBe("python");
  });
});

describe("structural naming", () => {
  const python = courseById("python")!;
  const htmlcss = courseById("htmlcss")!;
  const lessonWithWorker: Lesson = python.chapters[1].lessons[1];
  const htmlcssLesson = htmlcss.chapters[2].lessons[0];

  /** Every element the learner can operate, and the names it offers. */
  const interactive = (root: HTMLElement) => Array.from(root.querySelectorAll<HTMLElement>("button, a[href], select, input, textarea"));

  /**
   * The names an element offers, by the ordinary DOM associations: a wrapping label, a `for`-linked
   * label, an aria-label, an aria-labelledby reference, a title, its own visible text, a placeholder.
   * This is a presence check, not the full accessible-name algorithm.
   */
  const nameOf = (element: HTMLElement) => {
    const id = element.getAttribute("id");
    const byFor = id ? document.querySelector(`label[for="${id}"]`)?.textContent?.trim() ?? null : null;
    return [
      element.getAttribute("aria-label"),
      element.getAttribute("aria-labelledby") ? "referenced" : null,
      element.getAttribute("title"),
      element.textContent?.trim(),
      element.closest("label")?.textContent?.trim(),
      byFor,
      element.getAttribute("placeholder"),
    ].filter((candidate) => candidate && candidate.length > 0).join(" | ");
  };

  const shapes: Array<{ name: string; path: string; seed?: () => void }> = [
    { name: "home", path: "/" },
    { name: "course overview", path: `/${python.id}` },
    { name: "chapter overview", path: `/${python.id}/chapter-3` },
    {
      name: "lesson with a worker practice",
      path: `/${python.id}/chapter-${lessonWithWorker.chapter}/lesson-${lessonWithWorker.order}`,
      seed: () => { seedThrough(python.id, lessonWithWorker.id); },
    },
    {
      name: "HTML/CSS lesson with a preview",
      path: `/${htmlcss.id}/chapter-${htmlcssLesson.chapter}/lesson-${htmlcssLesson.order}`,
      seed: () => { seedThrough(htmlcss.id, htmlcssLesson.id); },
    },
    { name: "progress", path: "/progress" },
    { name: "settings", path: "/settings" },
    { name: "export", path: "/export" },
    { name: "audit", path: "/audit" },
    { name: "not found", path: "/python/chapter-999/lesson-9" },
  ];

  it("gives every interactive control a name and every page one h1", () => {
    const problems: string[] = [];
    for (const shape of shapes) {
      cleanup();
      clearProgress();
      route(shape.path);
      shape.seed?.();
      const view = render(<App />);

      const headings = view.container.querySelectorAll("h1");
      if (headings.length !== 1) problems.push(`${shape.name}: ${headings.length} h1 elements (${Array.from(headings).map((h) => h.textContent).join(" / ")})`);

      for (const element of interactive(view.container)) {
        const tag = element.tagName.toLowerCase();
        if (tag === "input" && (element as HTMLInputElement).type === "hidden") continue;
        if (!nameOf(element)) problems.push(`${shape.name}: <${tag}${element.className ? ` class="${element.className}"` : ""}> has no name`);
      }

      const frame = view.container.querySelector("iframe");
      if (frame && !frame.getAttribute("title")) problems.push(`${shape.name}: iframe without a title`);
    }
    expect(problems, "every listed control must offer a name").toEqual([]);
  });
});
